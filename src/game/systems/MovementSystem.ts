import { DIR_VECTORS, TILE_SIZE } from '../constants';
import { TileMap } from '../map/TileMap';
import { Direction, type TankEntity, type Rect } from '../types/game';
import { intersects } from '../collision/AABB';

export class MovementSystem {
  // 网格吸附允许的最大偏差阈值 (像素)
  private alignThreshold = 6;

  /**
   * 尝试移动坦克
   * @returns boolean 是否实际发生有效位移
   */
  public moveTank(
    tank: TankEntity,
    direction: Direction,
    dt: number,
    map: TileMap,
    otherTanks: TankEntity[] = []
  ): boolean {
    const isTurning = tank.direction !== direction;
    tank.direction = direction;

    // 经典坦克大战关键手感：转向时自动微调对齐到 8px 网格半格/整格轨道
    if (isTurning) {
      this.alignToGrid(tank, direction, map, otherTanks);
    }

    const { dx, dy } = DIR_VECTORS[direction];
    const distance = tank.speed * dt;
    const nextX = tank.x + dx * distance;
    const nextY = tank.y + dy * distance;

    const nextRect: Rect = {
      x: nextX,
      y: nextY,
      width: tank.width,
      height: tank.height,
    };

    // 1. 先验碰撞检测：与地图边界和障碍物
    if (map.collidesWithTank(nextRect)) {
      return false;
    }

    // 2. 先验碰撞检测：与其它坦克
    for (const other of otherTanks) {
      if (other.id !== tank.id && other.active && intersects(nextRect, other)) {
        // 容错兜底：若两辆坦克已经处于重叠状态（例如极端情况下出生在同处），
        // 允许它们向彼此分离（减少重叠面积）的方向移动，防止互锁卡死
        if (intersects(tank, other)) {
          const currentOverlapArea = this.getOverlapArea(tank, other);
          const nextOverlapArea = this.getOverlapArea(nextRect, other);
          if (nextOverlapArea < currentOverlapArea) {
            continue; // 允许分离移动
          }
        }
        return false;
      }
    }

    // 通过检测，正式提交位移
    tank.x = nextX;
    tank.y = nextY;
    return true;
  }

  /**
   * 计算两个重叠矩形的相交面积
   */
  private getOverlapArea(a: Rect, b: Rect): number {
    const overlapX = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
    const overlapY = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
    return overlapX * overlapY;
  }

  /**
   * 网格微吸附逻辑：在垂直移动时对齐 X，水平移动时对齐 Y
   */
  private alignToGrid(
    tank: TankEntity,
    direction: Direction,
    map: TileMap,
    otherTanks: TankEntity[]
  ): void {
    const halfTile = TILE_SIZE / 2; // 8px

    if (direction === Direction.Up || direction === Direction.Down) {
      // 垂直移动，吸附横轴 X
      const nearestX = Math.round(tank.x / halfTile) * halfTile;
      const diffX = Math.abs(tank.x - nearestX);
      if (diffX > 0 && diffX <= this.alignThreshold) {
        const testRect: Rect = {
          x: nearestX,
          y: tank.y,
          width: tank.width,
          height: tank.height,
        };
        if (!map.collidesWithTank(testRect) && !this.collidesWithOthers(tank, testRect, otherTanks)) {
          tank.x = nearestX;
        }
      }
    } else {
      // 水平移动，吸附纵轴 Y
      const nearestY = Math.round(tank.y / halfTile) * halfTile;
      const diffY = Math.abs(tank.y - nearestY);
      if (diffY > 0 && diffY <= this.alignThreshold) {
        const testRect: Rect = {
          x: tank.x,
          y: nearestY,
          width: tank.width,
          height: tank.height,
        };
        if (!map.collidesWithTank(testRect) && !this.collidesWithOthers(tank, testRect, otherTanks)) {
          tank.y = nearestY;
        }
      }
    }
  }

  private collidesWithOthers(
    self: TankEntity,
    rect: Rect,
    others: TankEntity[]
  ): boolean {
    for (const other of others) {
      if (other.id !== self.id && other.active && intersects(rect, other)) {
        return true;
      }
    }
    return false;
  }
}
