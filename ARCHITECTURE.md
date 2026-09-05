# React Battle City - 系统架构与规范约束 (ARCHITECTURE.md)

## 1. 核心架构模式 (Engine-Driven Architecture)

- **UI 层 (React)**: 仅负责管理与呈现低频 Session 状态（`score`, `lives`, `stage`, `gameState`, `enemiesRemaining`）。
- **引擎层 (GameEngine)**: 独立于 React 生命周期，拥有游戏全局状态 `GameWorld`，采用 Fixed Timestep (60Hz) 执行物理与逻辑更新循环。
- **渲染层 (RenderSystem + Canvas 2D)**: 作为只读消费者读取 `GameWorld` 进行每帧渲染，严格禁止任何逻辑状态的修改。

```text
[React HUD / Menus] <--- (低频 Event Bus: score, stage, lives, gameOver) --- [GameEngine]
                                                                                   │
┌──────────────────────────────────────────────────────────────────────────────────┘
▼
[Fixed GameLoop (60Hz)]
  ├── 1. InputSystem      (捕获并维护键盘输入按键状态)
  ├── 2. EnemyAISystem    (敌人随机巡逻/瞄准/射击决策)
  ├── 3. MovementSystem   (位置预测、网格吸附 Grid Alignment)
  ├── 4. BulletSystem     (子弹推进与生存期管理)
  ├── 5. CollisionSystem  (Tank×Map, Bullet×Map, Bullet×Tank, Bullet×Bullet, Bullet×Base)
  ├── 6. SpawnSystem      (玩家复活无敌帧、敌人顶部3点生成与上限管理)
  ├── 7. EffectSystem     (爆炸动画、闪烁无敌、生成动画帧步进)
  ├── 8. GameRuleSystem   (胜负裁决: 基地毁/命尽 -> GameOver, 敌人清空 -> StageClear)
  └── 9. CleanupSystem    (销毁 inactive/dead 实体)
  │
▼
[RenderSystem] (Canvas 2D, 只读)
  ├── 1. 清屏 (Clear)
  ├── 2. 底层地图 (Brick, Steel, Water, Ice, Base)
  ├── 3. 坦克 (PlayerTank, EnemyTank, 包含无敌护盾)
  ├── 4. 子弹 (Bullets)
  ├── 5. 特效 (Explosions, Spawn Stars)
  └── 6. 顶层地图 (Grass 遮挡层)
```

---

## 2. 坐标系与尺寸基准

- **网格系统**: 26 × 26 Tiles。
- **Tile 逻辑尺寸**: 16 × 16 px。
- **世界逻辑尺寸**: 416 × 416 px（所有物理碰撞、移动预测、子弹弹道均以此坐标系为唯一基准）。
- **渲染画布 (Canvas)**: 可按整数倍放大呈现（如 2x = 832 × 832 px），CSS 开启 `image-rendering: pixelated`，Canvas 2D Context 设置 `imageSmoothingEnabled = false`。
- **坦克默认尺寸**: 32 × 32 px (占据 2×2 Tiles)。
- **子弹默认尺寸**: 6 × 6 px (或 8 × 8 px)。
- **方向与单位向量**:
  - `Direction.Up` = `(0, -1)`
  - `Direction.Down` = `(0, 1)`
  - `Direction.Left` = `(-1, 0)`
  - `Direction.Right` = `(1, 0)`

---

## 3. 地形与破坏模型

### 3.1 地形通行与破坏规则

| Tile 类型 | 坦克通行 | 子弹通行 | 是否可被普通子弹破坏 |
|---|---|---|---|
| `Empty` (0) | 是 | 是 | 否 |
| `Brick` (1) | 否 | 否 | 是 (4-bit 局部破坏) |
| `Steel` (2) | 否 | 否 | 否 (高级子弹可破坏) |
| `Water` (3) | 否 | 是 | 否 |
| `Grass` (4) | 是 | 是 | 否 (视觉遮挡，置顶渲染) |
| `Ice` (5) | 是 | 是 | 否 (惯性滑行) |
| `Base` (6) | 否 | 否 | 是 (一击必杀 -> 废墟 + GameOver) |

### 3.2 砖块局部破坏 (Quarter-Tile Model)

每个 16×16 的 Brick Tile 内部切分为 4 个 8×8 的局部子块，用 4-bit 掩码维护：
- Bit 0 (`0b0001`, 1): Top-Left
- Bit 1 (`0b0010`, 2): Top-Right
- Bit 2 (`0b0100`, 4): Bottom-Left
- Bit 3 (`0b1000`, 8): Bottom-Right
- 完整砖块掩码为 `0b1111` (15)。当子弹从特定方向击中砖块时，消减对应的 bit。掩码为 `0b0000` 时彻底变为 `Empty`。

---

## 4. 运动与碰撞核心策略

### 4.1 预测性防穿墙 (Predictive Movement)
严格避免“先移动，发现碰撞后再撤回”的方式。位移计算流程：
1. `nextRect = { x: tank.x + dx, y: tank.y + dy, width, height }`
2. 先调用 `canMove(nextRect)` 判定（检测边界、周边 4~9 个 Tiles、其它坦克）；
3. 校验通过才将坐标提交给实体：`tank.x = nextRect.x; tank.y = nextRect.y;`

### 4.2 转弯网格微吸附 (Grid Alignment)
在坦克转向时（例如水平转垂直），若垂直轴与最近的半格/整格（8px/16px 倍数）偏差在阈值（如 ≤ 4px）内，自动轻微对齐吸附至合法轨道，解决经典卡墙角问题。

---

## 5. 编码与设计红线

1. **状态隔离红线**：实体坐标 (`x`, `y`)、动画帧等高频状态严禁放入 React State 或 Zustand，必须由 GameEngine 内部持有。
2. **纯粹渲染红线**：RenderSystem 只执行绘制命令，严禁在渲染流程中触发状态修改、扣血或生成实体。
3. **确定性帧率红线**：GameLoop 必须采用 Fixed Timestep (1/60s 累加器算法)，防止不同刷新率显示器下游戏速度异常。
4. **统一音效调用**：禁止在 Entity 内部直接调用 `new Audio()`，统一通过 `AudioManager` 集中调度与缓存。
