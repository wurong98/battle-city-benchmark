import { BULLET_SPEED_FAST } from '../constants';
import { Bullet } from '../entities/Bullet';
import { EnemyTank } from '../entities/EnemyTank';
import { TileMap } from '../map/TileMap';
import { Direction, EnemyType, type GameWorld, type TankEntity } from '../types/game';
import { MovementSystem } from './MovementSystem';

export class EnemyAISystem {
  private movementSystem: MovementSystem;

  constructor(movementSystem: MovementSystem) {
    this.movementSystem = movementSystem;
  }

  public update(world: GameWorld, map: TileMap, dt: number): void {
    const allTanks: TankEntity[] = [];
    if (world.player && world.player.active) {
      allTanks.push(world.player);
    }
    allTanks.push(...world.enemies.filter((e) => e.active));

    for (const enemy of world.enemies) {
      if (!enemy.active) continue;

      const et = enemy as EnemyTank;
      et.update(dt);

      // 1. 方向决策计时
      et.moveTimer += dt;
      if (et.moveTimer >= et.changeDirInterval) {
        et.moveTimer = 0;
        et.changeDirInterval = 1.0 + Math.random() * 1.5;
        et.direction = this.decideDirection(et, world);
      }

      // 2. 尝试向前移动
      const moved = this.movementSystem.moveTank(
        et,
        et.direction,
        dt,
        map,
        allTanks
      );

      if (moved) {
        et.stepAnimation(dt);
      } else {
        // 遇墙/障碍阻挡立即换向
        et.direction = this.pickAlternativeDirection(et.direction);
        et.moveTimer = 0;
      }

      // 3. 射击决策计时
      et.shootTimer += dt;
      if (et.shootTimer >= et.shootInterval) {
        et.shootTimer = 0;
        et.shootInterval = 0.8 + Math.random() * 1.4;

        // 产生敌方子弹
        const speed =
          et.enemyType === EnemyType.Power ? BULLET_SPEED_FAST : undefined;
        const bullet = Bullet.createFromTank(
          Date.now() + Math.random(),
          et,
          speed
        );
        world.bullets.push(bullet);
      }
    }
  }

  private decideDirection(enemy: EnemyTank, world: GameWorld): Direction {
    const rand = Math.random();

    // 15% 倾向攻击基地 (基地在下方)
    if (rand < 0.15 && world.base.alive) {
      if (enemy.y < world.base.y - 32) {
        return Direction.Down;
      } else if (enemy.x < world.base.x) {
        return Direction.Right;
      } else {
        return Direction.Left;
      }
    }

    // 15% 倾向追击玩家
    if (rand < 0.3 && world.player && world.player.active) {
      const dx = world.player.x - enemy.x;
      const dy = world.player.y - enemy.y;
      if (Math.abs(dy) > Math.abs(dx)) {
        return dy > 0 ? Direction.Down : Direction.Up;
      } else {
        return dx > 0 ? Direction.Right : Direction.Left;
      }
    }

    // 70% 概率随机选择或保持
    return this.getRandomDirection();
  }

  private getRandomDirection(): Direction {
    const dirs = [
      Direction.Up,
      Direction.Down,
      Direction.Left,
      Direction.Right,
    ];
    return dirs[Math.floor(Math.random() * dirs.length)];
  }

  private pickAlternativeDirection(current: Direction): Direction {
    const pool = [
      Direction.Up,
      Direction.Down,
      Direction.Left,
      Direction.Right,
    ].filter((d) => d !== current);
    return pool[Math.floor(Math.random() * pool.length)];
  }
}
