import { MAP_TILES, TILE_SIZE } from '../constants';
import { TileType, type Rect } from '../types/game';

export class TileMap {
  public width = MAP_TILES;
  public height = MAP_TILES;
  public grid: number[][] = [];
  public brickMasks: Map<string, number> = new Map();

  constructor(initialGrid: number[][]) {
    this.load(initialGrid);
  }

  public load(grid: number[][]): void {
    this.grid = grid.map((row) => [...row]);
    this.brickMasks.clear();

    // 初始化所有砖块的 4-bit 掩码为 15 (0b1111)
    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        if (this.grid[r][c] === TileType.Brick) {
          this.brickMasks.set(`${c},${r}`, 0b1111);
        }
      }
    }
  }

  public getTile(col: number, row: number): number {
    if (col < 0 || col >= this.width || row < 0 || row >= this.height) {
      return -1; // 越界
    }
    return this.grid[row][col];
  }

  public setTile(col: number, row: number, type: number): void {
    if (col >= 0 && col < this.width && row >= 0 && row < this.height) {
      this.grid[row][col] = type;
      if (type !== TileType.Brick) {
        this.brickMasks.delete(`${col},${row}`);
      }
    }
  }

  public getBrickMask(col: number, row: number): number {
    return this.brickMasks.get(`${col},${row}`) ?? 0b1111;
  }

  public setBrickMask(col: number, row: number, mask: number): void {
    if (mask <= 0) {
      this.setTile(col, row, TileType.Empty);
    } else {
      this.brickMasks.set(`${col},${row}`, mask);
    }
  }

  /**
   * 检查某个矩形区域是否与地图不可通行图元（砖块、钢块、水流、边界）发生碰撞
   */
  public collidesWithTank(rect: Rect): boolean {
    // 边界检测
    if (
      rect.x < 0 ||
      rect.y < 0 ||
      rect.x + rect.width > this.width * TILE_SIZE ||
      rect.y + rect.height > this.height * TILE_SIZE
    ) {
      return true;
    }

    const minCol = Math.floor(rect.x / TILE_SIZE);
    const maxCol = Math.floor((rect.x + rect.width - 0.01) / TILE_SIZE);
    const minRow = Math.floor(rect.y / TILE_SIZE);
    const maxRow = Math.floor((rect.y + rect.height - 0.01) / TILE_SIZE);

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const tile = this.getTile(c, r);
        // 砖块、钢块、水面不可通过
        if (tile === TileType.Brick) {
          const mask = this.getBrickMask(c, r);
          // 检查与 4 个 8x8 quarter 是否有重叠
          if (this.collidesWithBrickQuarter(rect, c, r, mask)) {
            return true;
          }
        } else if (tile === TileType.Steel || tile === TileType.Water || tile === TileType.Base) {
          return true;
        }
      }
    }

    return false;
  }

  private collidesWithBrickQuarter(rect: Rect, col: number, row: number, mask: number): boolean {
    const tileX = col * TILE_SIZE;
    const tileY = row * TILE_SIZE;
    const half = TILE_SIZE / 2; // 8px

    // 0: TL (0b0001)
    if ((mask & 0b0001) && this.checkOverlap(rect, tileX, tileY, half, half)) return true;
    // 1: TR (0b0010)
    if ((mask & 0b0010) && this.checkOverlap(rect, tileX + half, tileY, half, half)) return true;
    // 2: BL (0b0100)
    if ((mask & 0b0100) && this.checkOverlap(rect, tileX, tileY + half, half, half)) return true;
    // 3: BR (0b1000)
    if ((mask & 0b1000) && this.checkOverlap(rect, tileX + half, tileY + half, half, half)) return true;

    return false;
  }

  private checkOverlap(
    r: Rect,
    x: number,
    y: number,
    w: number,
    h: number
  ): boolean {
    return r.x < x + w && r.x + r.width > x && r.y < y + h && r.y + r.height > y;
  }
}
