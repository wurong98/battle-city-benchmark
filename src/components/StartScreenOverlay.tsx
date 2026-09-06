interface StartScreenOverlayProps {
  onStart: () => void;
}

export function StartScreenOverlay({ onStart }: StartScreenOverlayProps) {
  return (
    <div
      onClick={onStart}
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        zIndex: 50,
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          color: '#e52521',
          fontSize: 'clamp(32px, 6vw, 52px)',
          fontWeight: '900',
          letterSpacing: '6px',
          fontFamily: '"Courier New", Courier, monospace',
          textShadow: '3px 3px #990000, 0 0 16px rgba(229, 37, 33, 0.4)',
          marginBottom: '4px',
          textAlign: 'center',
          lineHeight: '1.1',
        }}
      >
        BATTLE
      </div>
      <div
        style={{
          color: '#e52521',
          fontSize: 'clamp(32px, 6vw, 52px)',
          fontWeight: '900',
          letterSpacing: '6px',
          fontFamily: '"Courier New", Courier, monospace',
          textShadow: '3px 3px #990000, 0 0 16px rgba(229, 37, 33, 0.4)',
          marginBottom: '16px',
          textAlign: 'center',
          lineHeight: '1.1',
        }}
      >
        CITY
      </div>

      <div
        style={{
          color: '#ffcc00',
          fontSize: 'clamp(14px, 2.5vw, 20px)',
          fontFamily: 'monospace',
          marginBottom: '24px',
          letterSpacing: '3px',
        }}
      >
        - 1 PLAYER -
      </div>

      <div
        style={{
          backgroundColor: '#ffcc00',
          color: '#000000',
          padding: '12px 28px',
          borderRadius: '4px',
          fontSize: 'clamp(16px, 3vw, 22px)',
          fontWeight: 'bold',
          letterSpacing: '3px',
          fontFamily: '"Courier New", Courier, monospace',
          boxShadow: '0 6px 20px rgba(255, 204, 0, 0.5)',
          animation: 'pulse 1.5s infinite',
        }}
      >
        ▶ 点击开始 (START)
      </div>

      <div
        style={{
          marginTop: '20px',
          color: '#888888',
          fontSize: 'clamp(11px, 2vw, 14px)',
          fontFamily: 'monospace',
          textAlign: 'center',
          lineHeight: '1.6',
        }}
      >
        触屏支持虚拟摇杆 & 开火 | 键盘支持 WASD / 方向键
      </div>
    </div>
  );
}
