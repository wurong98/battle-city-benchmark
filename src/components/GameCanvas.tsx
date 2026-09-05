import { useEffect, useRef } from 'react';
import { CANVAS_SIZE, CANVAS_SCALE } from '../game/constants';
import { GameEngine } from '../game/GameEngine';

interface GameCanvasProps {
  onEngineReady?: (engine: GameEngine) => void;
}

export function GameCanvas({ onEngineReady }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas);
    engineRef.current = engine;
    engine.start();

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
      style={{
        display: 'inline-block',
        border: '4px solid #4a4a4a',
        borderRadius: '4px',
        backgroundColor: '#000000',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.7)',
      }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{
          width: CANVAS_SIZE * CANVAS_SCALE,
          height: CANVAS_SIZE * CANVAS_SCALE,
          display: 'block',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
}
