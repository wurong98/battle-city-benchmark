import {
  ENEMY_SPEED_ARMOR,
  ENEMY_SPEED_BASIC,
  ENEMY_SPEED_FAST,
  ENEMY_SPEED_POWER,
  TANK_SIZE,
} from '../constants';
import {
  Direction,
  EnemyType,
  type TankEntity,
  type Team,
} from '../types/game';

export class EnemyTank implements TankEntity {
  public id: number;
  public x: number;
  public y: number;
  public width: number = TANK_SIZE;
  public height: number = TANK_SIZE;
  public active: boolean = true;
  public team: Team = 'enemy';
  public direction: Direction = Direction.Down;
  public speed: number;
  public hp: number;
  public maxHp: number;
  public cooldown: number = 0;
  public invincibleTimer: number = 0;
  public enemyType: EnemyType;

  // AI 决策控制
  public moveTimer: number = 0;
  public changeDirInterval: number = 1.5;
  public shootTimer: number = 0;
  public shootInterval: number = 1.2;

  // 履带动画
  public animFrame: number = 0;
  public animTimer: number = 0;

  constructor(id: number, x: number, y: number, enemyType: EnemyType = EnemyType.Basic) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.enemyType = enemyType;

    switch (enemyType) {
      case EnemyType.Fast:
        this.speed = ENEMY_SPEED_FAST;
        this.hp = 1;
        this.maxHp = 1;
        this.shootInterval = 1.5;
        break;
      case EnemyType.Power:
        this.speed = ENEMY_SPEED_POWER;
        this.hp = 1;
        this.maxHp = 1;
        this.shootInterval = 0.9;
        break;
      case EnemyType.Armor:
        this.speed = ENEMY_SPEED_ARMOR;
        this.hp = 4;
        this.maxHp = 4;
        this.shootInterval = 1.3;
        break;
      case EnemyType.Basic:
      default:
        this.speed = ENEMY_SPEED_BASIC;
        this.hp = 1;
        this.maxHp = 1;
        this.shootInterval = 1.8;
        break;
    }

    // 随机初始移动决策间隔，防止所有敌人同步动作
    this.changeDirInterval = 0.8 + Math.random() * 1.5;
    this.shootInterval = 0.8 + Math.random() * 1.2;
  }

  public update(dt: number): void {
    if (this.cooldown > 0) {
      this.cooldown = Math.max(0, this.cooldown - dt);
    }
  }

  public stepAnimation(dt: number): void {
    this.animTimer += dt;
    if (this.animTimer >= 0.1) {
      this.animTimer = 0;
      this.animFrame = this.animFrame === 0 ? 1 : 0;
    }
  }

  public takeDamage(damage: number = 1): boolean {
    this.hp -= damage;
    if (this.hp <= 0) {
      this.active = false;
      return true; // 死亡
    }
    return false;
  }
}
