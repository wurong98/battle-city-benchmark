import { BASE_POSITION, PLAYER_SPAWN_POINT } from './constants';
import { GameLoop } from './GameLoop';
import { TileMap } from './map/TileMap';
import { STAGES } from './map/stages';
import { Bullet } from './entities/Bullet';
import { PlayerTank } from './entities/PlayerTank';
import { BulletSystem } from './systems/BulletSystem';
import { InputSystem } from './systems/InputSystem';
import { MovementSystem } from './systems/MovementSystem';
import { SpawnSystem } from './systems/SpawnSystem';
import { EnemyAISystem } from './systems/EnemyAISystem';
import { CombatCollisionSystem } from './systems/CombatCollisionSystem';
import { RenderSystem } from './rendering/RenderSystem';
import {
  GameState,
  type GameWorld,
  type TankEntity,
} from './types/game';

export type GameEventCallback = (payload: {
  score: number;
  lives: number;
  stage: number;
  enemiesRemaining: number;
  gameState: string;
}) => void;

export class GameEngine {
  public world: GameWorld;
  public tileMap: TileMap;
  public gameState: string = GameState.READY;

  private inputSystem: InputSystem;
  private movementSystem: MovementSystem;
  private bulletSystem: BulletSystem;
  private spawnSystem: SpawnSystem;
  private enemyAISystem: EnemyAISystem;
  private combatCollisionSystem: CombatCollisionSystem;
  private renderSystem: RenderSystem;
  private gameLoop: GameLoop;
  private eventListeners: GameEventCallback[] = [];

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context is not available');
    }

    // 加载第一关地图
    const stage1 = STAGES[0];
    this.tileMap = new TileMap(stage1.grid);

    // 初始化世界实体
    const player = new PlayerTank(1, PLAYER_SPAWN_POINT.x, PLAYER_SPAWN_POINT.y);

    this.world = {
      player,
      enemies: [],
      bullets: [],
      explosions: [],
      spawnStars: [],
      base: {
        id: 999,
        x: BASE_POSITION.x,
        y: BASE_POSITION.y,
        width: 32,
        height: 32,
        active: true,
        alive: true,
        update: () => {},
      },
      mapData: this.tileMap.grid,
      brickMasks: this.tileMap.brickMasks,
      stage: 1,
      enemiesRemaining: stage1.enemies.length,
      maxAliveEnemies: 4,
      playerLives: 3,
      score: 0,
      isBaseDestroyed: false,
    };

    // 系统装载
    this.inputSystem = new InputSystem();
    this.movementSystem = new MovementSystem();
    this.bulletSystem = new BulletSystem();
    this.spawnSystem = new SpawnSystem();
    this.enemyAISystem = new EnemyAISystem(this.movementSystem);
    this.combatCollisionSystem = new CombatCollisionSystem();
    this.renderSystem = new RenderSystem(ctx);

    this.gameLoop = new GameLoop(this.update, this.render);
  }

  public subscribe(cb: GameEventCallback): () => void {
    this.eventListeners.push(cb);
    this.emitState();
    return () => {
      this.eventListeners = this.eventListeners.filter((l) => l !== cb);
    };
  }

  private lastEmittedState = '';

  private emitState(): void {
    const payload = {
      score: this.world.score,
      lives: this.world.playerLives,
      stage: this.world.stage,
      enemiesRemaining: this.world.enemiesRemaining,
      gameState: this.gameState,
    };
    const key = `${payload.score}-${payload.lives}-${payload.stage}-${payload.enemiesRemaining}-${payload.gameState}`;
    if (key === this.lastEmittedState) return;
    this.lastEmittedState = key;

    for (const listener of this.eventListeners) {
      listener(payload);
    }
  }

  public start(): void {
    this.gameState = GameState.PLAYING;
    this.emitState();
    this.gameLoop.start();
  }

  public pause(): void {
    if (this.gameState === GameState.PLAYING) {
      this.gameState = GameState.PAUSED;
      this.emitState();
    }
  }

  public resume(): void {
    if (this.gameState === GameState.PAUSED) {
      this.gameState = GameState.PLAYING;
      this.emitState();
    }
  }

  public restart(): void {
    const stage1 = STAGES[0];
    this.tileMap.load(stage1.grid);
    this.world.mapData = this.tileMap.grid;
    this.world.brickMasks = this.tileMap.brickMasks;
    this.world.score = 0;
    this.world.playerLives = 3;
    this.world.stage = 1;
    this.world.enemiesRemaining = stage1.enemies.length;
    this.world.enemies = [];
    this.world.bullets = [];
    this.world.explosions = [];
    this.world.spawnStars = [];
    this.world.base.alive = true;
    this.world.isBaseDestroyed = false;

    if (this.world.player) {
      (this.world.player as PlayerTank).reset(
        PLAYER_SPAWN_POINT.x,
        PLAYER_SPAWN_POINT.y
      );
    }

    this.gameState = GameState.PLAYING;
    this.emitState();
  }

  public destroy(): void {
    this.gameLoop.stop();
    this.inputSystem.destroy();
    this.eventListeners = [];
  }

  // 60Hz 确定性物理更新
  private update = (dt: number): void => {
    // 检查暂停键
    if (this.inputSystem.pauseRequested) {
      this.inputSystem.pauseRequested = false;
      if (this.gameState === GameState.PLAYING) {
        this.pause();
        return;
      } else if (this.gameState === GameState.PAUSED) {
        this.resume();
        return;
      }
    }

    if (this.gameState !== GameState.PLAYING) {
      return;
    }

    // 1. 玩家输入与移动逻辑
    const player = this.world.player as PlayerTank | null;
    if (player && player.active) {
      player.update(dt);
      const dir = this.inputSystem.getCurrentDirection();
      if (dir !== null) {
        const otherTanks: TankEntity[] = this.world.enemies;
        const moved = this.movementSystem.moveTank(
          player,
          dir,
          dt,
          this.tileMap,
          otherTanks
        );
        if (moved) {
          player.stepAnimation(dt);
        }
      }

      // 玩家开火逻辑
      if (this.inputSystem.keys.fire && player.canFire(this.world.bullets)) {
        const bullet = Bullet.createFromTank(Date.now() + Math.random(), player);
        this.world.bullets.push(bullet);
        player.triggerFireCooldown();
      }
    }

    // 2. 敌人生成调度
    this.spawnSystem.update(this.world, dt);

    // 3. 敌人 AI 决策与移动
    this.enemyAISystem.update(this.world, this.tileMap, dt);

    // 4. 子弹系统推进与地图破坏
    this.bulletSystem.update(
      this.world.bullets,
      this.tileMap,
      this.world.base,
      this.world.explosions,
      dt
    );

    // 5. 战斗对抗碰撞 (Bullet vs Bullet, Bullet vs Tank)
    this.combatCollisionSystem.update(this.world, dt);

    // 6. 特效与爆炸步进
    for (const exp of this.world.explosions) {
      if (!exp.active) continue;
      exp.elapsed += dt;
      if (exp.elapsed >= exp.frameDuration) {
        exp.elapsed = 0;
        exp.frame++;
        if (exp.frame >= exp.maxFrames) {
          exp.active = false;
        }
      }
    }

    // 7. 清理失效实体 (Bullets, Enemies, Explosions)
    this.world.bullets = this.world.bullets.filter((b) => b.active);
    this.world.enemies = this.world.enemies.filter((e) => e.active);
    this.world.explosions = this.world.explosions.filter((e) => e.active);

    // 8. 胜负规则判定
    // 基地被毁
    if (!this.world.base.alive && !this.world.isBaseDestroyed) {
      this.world.isBaseDestroyed = true;
      this.gameState = GameState.GAME_OVER;
      this.emitState();
      return;
    }

    // 玩家命尽
    if (this.world.playerLives <= 0 && this.gameState === GameState.PLAYING) {
      this.gameState = GameState.GAME_OVER;
      this.emitState();
      return;
    }

    // 敌人清空 -> 通关
    if (
      this.world.enemiesRemaining === 0 &&
      this.world.enemies.length === 0 &&
      this.world.spawnStars.length === 0 &&
      this.gameState === GameState.PLAYING
    ) {
      this.gameState = GameState.STAGE_CLEAR;
      this.emitState();
      return;
    }

    // 同步给 UI（如果分数或剩余敌人变化）
    this.emitState();
  };

  // 渲染函数
  private render = (_alpha: number): void => {
    this.renderSystem.render(this.world);
  };
}
