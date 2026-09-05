import { ENEMY_SPAWN_DURATION, ENEMY_SPAWN_POINTS, TANK_SIZE } from '../constants';
import { EnemyTank } from '../entities/EnemyTank';
import { EnemyType, type GameWorld, type SpawnStarEntity } from '../types/game';
import { STAGES } from '../map/stages';

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
      this.timer = 0;
      this.scheduleEnemySpawn(world);
    }
  }

  private scheduleEnemySpawn(world: GameWorld): void {
    // 轮询 3 个出生点
    const point = ENEMY_SPAWN_POINTS[this.spawnPointIndex];
    this.spawnPointIndex = (this.spawnPointIndex + 1) % ENEMY_SPAWN_POINTS.length;

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
