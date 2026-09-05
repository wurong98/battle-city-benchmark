import { BULLET_SIZE, BULLET_SPEED } from '../constants';
import { Direction, type BulletEntity, type TankEntity, type Team } from '../types/game';

export class Bullet implements BulletEntity {
  public id: number;
  public x: number;
  public y: number;
  public width: number = BULLET_SIZE;
  public height: number = BULLET_SIZE;
  public active: boolean = true;
  public team: Team;
  public ownerId: number;
  public direction: Direction;
  public speed: number;
  public power: number;

  constructor(
    id: number,
    x: number,
    y: number,
    direction: Direction,
    team: Team,
    ownerId: number,
    speed: number = BULLET_SPEED,
    power: number = 1
  ) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.team = team;
    this.ownerId = ownerId;
    this.speed = speed;
    this.power = power;
  }

  public update(_dt: number): void {
    // 位置更新由 BulletSystem 统一调度处理
  }

  /**
   * 从发射坦克炮口精确计算子弹出生坐标
   */
  public static createFromTank(
    bulletId: number,
    tank: TankEntity,
    bulletSpeed: number = BULLET_SPEED,
    bulletPower: number = 1
  ): Bullet {
    const halfTank = tank.width / 2;
    const halfBullet = BULLET_SIZE / 2;

    let bx = tank.x + halfTank - halfBullet;
    let by = tank.y + halfTank - halfBullet;

    switch (tank.direction) {
      case Direction.Up:
        by = tank.y - BULLET_SIZE;
        break;
      case Direction.Down:
        by = tank.y + tank.height;
        break;
      case Direction.Left:
        bx = tank.x - BULLET_SIZE;
        break;
      case Direction.Right:
        bx = tank.x + tank.width;
        break;
    }

    return new Bullet(
      bulletId,
      bx,
      by,
      tank.direction,
      tank.team,
      tank.id,
      bulletSpeed,
      bulletPower
    );
  }
}
