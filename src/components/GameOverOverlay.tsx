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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          lineHeight: 1.15,
          marginBottom: '16px',
          animation: 'pulse 1.5s infinite',
        }}
      >
        <span
          style={{
            fontSize: 'clamp(28px, 6vw, 54px)',
            fontWeight: '900',
            color: '#e53935',
            letterSpacing: '8px',
            textShadow: '3px 3px #000000',
            whiteSpace: 'nowrap',
          }}
        >
          GAME
        </span>
        <span
          style={{
            fontSize: 'clamp(28px, 6vw, 54px)',
            fontWeight: '900',
            color: '#e53935',
            letterSpacing: '8px',
            textShadow: '3px 3px #000000',
            whiteSpace: 'nowrap',
          }}
        >
          OVER
        </span>
      </div>

      <div
        style={{
          backgroundColor: '#222222',
          border: '2px solid #555555',
          borderRadius: '8px',
          padding: '10px 24px',
          textAlign: 'center',
          marginBottom: '16px',
        }}
      >
        <div style={{ fontSize: 'clamp(12px, 2.5vw, 16px)', color: '#aaaaaa', marginBottom: '4px' }}>
          STAGE REACHED: <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{stage}</span>
        </div>
        <div style={{ fontSize: 'clamp(14px, 3vw, 20px)', color: '#ffcc00', fontWeight: 'bold' }}>
          FINAL SCORE: {score}
        </div>
      </div>

      <button
        onClick={onRestart}
        style={{
          padding: '10px 24px',
          fontSize: 'clamp(13px, 2.5vw, 16px)',
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
