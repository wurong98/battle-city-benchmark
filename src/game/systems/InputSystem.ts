import { Direction } from '../types/game';
import { audio } from '../audio/AudioManager';

export interface KeyState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  fire: boolean;
  pause: boolean;
}

export class InputSystem {
  public keys: KeyState = {
    up: false,
    down: false,
    left: false,
    right: false,
    fire: false,
    pause: false,
  };

  // 按下时间栈，用于解决多个方向键同时按住时的优先级切换
  private activeDirections: Direction[] = [];
  public pauseRequested = false;

  constructor() {
    this.bindEvents();
  }

  private bindEvents(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('pointerdown', this.handlePointerDown);
  }

  public destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('pointerdown', this.handlePointerDown);
    this.activeDirections = [];
  }

  private handlePointerDown = (): void => {
    audio.unlock();
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    audio.unlock();

    // 阻止游戏控制按键的浏览器默认滚动行为
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(e.code)) {
      e.preventDefault();
    }

    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.keys.up = true;
        this.pushDirection(Direction.Up);
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.keys.down = true;
        this.pushDirection(Direction.Down);
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.keys.left = true;
        this.pushDirection(Direction.Left);
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.keys.right = true;
        this.pushDirection(Direction.Right);
        break;
      case 'Space':
      case 'KeyJ':
        this.keys.fire = true;
        break;
      case 'KeyP':
        this.pauseRequested = true;
        break;
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.keys.up = false;
        this.removeDirection(Direction.Up);
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.keys.down = false;
        this.removeDirection(Direction.Down);
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.keys.left = false;
        this.removeDirection(Direction.Left);
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.keys.right = false;
        this.removeDirection(Direction.Right);
        break;
      case 'Space':
      case 'KeyJ':
        this.keys.fire = false;
        break;
    }
  };

  private pushDirection(dir: Direction): void {
    if (!this.activeDirections.includes(dir)) {
      this.activeDirections.push(dir);
    }
  }

  private removeDirection(dir: Direction): void {
    this.activeDirections = this.activeDirections.filter((d) => d !== dir);
  }

  /**
   * 获取当前最优先的方向指令，如果没有按住任何方向键则返回 null
   */
  public getCurrentDirection(): Direction | null {
    if (this.activeDirections.length === 0) return null;
    return this.activeDirections[this.activeDirections.length - 1];
  }
}
