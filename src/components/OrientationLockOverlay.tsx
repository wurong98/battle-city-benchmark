import React, { useEffect, useState, useCallback } from 'react';

interface OrientationLockOverlayProps {
  onDismiss?: () => void;
}

/**
 * 屏幕横屏检测、锁定与竖屏全屏引导组件
 */
export const OrientationLockOverlay: React.FC<OrientationLockOverlayProps> = ({ onDismiss }) => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const checkOrientation = useCallback(() => {
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
      ('ontouchstart' in window && window.innerWidth <= 1024);

    setIsMobile(isMobileDevice);

    const portrait =
      window.innerHeight > window.innerWidth ||
      (window.screen.orientation &&
        window.screen.orientation.type.includes('portrait'));

    setIsPortrait(portrait);
  }, []);

  // 尝试调用浏览器的横屏锁定与全屏 API
  const lockLandscape = useCallback(async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen().catch(() => {});
        }
      }
      // 标准 Screen Orientation API
      if (window.screen.orientation && 'lock' in window.screen.orientation) {
        await (window.screen.orientation as any).lock('landscape').catch(() => {});
      } else if ('lockOrientation' in window.screen) {
        (window.screen as any).lockOrientation('landscape');
      }
    } catch {
      // 部分浏览器不支持或安全策略阻止时静默处理
    }
  }, []);

  useEffect(() => {
    checkOrientation();

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, [checkOrientation]);

  // 如果不是移动设备或者已经是横屏，则无需显示遮罩
  if (!isMobile || !isPortrait) {
    return null;
  }

  return (
    <div
      onClick={() => {
        lockLandscape();
        if (onDismiss) onDismiss();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0a0a0c',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box',
        color: '#ffffff',
        textAlign: 'center',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      {/* 旋转动画图标 */}
      <div
        style={{
          width: '72px',
          height: '72px',
          marginBottom: '28px',
          animation: 'rotate-phone 2s infinite ease-in-out',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="64"
          height="64"
          stroke="#ffcc00"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* 手机线框 */}
          <rect x="5" y="2" width="14" height="20" rx="3" ry="3" />
          <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" />
          {/* 旋转弧线 */}
          <path d="M 19 8 A 7 7 0 0 1 22 13" stroke="#e53935" strokeWidth="2" markerEnd="url(#arrow)" />
        </svg>
      </div>

      <div
        style={{
          fontSize: '22px',
          fontWeight: 'bold',
          color: '#ffcc00',
          letterSpacing: '2px',
          marginBottom: '12px',
          fontFamily: '"Courier New", Courier, monospace',
        }}
      >
        请旋转手机至横屏
      </div>

      <div
        style={{
          fontSize: '14px',
          color: '#aaaaaa',
          lineHeight: '1.6',
          maxWidth: '300px',
          marginBottom: '28px',
        }}
      >
        为了获得原版街机全景战场与双手触控体验，请将手机横向持握游玩。
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          lockLandscape();
        }}
        style={{
          padding: '12px 28px',
          backgroundColor: '#ffcc00',
          color: '#000000',
          border: 'none',
          borderRadius: '24px',
          fontSize: '15px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(255, 204, 0, 0.4)',
        }}
      >
        ⛶ 尝试自动锁定横屏全屏
      </button>

      {/* 动画帧 */}
      <style>{`
        @keyframes rotate-phone {
          0% {
            transform: rotate(0deg);
          }
          40% {
            transform: rotate(-90deg);
          }
          70% {
            transform: rotate(-90deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }
      `}</style>
    </div>
  );
};
