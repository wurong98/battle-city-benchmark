interface StageClearOverlayProps {
  score: number;
  stage: number;
  onNextStage: () => void;
}

export function StageClearOverlay({
  score,
  stage,
  onNextStage,
}: StageClearOverlayProps) {
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
          fontSize: 'clamp(32px, 6vw, 52px)',
          fontWeight: '900',
          color: '#4caf50',
          letterSpacing: '5px',
          textShadow: '3px 3px #000000',
          marginBottom: '16px',
        }}
      >
        🎉 STAGE CLEAR!
      </div>

      <div
        style={{
          backgroundColor: '#1b3815',
          border: '2px solid #4caf50',
          borderRadius: '8px',
          padding: '14px 32px',
          textAlign: 'center',
          marginBottom: '20px',
        }}
      >
        <div style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#a5d6a7', marginBottom: '6px' }}>
          STAGE {stage} COMPLETED!
        </div>
        <div style={{ fontSize: 'clamp(16px, 3vw, 22px)', color: '#ffeb3b', fontWeight: 'bold' }}>
          CURRENT SCORE: {score}
        </div>
      </div>

      <button
        onClick={onNextStage}
        style={{
          padding: '12px 32px',
          fontSize: 'clamp(15px, 2.5vw, 18px)',
          fontWeight: 'bold',
          backgroundColor: '#4caf50',
          color: '#ffffff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          letterSpacing: '2px',
          boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)',
        }}
      >
        ⏩ NEXT STAGE
      </button>
    </div>
  );
}
