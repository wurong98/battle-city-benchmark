import { useEffect, useRef, useState } from 'react';
import { CANVAS_SIZE } from '../game/constants';
import { GameEngine } from '../game/GameEngine';

interface GameCanvasProps {
  onEngineReady?: (engine: GameEngine) => void;
}

export function GameCanvas({ onEngineReady }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [displaySize, setDisplaySize] = useState<number>(CANVAS_SIZE * 2);

  // 监听容器或窗口尺寸，计算在横屏下等比缩放的最佳正方形大小
  useEffect(() => {
    const updateSize = () => {
      // 移动端/横屏下可用高度以视口高度扣除微小留白为主
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) || window.innerWidth <= 1024;

      const availHeight = window.innerHeight;
      const availWidth = window.innerWidth;

      if (isMobile) {
        // 横屏状态下，以屏幕高度为核心基准，两边预留触控和HUD空间
        const maxSquareByHeight = availHeight - 16;
        const maxSquareByWidth = availWidth - 280; // 留给左右控制器与HUD的空间
        const target = Math.floor(
          Math.max(280, Math.min(maxSquareByHeight, maxSquareByWidth > 0 ? maxSquareByWidth : maxSquareByHeight))
        );
        setDisplaySize(target);
      } else {
        // 桌面端保持 832px 或根据窗口高度等比自适应
        const maxDesktop = Math.min(832, availHeight - 140);
        setDisplaySize(Math.max(416, maxDesktop));
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', updateSize);

    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas);
    engineRef.current = engine;

    if (onEngineReady) {
      onEngineReady(engine);
    }

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [onEngineReady]);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '3px solid #4a4a4a',
        borderRadius: '6px',
        backgroundColor: '#000000',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)',
        position: 'relative',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{
          width: `${displaySize}px`,
          height: `${displaySize}px`,
          display: 'block',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
}
