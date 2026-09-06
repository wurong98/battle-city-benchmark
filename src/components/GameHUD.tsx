interface GameHUDProps {
  score: number;
  lives: number;
  stage: number;
  enemiesRemaining: number;
  gameState: string;
  onRestart: () => void;
  onPauseToggle: () => void;
  onCustomizeGamepad?: () => void;
  isMobile?: boolean;
}

export function GameHUD({
  score,
  lives,
  stage,
  enemiesRemaining,
  gameState,
  onRestart,
  onPauseToggle,
  onCustomizeGamepad,
  isMobile = false,
}: GameHUDProps) {
  const enemyIcons = Array.from({ length: Math.max(0, enemiesRemaining) });

  if (isMobile) {
    return (
      <div
        style={{
          width: '90px',
          backgroundColor: '#26262a',
          border: '2px solid #444444',
          borderRadius: '6px',
          padding: '8px 6px',
          color: '#ffffff',
          fontFamily: '"Courier New", Courier, monospace',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
          userSelect: 'none',
          fontSize: '11px',
          flexShrink: 0,
        }}
      >
        <div>
          {/* 关卡与分数 */}
          <div style={{ textAlign: 'center', marginBottom: '6px' }}>
            <div style={{ color: '#888888', fontSize: '10px' }}>STAGE</div>
            <div style={{ fontWeight: 'bold', color: '#ffcc00', fontSize: '14px' }}>
              🚩{stage}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <div style={{ color: '#888888', fontSize: '10px' }}>SCORE</div>
            <div style={{ fontWeight: 'bold', color: '#ffcc00', fontSize: '12px' }}>
              {score}
            </div>
          </div>

          {/* 生命 */}
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <div style={{ color: '#888888', fontSize: '10px' }}>LIFE</div>
            <div style={{ fontWeight: 'bold', color: '#ffffff', fontSize: '14px' }}>
              🟡 {lives}
            </div>
          </div>

          {/* 剩余敌人简标 */}
          <div style={{ textAlign: 'center', marginBottom: '6px' }}>
            <div style={{ color: '#888888', fontSize: '10px' }}>FOE: {enemiesRemaining}</div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '2px',
                backgroundColor: '#111111',
                padding: '4px 2px',
                borderRadius: '2px',
                maxHeight: '60px',
                overflow: 'hidden',
              }}
            >
              {enemyIcons.slice(0, 16).map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#e53935',
                    borderRadius: '1px',
                    margin: '0 auto',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 紧凑操作按键 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {onCustomizeGamepad && (
            <button
              onClick={onCustomizeGamepad}
              style={{
                padding: '6px 2px',
                backgroundColor: '#2e7d32',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              ⚙️ 调键位
            </button>
          )}
          <button
            onClick={onPauseToggle}
            style={{
              padding: '6px 2px',
              backgroundColor: '#444444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            {gameState === 'PAUSED' ? '▶ 继续' : '⏸ 暂停'}
          </button>
          <button
            onClick={onRestart}
            style={{
              padding: '6px 2px',
              backgroundColor: '#b22222',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            🔄 重来
          </button>
        </div>
      </div>
    );
  }

  // 桌面端标准 HUD
  return (
    <div
      style={{
        width: '180px',
        backgroundColor: '#777777',
        border: '4px solid #4a4a4a',
        borderRadius: '4px',
        padding: '16px 12px',
        color: '#000000',
        fontFamily: '"Courier New", Courier, monospace',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      <div>
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '18px', marginBottom: '8px' }}>
          SCORE
        </div>
        <div style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold', color: '#ffcc00', marginBottom: '16px' }}>
          {score.toString().padStart(6, '0')}
        </div>

        {/* 敌方剩余图标网格 */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>
            ENEMIES: {enemiesRemaining}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '4px',
              backgroundColor: '#555555',
              padding: '6px',
              borderRadius: '2px',
            }}
          >
            {enemyIcons.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: '#000000',
                  borderRadius: '2px',
                  margin: '0 auto',
                }}
              />
            ))}
          </div>
        </div>

        {/* 玩家生命 */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>IP LIFE</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🟡</span>
            <span>{lives}</span>
          </div>
        </div>

        {/* 关卡标志 */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>STAGE</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🚩</span>
            <span>{stage}</span>
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: '12px', marginBottom: '10px', color: '#222222', lineHeight: '1.4' }}>
          <b>[WASD / ↑↓←→]</b> 移动<br />
          <b>[Space / J]</b> 开火<br />
          <b>[P]</b> 暂停/继续
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={onPauseToggle}
            style={{
              padding: '8px',
              backgroundColor: '#333333',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            {gameState === 'PAUSED' ? '▶ 继续 (P)' : '⏸ 暂停 (P)'}
          </button>
          <button
            onClick={onRestart}
            style={{
              padding: '8px',
              backgroundColor: '#b22222',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            🔄 重新开始
          </button>
        </div>
      </div>
    </div>
  );
}
