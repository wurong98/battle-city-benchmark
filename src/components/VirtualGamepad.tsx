import React, { useRef, useCallback, useState } from 'react';
import { Direction } from '../game/types/game';

interface VirtualGamepadProps {
  onDirectionChange: (direction: Direction | null) => void;
  onFireChange: (firing: boolean) => void;
  disabled?: boolean;
}

export const VirtualGamepad: React.FC<VirtualGamepadProps> = ({
  onDirectionChange,
  onFireChange,
  disabled = false,
}) => {
  const [activeDir, setActiveDir] = useState<Direction | null>(null);
  const [isFiring, setIsFiring] = useState(false);
  const dpadRef = useRef<HTMLDivElement>(null);

  // 根据触摸位置计算当前方向
  const calcDirectionFromTouch = useCallback(
    (touch: React.Touch | Touch): Direction | null => {
      if (!dpadRef.current) return null;
      const rect = dpadRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = touch.clientX - centerX;
      const dy = touch.clientY - centerY;
      const distance = Math.hypot(dx, dy);

      // 死区判定：中心 15px 范围内视为无方向
      if (distance < 15) return null;

      // 根据角度判定 4 方向
      if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? Direction.Right : Direction.Left;
      } else {
        return dy > 0 ? Direction.Down : Direction.Up;
      }
    },
    []
  );

  const handleDpadTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    const touch = e.targetTouches[0];
    const dir = calcDirectionFromTouch(touch);
    setActiveDir(dir);
    onDirectionChange(dir);
  };

  const handleDpadTouchMove = (e: React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    const touch = e.targetTouches[0];
    const dir = calcDirectionFromTouch(touch);
    if (dir !== activeDir) {
      setActiveDir(dir);
      onDirectionChange(dir);
    }
  };

  const handleDpadTouchEnd = (e: React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    setActiveDir(null);
    onDirectionChange(null);
  };

  const handleFireTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsFiring(true);
    onFireChange(true);
  };

  const handleFireTouchEnd = (e: React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsFiring(false);
    onFireChange(false);
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        padding: '0 20px 20px 20px',
        boxSizing: 'border-box',
        zIndex: 40,
      }}
    >
      {/* 左侧 D-Pad 十字方向键 */}
      <div
        ref={dpadRef}
        onTouchStart={handleDpadTouchStart}
        onTouchMove={handleDpadTouchMove}
        onTouchEnd={handleDpadTouchEnd}
        onTouchCancel={handleDpadTouchEnd}
        style={{
          width: '140px',
          height: '140px',
          position: 'relative',
          pointerEvents: 'auto',
          userSelect: 'none',
          touchAction: 'none',
          filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.6))',
        }}
      >
        {/* 十字背景底座 */}
        <div
          style={{
            position: 'absolute',
            left: '46px',
            top: '0',
            width: '48px',
            height: '140px',
            backgroundColor: '#2a2a2a',
            borderRadius: '10px',
            border: '2px solid #444444',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '0',
            top: '46px',
            width: '140px',
            height: '48px',
            backgroundColor: '#2a2a2a',
            borderRadius: '10px',
            border: '2px solid #444444',
          }}
        />
        {/* 中心小凹陷 */}
        <div
          style={{
            position: 'absolute',
            left: '52px',
            top: '52px',
            width: '36px',
            height: '36px',
            backgroundColor: '#1f1f1f',
            borderRadius: '50%',
            zIndex: 2,
          }}
        />

        {/* 上键提示 */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '48px',
            width: '44px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: activeDir === Direction.Up ? '#ffcc00' : '#888888',
            fontSize: '22px',
            transform: activeDir === Direction.Up ? 'scale(1.2)' : 'scale(1)',
            transition: 'transform 0.08s ease',
            zIndex: 3,
          }}
        >
          ▲
        </div>
        {/* 下键提示 */}
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '48px',
            width: '44px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: activeDir === Direction.Down ? '#ffcc00' : '#888888',
            fontSize: '22px',
            transform: activeDir === Direction.Down ? 'scale(1.2)' : 'scale(1)',
            transition: 'transform 0.08s ease',
            zIndex: 3,
          }}
        >
          ▼
        </div>
        {/* 左键提示 */}
        <div
          style={{
            position: 'absolute',
            top: '48px',
            left: '8px',
            width: '38px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: activeDir === Direction.Left ? '#ffcc00' : '#888888',
            fontSize: '22px',
            transform: activeDir === Direction.Left ? 'scale(1.2)' : 'scale(1)',
            transition: 'transform 0.08s ease',
            zIndex: 3,
          }}
        >
          ◀
        </div>
        {/* 右键提示 */}
        <div
          style={{
            position: 'absolute',
            top: '48px',
            right: '8px',
            width: '38px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: activeDir === Direction.Right ? '#ffcc00' : '#888888',
            fontSize: '22px',
            transform: activeDir === Direction.Right ? 'scale(1.2)' : 'scale(1)',
            transition: 'transform 0.08s ease',
            zIndex: 3,
          }}
        >
          ▶
        </div>
      </div>

      {/* 右侧 开火 (FIRE / 🔴) 大按键 */}
      <div
        onTouchStart={handleFireTouchStart}
        onTouchEnd={handleFireTouchEnd}
        onTouchCancel={handleFireTouchEnd}
        style={{
          width: '88px',
          height: '88px',
          borderRadius: '50%',
          backgroundColor: isFiring ? '#ff4d4f' : '#cf1322',
          border: '4px solid #f5222d',
          boxShadow: isFiring
            ? '0 0 20px #ff4d4f, inset 0 4px 8px rgba(0,0,0,0.5)'
            : '0 6px 16px rgba(0,0,0,0.6), inset 0 -4px 8px rgba(0,0,0,0.4)',
          transform: isFiring ? 'scale(0.92)' : 'scale(1)',
          transition: 'transform 0.08s ease, background-color 0.08s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
          userSelect: 'none',
          touchAction: 'none',
          marginBottom: '16px',
        }}
      >
        <span
          style={{
            color: '#ffffff',
            fontSize: '18px',
            fontWeight: '900',
            fontFamily: 'monospace',
            letterSpacing: '1px',
            textShadow: '1px 1px 2px #000000',
          }}
        >
          FIRE
        </span>
        <span
          style={{
            color: '#ffccc7',
            fontSize: '11px',
            fontWeight: 'bold',
          }}
        >
          (A)
        </span>
      </div>
    </div>
  );
};
