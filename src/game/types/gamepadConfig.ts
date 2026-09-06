export interface ControlPosition {
  /** 距离相应边缘的距离 (像素) */
  bottom: number;
  /** 左侧控件用 left，右侧控件用 right */
  offsetHorizontal: number;
  /** 缩放比例 (0.75 ~ 1.35) */
  scale: number;
}

export interface GamepadLayoutConfig {
  dpad: ControlPosition;
  fire: ControlPosition;
  opacity: number; // 0.3 ~ 1.0
}

export const DEFAULT_GAMEPAD_CONFIG: GamepadLayoutConfig = {
  dpad: {
    bottom: 36,
    offsetHorizontal: 28,
    scale: 1.0,
  },
  fire: {
    bottom: 36,
    offsetHorizontal: 28,
    scale: 1.0,
  },
  opacity: 0.85,
};

const STORAGE_KEY = 'tank_battle_custom_gamepad_v1';

export function loadGamepadConfig(): GamepadLayoutConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_GAMEPAD_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      dpad: {
        bottom: typeof parsed.dpad?.bottom === 'number' ? parsed.dpad.bottom : DEFAULT_GAMEPAD_CONFIG.dpad.bottom,
        offsetHorizontal:
          typeof parsed.dpad?.offsetHorizontal === 'number'
            ? parsed.dpad.offsetHorizontal
            : DEFAULT_GAMEPAD_CONFIG.dpad.offsetHorizontal,
        scale: typeof parsed.dpad?.scale === 'number' ? parsed.dpad.scale : DEFAULT_GAMEPAD_CONFIG.dpad.scale,
      },
      fire: {
        bottom: typeof parsed.fire?.bottom === 'number' ? parsed.fire.bottom : DEFAULT_GAMEPAD_CONFIG.fire.bottom,
        offsetHorizontal:
          typeof parsed.fire?.offsetHorizontal === 'number'
            ? parsed.fire.offsetHorizontal
            : DEFAULT_GAMEPAD_CONFIG.fire.offsetHorizontal,
        scale: typeof parsed.fire?.scale === 'number' ? parsed.fire.scale : DEFAULT_GAMEPAD_CONFIG.fire.scale,
      },
      opacity: typeof parsed.opacity === 'number' ? parsed.opacity : DEFAULT_GAMEPAD_CONFIG.opacity,
    };
  } catch {
    return DEFAULT_GAMEPAD_CONFIG;
  }
}

export function saveGamepadConfig(config: GamepadLayoutConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // 忽略存储空间限制等异常
  }
}
