import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Direction } from '../game/types/game';
import {
  type GamepadLayoutConfig,
  loadGamepadConfig,
  saveGamepadConfig,
  DEFAULT_GAMEPAD_CONFIG,
} from '../game/types/gamepadConfig';

interface VirtualGamepadProps {
  onDirectionChange: (direction: Direction | null) => void;
  onFireChange: (firing: boolean) => void;
  disabled?: boolean;
  isEditing?: boolean;
  onExitEditing?: () => void;
}

export const VirtualGamepad: React.FC<VirtualGamepadProps> = ({
  onDirectionChange,
  onFireChange,
  disabled = false,
  isEditing = false,
  onExitEditing,
}) => {
  const [config, setConfig] = useState<GamepadLayoutConfig>(loadGamepadConfig);
  const [activeDir, setActiveDir] = useState<Direction | null>(null);
  const [isFiring, setIsFiring] = useState(false);

  const dpadRef = useRef<HTMLDivElement>(null);
  const fireRef = useRef<HTMLDivElement>(null);

  // 记录拖拽编辑过程中的初始触摸点
  const dragTouchStartRef = useRef<{
    startX: number;
    startY: number;
    initialBottom: number;
    initialOffsetH: number;
  } | null>(null);

  // 每次进入编辑或重新加载时，同步最新配置
  useEffect(() => {
    setConfig(loadGamepadConfig());
  }, [isEditing]);

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

  /* ================= 正常操控逻辑 ================= */
  const handleDpadTouchStart = (e: React.TouchEvent) => {
    if (disabled || isEditing) return;
    if (e.cancelable) e.preventDefault();
    const touch = e.targetTouches[0];
    const dir = calcDirectionFromTouch(touch);
    setActiveDir(dir);
    onDirectionChange(dir);
  };

  const handleDpadTouchMove = (e: React.TouchEvent) => {
    if (disabled || isEditing) return;
    if (e.cancelable) e.preventDefault();
    const touch = e.targetTouches[0];
    const dir = calcDirectionFromTouch(touch);
    if (dir !== activeDir) {
      setActiveDir(dir);
      onDirectionChange(dir);
    }
  };

  const handleDpadTouchEnd = (e: React.TouchEvent) => {
    if (disabled || isEditing) return;
    if (e.cancelable) e.preventDefault();
    setActiveDir(null);
    onDirectionChange(null);
  };

  const handleFireTouchStart = (e: React.TouchEvent) => {
    if (disabled || isEditing) return;
    if (e.cancelable) e.preventDefault();
    setIsFiring(true);
    onFireChange(true);
  };

  const handleFireTouchEnd = (e: React.TouchEvent) => {
    if (disabled || isEditing) return;
    if (e.cancelable) e.preventDefault();
    setIsFiring(false);
    onFireChange(false);
  };

  /* ================= 自定义拖拽排版逻辑 ================= */
  const handleDragStart = (
    e: React.TouchEvent,
    target: 'dpad' | 'fire'
  ) => {
    if (!isEditing) return;
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    const currentPos = target === 'dpad' ? config.dpad : config.fire;

    dragTouchStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialBottom: currentPos.bottom,
      initialOffsetH: currentPos.offsetHorizontal,
    };
  };

  const handleDragMove = (
    e: React.TouchEvent,
    target: 'dpad' | 'fire'
  ) => {
    if (!isEditing || !dragTouchStartRef.current) return;
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragTouchStartRef.current.startX;
    const deltaY = touch.clientY - dragTouchStartRef.current.startY;

    // 上移为负 deltaY -> bottom 变大
    const newBottom = Math.max(
      10,
      Math.min(window.innerHeight - 150, dragTouchStartRef.current.initialBottom - deltaY)
    );

    if (target === 'dpad') {
      // 左侧 D-Pad：向右移 deltaX 为正 -> offsetHorizontal (left) 变大
      // 限制在左半屏内
      const maxLeft = Math.max(20, window.innerWidth / 2 - 120);
      const newLeft = Math.max(
        10,
        Math.min(maxLeft, dragTouchStartRef.current.initialOffsetH + deltaX)
      );

      setConfig((prev) => ({
        ...prev,
        dpad: {
          ...prev.dpad,
          bottom: Math.round(newBottom),
          offsetHorizontal: Math.round(newLeft),
        },
      }));
    } else {
      // 右侧 FIRE：向剪移 deltaX 为负 -> offsetHorizontal (right) 变大
      // 限制在右半屏内
      const maxRight = Math.max(20, window.innerWidth / 2 - 100);
      const newRight = Math.max(
        10,
        Math.min(maxRight, dragTouchStartRef.current.initialOffsetH - deltaX)
      );

      setConfig((prev) => ({
        ...prev,
        fire: {
          ...prev.fire,
          bottom: Math.round(newBottom),
          offsetHorizontal: Math.round(newRight),
        },
      }));
    }
  };

  const handleDragEnd = (e: React.TouchEvent) => {
    if (!isEditing) return;
    if (e.cancelable) e.preventDefault();
    dragTouchStartRef.current = null;
  };

  const handleSave = () => {
    saveGamepadConfig(config);
    onExitEditing?.();
  };

  const handleReset = () => {
    setConfig(DEFAULT_GAMEPAD_CONFIG);
    saveGamepadConfig(DEFAULT_GAMEPAD_CONFIG);
  };

  const handleScaleChange = (target: 'dpad' | 'fire', delta: number) => {
    setConfig((prev) => {
      const current = prev[target].scale;
      const nextScale = Math.max(0.75, Math.min(1.4, Math.round((current + delta) * 100) / 100));
      return {
        ...prev,
        [target]: {
          ...prev[target],
          scale: nextScale,
        },
      };
    });
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: isEditing ? 'auto' : 'none',
        zIndex: isEditing ? 100 : 40,
      }}
    >
      {/* 调整模式顶栏控制台 */}
      {isEditing && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(20, 20, 25, 0.92)',
            border: '2px solid #ffcc00',
            borderRadius: '10px',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 60,
            boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
            pointerEvents: 'auto',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffcc00' }}>
            🖐️ 按住按键可拖拽调整位置
          </span>

          <button
            onClick={() => handleScaleChange('dpad', 0.1)}
            style={{
              backgroundColor: '#333',
              color: '#fff',
              border: '1px solid #666',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '11px',
            }}
          >
            十字键+
          </button>
          <button
            onClick={() => handleScaleChange('dpad', -0.1)}
            style={{
              backgroundColor: '#333',
              color: '#fff',
              border: '1px solid #666',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '11px',
            }}
          >
            十字键-
          </button>

          <button
            onClick={() => handleScaleChange('fire', 0.1)}
            style={{
              backgroundColor: '#333',
              color: '#fff',
              border: '1px solid #666',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '11px',
            }}
          >
            开火+
          </button>
          <button
            onClick={() => handleScaleChange('fire', -0.1)}
            style={{
              backgroundColor: '#333',
              color: '#fff',
              border: '1px solid #666',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '11px',
            }}
          >
            开火-
          </button>

          <button
            onClick={handleReset}
            style={{
              backgroundColor: '#555',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '5px 10px',
              fontSize: '11px',
              fontWeight: 'bold',
            }}
          >
            恢复默认
          </button>
          <button
            onClick={handleSave}
            style={{
              backgroundColor: '#2e7d32',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '5px 14px',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            💾 保存完成
          </button>
        </div>
      )}

      {/* 左侧 D-Pad 十字方向键 */}
      <div
        ref={dpadRef}
        onTouchStart={
          isEditing ? (e) => handleDragStart(e, 'dpad') : handleDpadTouchStart
        }
        onTouchMove={
          isEditing ? (e) => handleDragMove(e, 'dpad') : handleDpadTouchMove
        }
        onTouchEnd={isEditing ? handleDragEnd : handleDpadTouchEnd}
        onTouchCancel={isEditing ? handleDragEnd : handleDpadTouchEnd}
        style={{
          position: 'absolute',
          left: `calc(${config.dpad.offsetHorizontal}px + env(safe-area-inset-left, 0px))`,
          bottom: `calc(${config.dpad.bottom}px + env(safe-area-inset-bottom, 0px))`,
          width: '140px',
          height: '140px',
          transform: `scale(${config.dpad.scale})`,
          transformOrigin: 'bottom left',
          pointerEvents: 'auto',
          userSelect: 'none',
          touchAction: 'none',
          opacity: isEditing ? 0.95 : config.opacity,
          filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.6))',
          outline: isEditing ? '2px dashed #ffcc00' : 'none',
          outlineOffset: '6px',
          borderRadius: isEditing ? '16px' : '0px',
          transition: isEditing ? 'none' : 'opacity 0.2s ease',
        }}
      >
        {isEditing && (
          <div
            style={{
              position: 'absolute',
              top: '-24px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#ffcc00',
              color: '#000',
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '3px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
            }}
          >
            按住拖拽 ({Math.round(config.dpad.scale * 100)}%)
          </div>
        )}

        {/* 十字背景底座 */}
        <div
          style={{
            position: 'absolute',
            left: '46px',
            top: '0',
            width: '48px',
            height: '140px',
            backgroundColor: '#2a2a2a',
            borderRadius: '12px',
            border: '2px solid #555555',
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
            borderRadius: '12px',
            border: '2px solid #555555',
          }}
        />
        {/* 中心凹陷 */}
        <div
          style={{
            position: 'absolute',
            left: '50px',
            top: '50px',
            width: '40px',
            height: '40px',
            backgroundColor: '#1c1c1c',
            borderRadius: '50%',
            zIndex: 2,
            border: '1px solid #333333',
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
            color: activeDir === Direction.Up ? '#ffcc00' : '#aaaaaa',
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
            color: activeDir === Direction.Down ? '#ffcc00' : '#aaaaaa',
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
            color: activeDir === Direction.Left ? '#ffcc00' : '#aaaaaa',
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
            color: activeDir === Direction.Right ? '#ffcc00' : '#aaaaaa',
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
        ref={fireRef}
        onTouchStart={
          isEditing ? (e) => handleDragStart(e, 'fire') : handleFireTouchStart
        }
        onTouchMove={
          isEditing ? (e) => handleDragMove(e, 'fire') : undefined
        }
        onTouchEnd={isEditing ? handleDragEnd : handleFireTouchEnd}
        onTouchCancel={isEditing ? handleDragEnd : handleFireTouchEnd}
        style={{
          position: 'absolute',
          right: `calc(${config.fire.offsetHorizontal}px + env(safe-area-inset-right, 0px))`,
          bottom: `calc(${config.fire.bottom}px + env(safe-area-inset-bottom, 0px))`,
          width: '88px',
          height: '88px',
          transform: `scale(${config.fire.scale})`,
          transformOrigin: 'bottom right',
          borderRadius: '50%',
          backgroundColor: isFiring ? '#ff4d4f' : '#cf1322',
          border: '4px solid #f5222d',
          boxShadow: isFiring
            ? '0 0 22px #ff4d4f, inset 0 4px 8px rgba(0,0,0,0.5)'
            : '0 8px 18px rgba(0,0,0,0.6), inset 0 -4px 8px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
          userSelect: 'none',
          touchAction: 'none',
          opacity: isEditing ? 0.95 : config.opacity,
          outline: isEditing ? '2px dashed #ffcc00' : 'none',
          outlineOffset: '6px',
        }}
      >
        {isEditing && (
          <div
            style={{
              position: 'absolute',
              top: '-24px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#ffcc00',
              color: '#000',
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '3px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
            }}
          >
            按住拖拽 ({Math.round(config.fire.scale * 100)}%)
          </div>
        )}

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
