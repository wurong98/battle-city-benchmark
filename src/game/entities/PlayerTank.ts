import { PLAYER_SPEED, PLAYER_SPAWN_INVINCIBLE, TANK_SIZE } from '../constants';
import { Direction, type TankEntity, type Team } from '../types/game';

export class PlayerTank implements TankEntity {
  public id: number;
  public x: number;
  public y: number;
  public width: number = TANK_SIZE;
  public height: number = TANK_SIZE;
  public active: boolean = true;
  public team: Team = 'player';
  public direction: Direction = Direction.Up;
  public speed: number = PLAYER_SPEED;
  public hp: number = 1;
  public maxHp: number = 1;
  public cooldown: number = 0;
  public invincibleTimer: number = PLAYER_SPAWN_INVINCIBLE;

  // 履带行动动画步进值 (0 或 1)
  public animFrame: number = 0;
  public animTimer: number = 0;

  constructor(id: number, x: number, y: number) {
    this.id = id;
    this.x = x;
    this.y = y;
  }

  public update(dt: number): void {
    if (this.cooldown > 0) {
      this.cooldown = Math.max(0, this.cooldown - dt);
    }
    if (this.invincibleTimer > 0) {
      this.invincibleTimer = Math.max(0, this.invincibleTimer - dt);
    }
  }

  public stepAnimation(dt: number): void {
    this.animTimer += dt;
    if (this.animTimer >= 0.1) {
      this.animTimer = 0;
      this.animFrame = this.animFrame === 0 ? 1 : 0;
    }
  }

  public reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.direction = Direction.Up;
    this.hp = 1;
    this.active = true;
    this.cooldown = 0;
    this.invincibleTimer = PLAYER_SPAWN_INVINCIBLE;
  }
}
