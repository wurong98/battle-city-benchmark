/**
 * 经典坦克大战常量配置
 */
import { Direction } from './types/game';

// 网格与尺寸
export const MAP_TILES = 26; // 26x26 tiles
export const TILE_SIZE = 16; // 16x16 pixels per tile
export const CANVAS_SIZE = MAP_TILES * TILE_SIZE; // 416x416 px 逻辑分辨率
export const CANVAS_SCALE = 2; // 默认 2 倍像素缩放 (832x832 显示)

// 坦克与子弹尺寸
export const TANK_SIZE = 30; // 略小于 32px，便于在 2 个 tile 宽度的通道中灵活穿梭
export const BULLET_SIZE = 6; // 6x6 px 子弹
export const BASE_SIZE = 32; // 基地 32x32 (2x2 tiles)

// 速度 (像素/秒)
export const PLAYER_SPEED = 90;
export const ENEMY_SPEED_BASIC = 70;
export const ENEMY_SPEED_FAST = 115;
export const ENEMY_SPEED_POWER = 70;
export const ENEMY_SPEED_ARMOR = 65;

export const BULLET_SPEED = 240;
export const BULLET_SPEED_FAST = 320;

// 时间与冷却 (秒)
export const PLAYER_FIRE_COOLDOWN = 0.28;
export const PLAYER_SPAWN_INVINCIBLE = 3.0; // 玩家复活 3 秒护盾
export const ENEMY_SPAWN_DURATION = 1.0; // 敌人出生星形动画 1 秒
export const FIXED_DT = 1 / 60; // 60Hz 确定性物理更新步长

// 方向向量转换
export const DIR_VECTORS: Record<Direction, { dx: number; dy: number }> = {
  [Direction.Up]: { dx: 0, dy: -1 },
  [Direction.Down]: { dx: 0, dy: 1 },
  [Direction.Left]: { dx: -1, dy: 0 },
  [Direction.Right]: { dx: 1, dy: 0 },
};

// 出生点预设 (网格坐标转换到像素坐标)
export const ENEMY_SPAWN_POINTS = [
  { x: 0 * TILE_SIZE + 1, y: 0 * TILE_SIZE + 1 }, // 顶部左侧 (0, 0)
  { x: 12 * TILE_SIZE + 1, y: 0 * TILE_SIZE + 1 }, // 顶部中间 (12, 0)
  { x: 24 * TILE_SIZE + 1, y: 0 * TILE_SIZE + 1 }, // 顶部右侧 (24, 0)
];

// 玩家出生点 (底部左侧，靠近基地)
export const PLAYER_SPAWN_POINT = {
  x: 8 * TILE_SIZE + 1,
  y: 24 * TILE_SIZE + 1,
};

// 基地位置 (底部中间 12, 24)
export const BASE_POSITION = {
  x: 12 * TILE_SIZE,
  y: 24 * TILE_SIZE,
};
