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
        return false;
      }
    }

    // 通过检测，正式提交位移
    tank.x = nextX;
    tank.y = nextY;
    return true;
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
