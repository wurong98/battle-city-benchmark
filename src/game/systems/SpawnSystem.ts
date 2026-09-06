import { ENEMY_SPAWN_DURATION, ENEMY_SPAWN_POINTS, TANK_SIZE } from '../constants';
import { EnemyTank } from '../entities/EnemyTank';
import { EnemyType, type GameWorld, type SpawnStarEntity, type Rect } from '../types/game';
import { STAGES } from '../map/stages';
import { intersects } from '../collision/AABB';

export class SpawnSystem {
  private spawnPointIndex = 0;
  private spawnCooldown = 1.0; // 敌人生成波次缓冲
  private timer = 0;

  public update(world: GameWorld, dt: number): void {
    // 1. 更新正在播放的出生星形动画
    for (const star of world.spawnStars) {
      if (!star.active) continue;
      star.elapsed += dt;
      if (star.elapsed >= star.duration) {
        star.active = false;

        // 动画结束，正式降临敌人坦克
        const enemyType = star.enemyType ?? EnemyType.Basic;
        const enemy = new EnemyTank(
          Date.now() + Math.random(),
          star.x,
          star.y,
          enemyType
        );
        world.enemies.push(enemy);
      }
    }
    world.spawnStars = world.spawnStars.filter((s) => s.active);

    // 2. 检查是否需要触发新的出生
    this.timer += dt;
    const currentAlive = world.enemies.filter((e) => e.active).length;
    const currentlySpawning = world.spawnStars.length;

    if (
      world.enemiesRemaining > 0 &&
      currentAlive + currentlySpawning < world.maxAliveEnemies &&
      this.timer >= this.spawnCooldown
    ) {
      const availablePoint = this.getAvailableSpawnPoint(world);
      if (availablePoint) {
        this.timer = 0;
        this.scheduleEnemySpawn(world, availablePoint);
      }
    }
  }

  /**
   * 轮询寻找一个当前未被坦克或出生星占用的空闲出生点
   */
  private getAvailableSpawnPoint(world: GameWorld): { x: number; y: number } | null {
    const numPoints = ENEMY_SPAWN_POINTS.length;

    for (let i = 0; i < numPoints; i++) {
      const candidateIndex = (this.spawnPointIndex + i) % numPoints;
      const point = ENEMY_SPAWN_POINTS[candidateIndex];
      const spawnRect: Rect = {
        x: point.x,
        y: point.y,
        width: TANK_SIZE,
        height: TANK_SIZE,
      };

      // 检查是否有正在播放出生动画的星星占用
      const starOverlap = world.spawnStars.some(
        (star) => star.active && intersects(spawnRect, star)
      );
      if (starOverlap) continue;

      // 检查是否有活跃的敌方或玩家坦克停留在出生点区域内
      const allActiveTanks = [
        ...(world.player && world.player.active ? [world.player] : []),
        ...world.enemies.filter((e) => e.active),
      ];
      const tankOverlap = allActiveTanks.some((tank) => intersects(spawnRect, tank));
      if (tankOverlap) continue;

      // 找到可用出生点，更新轮询索引指向下一个位置
      this.spawnPointIndex = (candidateIndex + 1) % numPoints;
      return point;
    }

    // 所有出生点均被占用，推迟生成
    return null;
  }

  private scheduleEnemySpawn(world: GameWorld, point: { x: number; y: number }): void {
    // 获取当前关卡下一个要出场的敌人兵种类型
    const currentStageConfig = STAGES[world.stage - 1] ?? STAGES[0];
    const enemyList = currentStageConfig.enemies;
    const enemyIndex = enemyList.length - world.enemiesRemaining;
    const typeStr = enemyList[enemyIndex] ?? 'Basic';
    const enemyType = (EnemyType[typeStr as keyof typeof EnemyType] ?? EnemyType.Basic);

    world.enemiesRemaining--;

    const star: SpawnStarEntity = {
      id: Math.random(),
      x: point.x,
      y: point.y,
      width: TANK_SIZE,
      height: TANK_SIZE,
      active: true,
      frame: 0,
      elapsed: 0,
      duration: ENEMY_SPAWN_DURATION,
      enemyType,
      update: () => {},
    };

    world.spawnStars.push(star);
  }
}
