import { Direction } from '../types/game';

export interface GamepadInfo {
  connected: boolean;
  id?: string;
  mapping?: string;
}

export type GamepadConnectionListener = (info: GamepadInfo) => void;

/**
 * 把浏览器 Web Gamepad API 桥接到现有 InputSystem 的虚拟输入接口。
 *
 * 设计要点:
 * - 不动 InputSystem,只复用 setVirtualDirection / setVirtualFire 两个入口。
 * - 中性状态(没有任何按键 / 摇杆)时不主动发 null,避免误覆盖键盘输入;
 *   仅在上一帧确实发出过方向时才发 null(释放即归零)。
 * - Start 按钮只在下沿(0->1)触发暂停,避免长按重复触发。
 * - 兜底轮询:同时监听 gamepadconnected 事件 + rAF 轮询,
 *   防止 Safari / Firefox 在页面加载时已连接的手柄不发事件。
 */
const STICK_DEADZONE = 0.3;

// 标准映射下按钮索引(来自 W3C standard gamepad mapping)
const BTN_DPAD_UP = 12;
const BTN_DPAD_DOWN = 13;
const BTN_DPAD_LEFT = 14;
const BTN_DPAD_RIGHT = 15;
const BTN_FIRE_A = 0;
const BTN_START = 9;

export class GamepadBridge {
  private rafId = 0;
  private prevDir: Direction | null = null;
  private prevFire = false;
  private prevStart = false;
  private currentInfo: GamepadInfo = { connected: false };

  private listeners: GamepadConnectionListener[] = [];

  private setDirection: (dir: Direction | null) => void;
  private setFire: (firing: boolean) => void;
  private onPause: () => void;

  constructor(
    setDirection: (dir: Direction | null) => void,
    setFire: (firing: boolean) => void,
    onPause: () => void,
    onConnectionChange: GamepadConnectionListener,
  ) {
    this.setDirection = setDirection;
    this.setFire = setFire;
    this.onPause = onPause;
    this.listeners.push(onConnectionChange);

    window.addEventListener('gamepadconnected', this.handleConnected);
    window.addEventListener('gamepaddisconnected', this.handleDisconnected);

    // 兜底:部分浏览器在页面加载前已连接的手柄不会重发 connected 事件
    const pads = this.readPads();
    const firstLive = pads.find((p) => p && p.connected);
    if (firstLive) {
      this.adopt(firstLive);
    }
  }

  public subscribe(cb: GamepadConnectionListener): () => void {
    this.listeners.push(cb);
    // 立刻同步当前状态,避免新订阅者错过
    cb(this.currentInfo);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private handleConnected = (e: GamepadEvent): void => {
    this.adopt(e.gamepad);
  };

  private handleDisconnected = (e: GamepadEvent): void => {
    // 只在断开的恰好是当前活跃手柄时清状态
    if (!this.currentInfo.connected) return;
    if (this.currentInfo.id && e.gamepad.id !== this.currentInfo.id) return;
    this.dropActive();
  };

  private adopt(gp: Gamepad): void {
    this.currentInfo = {
      connected: true,
      id: gp.id,
      mapping: gp.mapping,
    };
    this.notify();
    this.startPolling();
  }

  private dropActive(): void {
    if (this.prevDir !== null) {
      this.prevDir = null;
      this.setDirection(null);
    }
    if (this.prevFire) {
      this.prevFire = false;
      this.setFire(false);
    }
    this.prevStart = false;
    this.currentInfo = { connected: false };
    this.notify();
  }

  private startPolling(): void {
    cancelAnimationFrame(this.rafId);
    const tick = (): void => {
      const pads = this.readPads();
      const gp = pads.find((p) => p && p.connected) ?? null;

      if (gp) {
        const dir = this.computeDirection(gp);
        if (dir !== this.prevDir) {
          this.prevDir = dir;
          this.setDirection(dir);
        }

        const fire = !!gp.buttons[BTN_FIRE_A]?.pressed;
        if (fire !== this.prevFire) {
          this.prevFire = fire;
          this.setFire(fire);
        }

        const start = !!gp.buttons[BTN_START]?.pressed;
        // Start 仅在按下沿触发一次,避免长按重复切换暂停
        if (start && !this.prevStart) {
          this.onPause();
        }
        this.prevStart = start;
      } else if (this.currentInfo.connected) {
        // 已声明 connected 但轮询时找不到活跃手柄(被拔 / 驱动异常):降级
        this.dropActive();
      }

      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private computeDirection(gp: Gamepad): Direction | null {
    const b = gp.buttons;
    // 优先 D-Pad(数字按钮);摇杆作为补充输入
    if (b[BTN_DPAD_UP]?.pressed) return Direction.Up;
    if (b[BTN_DPAD_DOWN]?.pressed) return Direction.Down;
    if (b[BTN_DPAD_LEFT]?.pressed) return Direction.Left;
    if (b[BTN_DPAD_RIGHT]?.pressed) return Direction.Right;

    const axes = gp.axes;
    if (axes.length >= 2) {
      const x = axes[0];
      const y = axes[1];
      if (Math.abs(x) > STICK_DEADZONE || Math.abs(y) > STICK_DEADZONE) {
        // 取绝对值更大的轴决定方向(4 方向互斥,符合坦克操作习惯)
        if (Math.abs(x) > Math.abs(y)) {
          return x > 0 ? Direction.Right : Direction.Left;
        }
        return y > 0 ? Direction.Down : Direction.Up;
      }
    }
    return null;
  }

  private readPads(): (Gamepad | null)[] {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return [];
    return Array.from(navigator.getGamepads());
  }

  private notify(): void {
    for (const l of this.listeners) l(this.currentInfo);
  }

  public destroy(): void {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('gamepadconnected', this.handleConnected);
    window.removeEventListener('gamepaddisconnected', this.handleDisconnected);
    if (this.currentInfo.connected) {
      if (this.prevDir !== null) {
        this.setDirection(null);
        this.prevDir = null;
      }
      if (this.prevFire) {
        this.setFire(false);
        this.prevFire = false;
      }
    }
    this.listeners = [];
  }
}