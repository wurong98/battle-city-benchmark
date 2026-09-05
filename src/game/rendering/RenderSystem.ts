import { CANVAS_SIZE, TILE_SIZE } from '../constants';
import {
  Direction,
  TileType,
  type GameWorld,
  type TankEntity,
  type BulletEntity,
  type ExplosionEntity,
  type SpawnStarEntity,
} from '../types/game';

export class RenderSystem {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    // 强制开启经典像素风渲染
    this.ctx.imageSmoothingEnabled = false;
  }

  public render(world: GameWorld): void {
    const { ctx } = this;

    // 1. 清屏 (经典黑底)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 2. 绘制底层地图 (Brick, Steel, Water, Ice, Base)
    this.drawBottomMap(world.mapData, world.brickMasks, world.base.alive);

    // 3. 绘制出生星形动画
    this.drawSpawnStars(world.spawnStars);

    // 4. 绘制敌我坦克
    this.drawTanks(world);

    // 5. 绘制子弹
    this.drawBullets(world.bullets);

    // 6. 绘制爆炸效果
    this.drawExplosions(world.explosions);

    // 7. 绘制顶层遮挡地图 (Grass 必须在坦克和子弹之上渲染)
    this.drawTopMap(world.mapData);
  }

  private drawBottomMap(
    mapData: number[][],
    brickMasks: Map<string, number>,
    isBaseAlive: boolean
  ): void {
    const height = mapData.length;
    const width = mapData[0]?.length ?? 0;

    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const type = mapData[r][c];
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;

        switch (type) {
          case TileType.Brick:
            this.drawBrickTile(x, y, brickMasks.get(`${c},${r}`) ?? 0b1111);
            break;
          case TileType.Steel:
            this.drawSteelTile(x, y);
            break;
          case TileType.Water:
            this.drawWaterTile(x, y);
            break;
          case TileType.Ice:
            this.drawIceTile(x, y);
            break;
          case TileType.Base:
            // 基地 2x2, 只在左上角 (12, 24) 绘制整只鹰
            if (c === 12 && r === 24) {
              this.drawEagleBase(x, y, isBaseAlive);
            }
            break;
        }
      }
    }
  }

  private drawTopMap(mapData: number[][]): void {
    const height = mapData.length;
    const width = mapData[0]?.length ?? 0;

    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (mapData[r][c] === TileType.Grass) {
          this.drawGrassTile(c * TILE_SIZE, r * TILE_SIZE);
        }
      }
    }
  }

  private drawBrickTile(x: number, y: number, mask: number): void {
    const { ctx } = this;
    const half = TILE_SIZE / 2; // 8px

    // 绘制 4 个 quarter 块
    const quarters = [
      { maskBit: 0b0001, qx: x, qy: y },
      { maskBit: 0b0010, qx: x + half, qy: y },
      { maskBit: 0b0100, qx: x, qy: y + half },
      { maskBit: 0b1000, qx: x + half, qy: y + half },
    ];

    for (const { maskBit, qx, qy } of quarters) {
      if (!(mask & maskBit)) continue;

      ctx.fillStyle = '#b24400';
      ctx.fillRect(qx, qy, half, half);

      // 砖纹理高光与暗线
      ctx.fillStyle = '#682500';
      ctx.fillRect(qx, qy + 3, half, 1);
      ctx.fillRect(qx, qy + 7, half, 1);

      ctx.fillStyle = '#e87326';
      ctx.fillRect(qx + 1, qy + 1, 2, 1);
      ctx.fillRect(qx + 5, qy + 5, 2, 1);
    }
  }

  private drawSteelTile(x: number, y: number): void {
    const { ctx } = this;
    ctx.fillStyle = '#bcbcbc';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 1, y + 1, 6, 6);
    ctx.fillRect(x + 9, y + 9, 6, 6);

    ctx.fillStyle = '#6d6d6d';
    ctx.fillRect(x + 7, y + 1, 1, 14);
    ctx.fillRect(x + 1, y + 7, 14, 1);
  }

  private drawWaterTile(x: number, y: number): void {
    const { ctx } = this;
    ctx.fillStyle = '#0044cc';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    ctx.fillStyle = '#3388ff';
    ctx.fillRect(x + 2, y + 3, 5, 2);
    ctx.fillRect(x + 9, y + 9, 5, 2);
  }

  private drawIceTile(x: number, y: number): void {
    const { ctx } = this;
    ctx.fillStyle = '#d0e0ec';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 3, y + 3, 4, 1);
    ctx.fillRect(x + 8, y + 11, 5, 1);
  }

  private drawGrassTile(x: number, y: number): void {
    const { ctx } = this;
    ctx.fillStyle = '#267b00';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    ctx.fillStyle = '#52b719';
    for (let i = 1; i < TILE_SIZE; i += 4) {
      ctx.fillRect(x + i, y + 2, 2, 4);
      ctx.fillRect(x + i + 2, y + 9, 2, 5);
    }
  }

  private drawEagleBase(x: number, y: number, isAlive: boolean): void {
    const { ctx } = this;
    const size = TILE_SIZE * 2; // 32x32

    if (isAlive) {
      // 雄鹰基地标志
      ctx.fillStyle = '#d89b00';
      ctx.fillRect(x + 4, y + 4, size - 8, size - 8);

      ctx.fillStyle = '#ffffff';
      // 展翅造型
      ctx.fillRect(x + 2, y + 10, 8, 12);
      ctx.fillRect(x + 22, y + 10, 8, 12);
      ctx.fillRect(x + 10, y + 6, 12, 20);

      // 鹰头与鹰眼
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 13, y + 10, 2, 2);
      ctx.fillRect(x + 17, y + 10, 2, 2);

      ctx.fillStyle = '#e85000';
      ctx.fillRect(x + 14, y + 13, 4, 4);
    } else {
      // 被摧毁的废墟鹰标志
      ctx.fillStyle = '#333333';
      ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
      ctx.fillStyle = '#888888';
      ctx.fillRect(x + 8, y + 8, 16, 16);
      ctx.fillStyle = '#ff3300';
      ctx.fillRect(x + 12, y + 12, 8, 8);
    }
  }

  private drawTanks(world: GameWorld): void {
    // 渲染敌方坦克
    for (const enemy of world.enemies) {
      if (enemy.active) {
        this.drawTank(enemy);
      }
    }

    // 渲染玩家坦克
    if (world.player && world.player.active) {
      this.drawTank(world.player);
    }
  }

  private drawTank(tank: TankEntity): void {
    const { ctx } = this;
    const { x, y, width, height, direction, team, invincibleTimer } = tank;

    // 配色定义
    let bodyColor = '#d89b00'; // 玩家黄金黄
    let trackColor = '#3a5f0b';
    let turretColor = '#fcd116';

    if (team === 'enemy') {
      bodyColor = '#a0a0a0'; // 普通白/银灰敌军
      trackColor = '#444444';
      turretColor = '#dcdcdc';

      if (tank.enemyType === 'Fast') {
        bodyColor = '#3b82f6';
        turretColor = '#93c5fd';
      } else if (tank.enemyType === 'Power') {
        bodyColor = '#ef4444';
        turretColor = '#fca5a5';
      } else if (tank.enemyType === 'Armor') {
        bodyColor = tank.hp > 2 ? '#22c55e' : '#eab308';
        turretColor = '#fef08a';
      }
    }

    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);

    // 根据方向旋转角度
    let angle = 0;
    if (direction === Direction.Down) angle = Math.PI;
    else if (direction === Direction.Left) angle = -Math.PI / 2;
    else if (direction === Direction.Right) angle = Math.PI / 2;
    ctx.rotate(angle);

    const hw = width / 2;
    const hh = height / 2;

    // 1. 左右履带 (相对向上朝向)
    ctx.fillStyle = trackColor;
    const trackWidth = 6;
    ctx.fillRect(-hw, -hh, trackWidth, height);
    ctx.fillRect(hw - trackWidth, -hh, trackWidth, height);

    // 履带轮齿纹理
    ctx.fillStyle = '#000000';
    for (let py = -hh + 2; py < hh; py += 6) {
      ctx.fillRect(-hw + 1, py, trackWidth - 2, 2);
      ctx.fillRect(hw - trackWidth + 1, py, trackWidth - 2, 2);
    }

    // 2. 车身主体
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-hw + trackWidth + 1, -hh + 4, width - 2 * trackWidth - 2, height - 8);

    // 3. 炮塔
    ctx.fillStyle = turretColor;
    ctx.fillRect(-5, -5, 10, 10);

    // 4. 炮管 (朝向正上方)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2, -hh, 4, hh - 2);

    ctx.restore();

    // 5. 无敌闪烁护盾 (如果有)
    if (invincibleTimer > 0) {
      // 0.1s 周期交替黄白色光圈
      const isAlt = Math.floor(invincibleTimer * 15) % 2 === 0;
      ctx.strokeStyle = isAlt ? '#ffffff' : '#00e5ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height / 2, width / 2 + 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  private drawBullets(bullets: BulletEntity[]): void {
    const { ctx } = this;
    ctx.fillStyle = '#ffffff';
    for (const b of bullets) {
      if (!b.active) continue;
      ctx.beginPath();
      ctx.arc(b.x + b.width / 2, b.y + b.height / 2, b.width / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawExplosions(explosions: ExplosionEntity[]): void {
    const { ctx } = this;
    for (const exp of explosions) {
      if (!exp.active) continue;
      const progress = exp.frame / exp.maxFrames;
      const radius = (exp.isBig ? 24 : 12) * (0.4 + progress * 0.6);

      ctx.save();
      ctx.beginPath();
      ctx.arc(exp.x, exp.y, radius, 0, Math.PI * 2);

      // 内黄外红的爆炸渐变
      const gradient = ctx.createRadialGradient(
        exp.x,
        exp.y,
        radius * 0.2,
        exp.x,
        exp.y,
        radius
      );
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.3, '#ffeb3b');
      gradient.addColorStop(0.7, '#ff5722');
      gradient.addColorStop(1, 'rgba(183, 28, 28, 0)');

      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();
    }
  }

  private drawSpawnStars(stars: SpawnStarEntity[]): void {
    const { ctx } = this;
    for (const s of stars) {
      if (!s.active) continue;
      // 星形闪烁
      const size = 16 + Math.sin(s.elapsed * 18) * 8;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x + 16, s.y + 16, size / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}
