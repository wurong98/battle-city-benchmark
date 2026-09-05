import { useState, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { GameEngine } from './game/GameEngine';
import { GameState } from './game/types/game';

export default function App() {
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [session, setSession] = useState({
    score: 0,
    lives: 3,
    stage: 1,
    enemiesRemaining: 20,
    gameState: GameState.READY as string,
  });

  const handleEngineReady = useCallback((newEngine: GameEngine) => {
    setEngine(newEngine);
    newEngine.subscribe((state) => {
      setSession(state);
    });
  }, []);

  const handleRestart = () => {
    engine?.restart();
  };

  const handlePauseToggle = () => {
    if (session.gameState === GameState.PLAYING) {
      engine?.pause();
    } else if (session.gameState === GameState.PAUSED) {
      engine?.resume();
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#1a1a1a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
        color: '#ffffff',
      }}
    >
      <header style={{ marginBottom: '16px', textAlign: 'center' }}>
        <h1
          style={{
            margin: 0,
            fontSize: '28px',
            letterSpacing: '3px',
            color: '#ffcc00',
            textShadow: '2px 2px #b22222',
            fontFamily: 'monospace',
          }}
        >
          ⚔️ BATTLE CITY 经典坦克大战 ⚔️
        </h1>
        <p style={{ margin: '4px 0 0 0', color: '#888888', fontSize: '14px' }}>
          React + TypeScript + Canvas 2D (Fixed Timestep 60Hz)
        </p>
      </header>

      <div
        style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'stretch',
          position: 'relative',
        }}
      >
        <GameCanvas onEngineReady={handleEngineReady} />
        <GameHUD
          score={session.score}
          lives={session.lives}
          stage={session.stage}
          enemiesRemaining={session.enemiesRemaining}
          gameState={session.gameState}
          onRestart={handleRestart}
          onPauseToggle={handlePauseToggle}
        />

        {/* 暂停遮罩 */}
        {session.gameState === GameState.PAUSED && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '832px',
              height: '832px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#ffcc00',
              letterSpacing: '6px',
              fontFamily: 'monospace',
              pointerEvents: 'none',
            }}
          >
            PAUSE
          </div>
        )}
      </div>
    </div>
  );
}
