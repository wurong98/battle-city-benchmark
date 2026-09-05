import { PLAYER_SPAWN_POINT } from '../constants';
import { intersects } from '../collision/AABB';
import { PlayerTank } from '../entities/PlayerTank';
import { EnemyTank } from '../entities/EnemyTank';
import { audio } from '../audio/AudioManager';
import {
  EnemyType,
  type ExplosionEntity,
  type GameWorld,
} from '../types/game';

export class CombatCollisionSystem {
  public update(world: GameWorld, _dt: number): void {
    const { bullets, enemies, explosions } = world;
    const player = world.player as PlayerTank | null;

    // 1. 子弹与子弹相互对撞 (Bullet vs Bullet)
    for (let i = 0; i < bullets.length; i++) {
      const b1 = bullets[i];
      if (!b1.active) continue;

      for (let j = i + 1; j < bullets.length; j++) {
        const b2 = bullets[j];
        if (!b2.active) continue;

        // 仅当分属不同阵营时相撞消除
        if (b1.team !== b2.team && intersects(b1, b2)) {
          b1.active = false;
          b2.active = false;
          this.addExplosion(explosions, (b1.x + b2.x) / 2, (b1.y + b2.y) / 2, false);
        }
      }
    }

    // 2. 玩家子弹打敌方坦克 (Player Bullet vs Enemy Tank)
    for (const b of bullets) {
      if (!b.active || b.team !== 'player') continue;

      for (const enemy of enemies) {
        if (!enemy.active) continue;

        if (intersects(b, enemy)) {
          b.active = false;
          const et = enemy as EnemyTank;
          const isDead = et.takeDamage(b.power);

          if (isDead) {
            audio.playKillEnemy();
            this.addExplosion(
              explosions,
              enemy.x + enemy.width / 2,
              enemy.y + enemy.height / 2,
              true
            );
            // 经典算分
            this.addScore(world, et.enemyType);
          } else {
            // 受击火花与金属击打音
            audio.playHitSteel();
            this.addExplosion(
              explosions,
              b.x + b.width / 2,
              b.y + b.height / 2,
              false
            );
          }
          break;
        }
      }
    }

    // 3. 敌人子弹打玩家坦克 (Enemy Bullet vs Player Tank)
    if (player && player.active) {
      for (const b of bullets) {
        if (!b.active || b.team !== 'enemy') continue;

        if (intersects(b, player)) {
          b.active = false;

          // 若处于出生护盾期，免疫所有攻击
          if (player.invincibleTimer > 0) {
            audio.playHitSteel();
            this.addExplosion(explosions, b.x, b.y, false);
            continue;
          }

          // 玩家阵亡
          audio.playExplosion(true);
          this.addExplosion(
            explosions,
            player.x + player.width / 2,
            player.y + player.height / 2,
            true
          );

          world.playerLives--;

          if (world.playerLives > 0) {
            // 在出生点复活
            player.reset(PLAYER_SPAWN_POINT.x, PLAYER_SPAWN_POINT.y);
          } else {
            player.active = false;
          }
          break;
        }
      }
    }
  }

  private addScore(world: GameWorld, enemyType: EnemyType): void {
    switch (enemyType) {
      case EnemyType.Basic:
        world.score += 100;
        break;
      case EnemyType.Fast:
        world.score += 200;
        break;
      case EnemyType.Power:
        world.score += 300;
        break;
      case EnemyType.Armor:
        world.score += 400;
        break;
      default:
        world.score += 100;
        break;
    }
  }

  private addExplosion(
    explosions: ExplosionEntity[],
    x: number,
    y: number,
    isBig: boolean
  ): void {
    explosions.push({
      id: Math.random(),
      x,
      y,
      width: isBig ? 32 : 16,
      height: isBig ? 32 : 16,
      active: true,
      frame: 0,
      maxFrames: 4,
      elapsed: 0,
      frameDuration: 0.05,
      isBig,
      update: () => {},
    });
  }
}
