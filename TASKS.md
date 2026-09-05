# React Battle City - 任务拆解与自测路线图 (TASKS.md)

## [P0] 基础骨架、地图与玩家移动控制
- [x] **Task 0.1: 项目脚手架与依赖安装**
  - 初始化 Vite + React + TypeScript 环境。
  - 安装 `zustand` 等核心基础包，配置 `tsconfig.json` 路径别名与编译选项。
- [x] **Task 0.2: 基础类型与常量定义**
  - 创建 `src/game/types/game.ts` 与 `src/game/constants.ts`。
  - 定义 `Direction`, `TileType`, `Rect`, `GameState`, `Entity`, `Tank` 等核心类型。
- [x] **Task 0.3: TileMap 数据结构与加载**
  - 创建 `src/game/map/TileMap.ts` 与关卡原始数据 `src/game/map/stages.ts`。
  - 实现 26×26 网格的逻辑解析、边界检查与像素/瓦片坐标双向转换 (`pixelToTile`, `tileToPixel`)。
- [x] **Task 0.4: Fixed Timestep 游戏主循环 (GameLoop)**
  - 创建 `src/game/GameLoop.ts`，基于 `requestAnimationFrame` 实现 60Hz 固定步长累加器算法。
- [x] **Task 0.5: 输入系统 (InputSystem) 与玩家实体**
  - 创建 `src/game/systems/InputSystem.ts`，监听 `keydown`/`keyup`，维护持续按键状态。
  - 创建 `src/game/entities/PlayerTank.ts`。
- [x] **Task 0.6: 碰撞预测与网格吸附 (MovementSystem + CollisionSystem)**
  - 创建 `src/game/collision/AABB.ts`。
  - 实现坦克与地图边界、非通行瓦片 (Brick, Steel, Water) 的预测碰撞。
  - 实现转弯微调吸附 (Grid Alignment)。
- [x] **Task 0.7: Canvas 挂载与基础渲染 (RenderSystem)**
  - 创建 `src/game/rendering/RenderSystem.ts` 与 React 组件 `src/components/GameCanvas.tsx`。
  - 渲染地图瓦片与玩家坦克矩形（像素色块或占位精灵）。
  - **阶段验收标准**: 运行 `npm run dev`，玩家可通过 WASD / 方向键在 26×26 经典地图中自由移动，拐弯平滑不卡墙，严格无穿墙穿模现象。

---

## [P1] 射击系统与地形破坏
- [x] **Task 1.1: Bullet 实体与炮口发射**
  - 创建 `src/game/entities/Bullet.ts`。
  - 根据坦克当前朝向从炮口位置生成子弹，限制同屏单发（升级后支持双发）。
- [x] **Task 1.2: 子弹推进系统 (BulletSystem)**
  - 实现子弹高速匀速移动与越界销毁。
- [x] **Task 1.3: 子弹与瓦片碰撞及 4-bit 砖墙破坏**
  - 实现子弹与 Brick 碰撞，根据命中边缘计算并消除对应 8×8 子块。
  - 实现子弹与 Steel 碰撞销毁但不破坏钢块（普通子弹）。
  - 实现子弹击中 Water/Grass 穿透。
  - **阶段验收标准**: 玩家按空格发射子弹，子弹能按 1/4 区域精准击碎砖块，击中钢墙反弹/销毁，不能穿过砖墙。

---

## [P2] 敌人系统与基础 AI
- [x] **Task 2.1: 敌人实体与生成调度 (SpawnSystem)**
  - 创建 `src/game/entities/EnemyTank.ts`。
  - 地图顶部 3 个生成点轮询调度。
  - 维护最大同屏存活数 `MAX_ENEMY_ALIVE = 4`，总敌人数配额（如 20 只）。
  - 实现生成期间 1 秒无敌保护帧动画。
- [x] **Task 2.2: 敌人 AI 决策状态机 (EnemyAISystem)**
  - 随机移动 + 遇障即时重定向转向。
  - 随机射击定时器 (800ms ~ 2500ms)。
  - 低概率（10%~20%）倾向朝向基地或玩家坐标移动。
- [x] **Task 2.3: 子弹与坦克对抗判定**
  - 玩家子弹击中敌人：扣血、爆炸销毁、计分。
  - 敌人子弹击中玩家：玩家扣血/损失生命。
  - 双方子弹对撞同时销毁。
  - **阶段验收标准**: 顶部稳定刷新敌人坦克，敌人自主移动射击，双方子弹有效击毁对方。

---

## [P3] 胜负闭环、基地系统与 React HUD
- [x] **Task 3.1: 基地实体 (Eagle Base)**
  - 地图底端正中央放置基地实体与防护砖墙。
  - 基地中弹后变为残骸，触发判定。
- [x] **Task 3.2: 爆炸特效系统 (EffectSystem)**
  - 创建 `src/game/entities/Explosion.ts`，多阶段爆炸动画帧循环与自销毁。
- [x] **Task 3.3: 胜负与关卡规则 (GameRuleSystem)**
  - 基地被毁或玩家生命耗尽 -> `GAME_OVER`。
  - 关卡敌人全灭 -> `STAGE_CLEAR` -> 结算并载入下一关。
- [x] **Task 3.4: 低频状态总线与 React HUD / Overlay 呈现**
  - 桥接 GameEngine 事件到 React Store（得分、生命、关卡、敌人数）。
  - 实现右侧经典 HUD 与暂停 (P 键)、GameOver 遮罩与重启功能。
  - 集成 Web Audio 原生 8-bit 音效（开火、击砖、击铁、爆炸、GameOver 音阶）。
  - **阶段验收标准**: 完整的开局、战斗、胜负判定、关卡推进与重开闭环。

---

## [P4] 经典特性还原与细节打磨
- [x] **Task 4.1: 草地遮蔽 (Z-Index Layering) 与冰面/水流效果**
  - Grass 移至渲染最顶层（遮蔽坦克与子弹）。
- [x] **Task 4.2: 敌人兵种分化**
  - 实现 Basic, Fast, Power, Armor 4 类敌人的差异化速度与 HP。
- [ ] **Task 4.3: 道具拾取系统 (Power-Up)**
  - 闪光敌人掉落头盔（无敌）、定时器（冻结敌人）、铲子（铁墙护基地）、手雷（全屏击杀）等。
- [x] **Task 4.4: 像素贴图风格与音效集成**
  - 像素级 Canvas 2D 细节绘制（履带齿轮、双色炮塔、护盾光环、高光砖纹）。
  - 集成 Web Audio 原生音效。
