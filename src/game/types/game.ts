/**
 * 经典坦克大战核心枚举与类型定义
 * 采用 const 对象 + type 联合形式，100% 契合标准 ESM 与 erasableSyntaxOnly 规范
 */

export const Direction = {
  Up: 0,
  Down: 1,
  Left: 2,
  Right: 3,
} as const;
export type Direction = (typeof Direction)[keyof typeof Direction];

export const TileType = {
  Empty: 0,
  Brick: 1,
  Steel: 2,
  Water: 3,
  Grass: 4,
  Ice: 5,
  Base: 6,
} as const;
export type TileType = (typeof TileType)[keyof typeof TileType];

export const GameState = {
  MENU: 'MENU',
  READY: 'READY',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  STAGE_CLEAR: 'STAGE_CLEAR',
  GAME_OVER: 'GAME_OVER',
} as const;
export type GameState = (typeof GameState)[keyof typeof GameState];

export const EnemyType = {
  Basic: 'Basic',
  Fast: 'Fast',
  Power: 'Power',
  Armor: 'Armor',
} as const;
export type EnemyType = (typeof EnemyType)[keyof typeof EnemyType];

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Entity extends Rect {
  id: number;
  active: boolean;
  update(dt: number): void;
}

export type Team = 'player' | 'enemy';

export interface TankEntity extends Entity {
  team: Team;
  direction: Direction;
  speed: number;
  hp: number;
  maxHp: number;
  cooldown: number; // 剩余冷却时间 (秒)
  invincibleTimer: number; // 出生无敌时间 (秒)
  enemyType?: EnemyType;
}

export interface BulletEntity extends Entity {
  team: Team;
  ownerId: number;
  direction: Direction;
  speed: number;
  power: number; // 威力: 1=普通，2=破钢墙
}

export interface BaseEntity extends Entity {
  alive: boolean;
}

export interface ExplosionEntity extends Entity {
  frame: number;
  maxFrames: number;
  elapsed: number;
  frameDuration: number;
  isBig: boolean;
}

export interface SpawnStarEntity extends Entity {
  frame: number;
  elapsed: number;
  duration: number;
  enemyType?: EnemyType;
}

// 4-bit Quarter Tile 砖块模型
export interface BrickTileData {
  // 4 bits: bit 0 = TL, bit 1 = TR, bit 2 = BL, bit 3 = BR
  // 1111 (15) = 完整; 0000 (0) = 完全消除
  mask: number;
}

export interface GameWorld {
  player: TankEntity | null;
  enemies: TankEntity[];
  bullets: BulletEntity[];
  explosions: ExplosionEntity[];
  spawnStars: SpawnStarEntity[];
  base: BaseEntity;
  mapData: number[][]; // 26x26 TileType
  brickMasks: Map<string, number>; // key: "x,y", value: 4-bit mask

  // 关卡进度
  stage: number;
  enemiesRemaining: number; // 本关待刷新敌人数
  maxAliveEnemies: number;
  playerLives: number;
  score: number;

  // 运行标记
  isBaseDestroyed: boolean;
}
