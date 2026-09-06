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
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Courier New", Courier, monospace',
        color: '#ffffff',
        zIndex: 50,
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          fontSize: 'clamp(36px, 7vw, 60px)',
          fontWeight: '900',
          color: '#e53935',
          letterSpacing: '6px',
          textShadow: '3px 3px #000000',
          marginBottom: '16px',
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
          padding: '12px 28px',
          textAlign: 'center',
          marginBottom: '20px',
        }}
      >
        <div style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#aaaaaa', marginBottom: '6px' }}>
          STAGE REACHED: <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{stage}</span>
        </div>
        <div style={{ fontSize: 'clamp(16px, 3vw, 22px)', color: '#ffcc00', fontWeight: 'bold' }}>
          FINAL SCORE: {score}
        </div>
      </div>

      <button
        onClick={onRestart}
        style={{
          padding: '10px 28px',
          fontSize: 'clamp(15px, 2.5vw, 18px)',
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
