interface StartScreenOverlayProps {
  onStart: () => void;
}

export function StartScreenOverlay({ onStart }: StartScreenOverlayProps) {
  return (
    <div
      onClick={onStart}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '832px',
        height: '832px',
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        zIndex: 50,
      }}
    >
      <div
        style={{
          color: '#e52521',
          fontSize: '52px',
          fontWeight: '900',
          letterSpacing: '8px',
          fontFamily: '"Courier New", Courier, monospace',
          textShadow: '4px 4px #990000, 0 0 20px rgba(229, 37, 33, 0.4)',
          marginBottom: '8px',
          textAlign: 'center',
        }}
      >
        BATTLE
      </div>
      <div
        style={{
          color: '#e52521',
          fontSize: '52px',
          fontWeight: '900',
          letterSpacing: '8px',
          fontFamily: '"Courier New", Courier, monospace',
          textShadow: '4px 4px #990000, 0 0 20px rgba(229, 37, 33, 0.4)',
          marginBottom: '28px',
          textAlign: 'center',
        }}
      >
        CITY
      </div>

      <div
        style={{
          color: '#ffcc00',
          fontSize: '20px',
          fontFamily: 'monospace',
          marginBottom: '40px',
          letterSpacing: '3px',
        }}
      >
        - 1 PLAYER -
      </div>

      <div
        style={{
          backgroundColor: '#ffcc00',
          color: '#000000',
          padding: '16px 36px',
          borderRadius: '4px',
          fontSize: '24px',
          fontWeight: 'bold',
          letterSpacing: '4px',
          fontFamily: '"Courier New", Courier, monospace',
          boxShadow: '0 6px 20px rgba(255, 204, 0, 0.5)',
          animation: 'pulse 1.5s infinite',
        }}
      >
        ▶ 点击开始游戏 (START)
      </div>

      <div
        style={{
          marginTop: '36px',
          color: '#888888',
          fontSize: '15px',
          fontFamily: 'monospace',
          textAlign: 'center',
          lineHeight: '1.8',
        }}
      >
        点击任意区域即可入场并自动播放经典 8-bit 开场曲<br />
        [WASD / 方向键] 移动 &nbsp;&nbsp;|&nbsp;&nbsp; [J / 空格] 开火
      </div>
    </div>
  );
}
