import { DIR_VECTORS, TILE_SIZE, MAP_TILES } from '../constants';
import { TileMap } from '../map/TileMap';
import {
  Direction,
  TileType,
  type BulletEntity,
  type ExplosionEntity,
  type BaseEntity,
} from '../types/game';
import { intersects } from '../collision/AABB';

export class BulletSystem {
  private mapPixelLimit = MAP_TILES * TILE_SIZE;

  /**
   * 步进子弹逻辑，检测与地图、基地的碰撞
   */
  public update(
    bullets: BulletEntity[],
    map: TileMap,
    base: BaseEntity,
    explosions: ExplosionEntity[],
    dt: number
  ): void {
    for (const b of bullets) {
      if (!b.active) continue;

      const { dx, dy } = DIR_VECTORS[b.direction];
      b.x += dx * b.speed * dt;
      b.y += dy * b.speed * dt;

      // 1. 越界检测
      if (
        b.x < 0 ||
        b.y < 0 ||
        b.x + b.width > this.mapPixelLimit ||
        b.y + b.height > this.mapPixelLimit
      ) {
        b.active = false;
        this.addHitExplosion(explosions, b.x, b.y, false);
        continue;
      }

      // 2. 检测基地碰撞
      if (base.alive && intersects(b, base)) {
        b.active = false;
        base.alive = false;
        this.addHitExplosion(explosions, base.x + 16, base.y + 16, true);
        continue;
      }

      // 3. 检测与地图阻挡物 (Brick, Steel) 碰撞
      this.checkMapCollision(b, map, explosions);
    }
  }

  private checkMapCollision(
    bullet: BulletEntity,
    map: TileMap,
    explosions: ExplosionEntity[]
  ): void {
    const minCol = Math.floor(bullet.x / TILE_SIZE);
    const maxCol = Math.floor((bullet.x + bullet.width - 0.01) / TILE_SIZE);
    const minRow = Math.floor(bullet.y / TILE_SIZE);
    const maxRow = Math.floor((bullet.y + bullet.height - 0.01) / TILE_SIZE);

    let hitOccurred = false;

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const tile = map.getTile(c, r);

        if (tile === TileType.Brick) {
          const currentMask = map.getBrickMask(c, r);
          const newMask = this.damageBrick(currentMask, bullet.direction);
          map.setBrickMask(c, r, newMask);
          hitOccurred = true;
        } else if (tile === TileType.Steel) {
          if (bullet.power >= 2) {
            map.setTile(c, r, TileType.Empty);
          }
          hitOccurred = true;
        }
      }
    }

    if (hitOccurred) {
      bullet.active = false;
      this.addHitExplosion(explosions, bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, false);
    }
  }

  /**
   * 4-bit Quarter Tile 局部砖块破坏算法
   * Bit 0 (1): TL, Bit 1 (2): TR, Bit 2 (4): BL, Bit 3 (8): BR
   */
  private damageBrick(mask: number, dir: Direction): number {
    switch (dir) {
      case Direction.Up:
        // 向上打：优先摧毁下半部分 (BL, BR: 0b1100 = 12)
        if ((mask & 0b1100) !== 0) {
          return mask & 0b0011; // 仅保留上半部
        }
        // 若下半部已被毁，直接全消
        return 0;

      case Direction.Down:
        // 向下打：优先摧毁上半部分 (TL, TR: 0b0011 = 3)
        if ((mask & 0b0011) !== 0) {
          return mask & 0b1100; // 仅保留下半部
        }
        return 0;

      case Direction.Left:
        // 向左打：优先摧毁右半部分 (TR, BR: 0b1010 = 10)
        if ((mask & 0b1010) !== 0) {
          return mask & 0b0101; // 仅保留左半部
        }
        return 0;

      case Direction.Right:
        // 向右打：优先摧毁左半部分 (TL, BL: 0b0101 = 5)
        if ((mask & 0b0101) !== 0) {
          return mask & 0b1010; // 仅保留右半部
        }
        return 0;
    }
  }

  private addHitExplosion(
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
