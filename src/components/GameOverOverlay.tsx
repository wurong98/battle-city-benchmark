interface GameOverOverlayProps {
  score: number;
  stage: number;
  onRestart: () => void;
}

export function GameOverOverlay({ score, stage, onRestart }: GameOverOverlayProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '832px',
        height: '832px',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Courier New", Courier, monospace',
        color: '#ffffff',
        zIndex: 10,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          fontSize: '64px',
          fontWeight: '900',
          color: '#e53935',
          letterSpacing: '8px',
          textShadow: '4px 4px #000000',
          marginBottom: '24px',
          animation: 'pulse 1.5s infinite',
        }}
      >
        GAME OVER
      </div>

      <div
        style={{
          backgroundColor: '#222222',
          border: '2px solid #555555',
          borderRadius: '8px',
          padding: '20px 40px',
          textAlign: 'center',
          marginBottom: '32px',
        }}
      >
        <div style={{ fontSize: '20px', color: '#aaaaaa', marginBottom: '8px' }}>
          STAGE REACHED: <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{stage}</span>
        </div>
        <div style={{ fontSize: '24px', color: '#ffcc00', fontWeight: 'bold' }}>
          FINAL SCORE: {score}
        </div>
      </div>

      <button
        onClick={onRestart}
        style={{
          padding: '12px 36px',
          fontSize: '20px',
          fontWeight: 'bold',
          backgroundColor: '#e53935',
          color: '#ffffff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          letterSpacing: '2px',
          boxShadow: '0 4px 15px rgba(229, 57, 53, 0.4)',
        }}
      >
        🔄 PLAY AGAIN
      </button>
    </div>
  );
}
