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
          fontSize: '56px',
          fontWeight: '900',
          color: '#4caf50',
          letterSpacing: '6px',
          textShadow: '4px 4px #000000',
          marginBottom: '20px',
        }}
      >
        🎉 STAGE CLEAR!
      </div>

      <div
        style={{
          backgroundColor: '#1b3815',
          border: '2px solid #4caf50',
          borderRadius: '8px',
          padding: '20px 48px',
          textAlign: 'center',
          marginBottom: '32px',
        }}
      >
        <div style={{ fontSize: '20px', color: '#a5d6a7', marginBottom: '8px' }}>
          STAGE {stage} COMPLETED!
        </div>
        <div style={{ fontSize: '24px', color: '#ffeb3b', fontWeight: 'bold' }}>
          CURRENT SCORE: {score}
        </div>
      </div>

      <button
        onClick={onNextStage}
        style={{
          padding: '14px 40px',
          fontSize: '20px',
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
