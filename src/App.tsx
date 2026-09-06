import { useState, useCallback, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { GameOverOverlay } from './components/GameOverOverlay';
import { StageClearOverlay } from './components/StageClearOverlay';
import { StartScreenOverlay } from './components/StartScreenOverlay';
import { VirtualGamepad } from './components/VirtualGamepad';
import { OrientationLockOverlay } from './components/OrientationLockOverlay';
import { GameEngine } from './game/GameEngine';
import { GameState, Direction } from './game/types/game';

export default function App() {
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [session, setSession] = useState({
    score: 0,
    lives: 3,
    stage: 1,
    enemiesRemaining: 20,
    gameState: GameState.READY as string,
  });

  // 设备环境检测
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) ||
        (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
        ('ontouchstart' in window && window.innerWidth <= 1024);
      setIsMobile(mobile);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handleEngineReady = useCallback((newEngine: GameEngine) => {
    setEngine(newEngine);
    newEngine.subscribe((state) => {
      setSession(state);
    });
  }, []);

  // 尝试锁定横屏与全屏
  const tryLockLandscape = useCallback(async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen().catch(() => {});
        }
      }
      if (window.screen.orientation && 'lock' in window.screen.orientation) {
        await (window.screen.orientation as any).lock('landscape').catch(() => {});
      } else if ('lockOrientation' in window.screen) {
        (window.screen as any).lockOrientation('landscape');
      }
    } catch {
      // 忽略浏览器不支持或权限限制
    }
  }, []);

  const handleStartGame = () => {
    tryLockLandscape();
    engine?.start();
  };

  const handleRestart = () => {
    tryLockLandscape();
    engine?.restart();
  };

  const handleNextStage = () => {
    engine?.nextStage();
  };

  const handlePauseToggle = () => {
    if (session.gameState === GameState.PLAYING) {
      engine?.pause();
    } else if (session.gameState === GameState.PAUSED) {
      engine?.resume();
    }
  };

  const handleDirectionChange = useCallback(
    (dir: Direction | null) => {
      engine?.setVirtualDirection(dir);
    },
    [engine]
  );

  const handleFireChange = useCallback(
    (firing: boolean) => {
      engine?.setVirtualFire(firing);
    },
    [engine]
  );

  return (
    <div
      style={{
        width: '100vw',
        height: '100dvh',
        backgroundColor: '#121214',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: isMobile ? 'center' : 'center',
        padding: isMobile ? 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)' : '16px',
        boxSizing: 'border-box',
        color: '#ffffff',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* 竖屏引导与横屏锁定组件 */}
      <OrientationLockOverlay onDismiss={tryLockLandscape} />

      {/* 桌面端才展示的标题栏 */}
      {!isMobile && (
        <header style={{ marginBottom: '14px', textAlign: 'center' }}>
          <h1
            style={{
              margin: 0,
              fontSize: '26px',
              letterSpacing: '3px',
              color: '#ffcc00',
              textShadow: '2px 2px #b22222',
              fontFamily: 'monospace',
            }}
          >
            ⚔️ BATTLE CITY 经典坦克大战 ⚔️
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#888888', fontSize: '13px' }}>
            React + TypeScript + Canvas 2D (Fixed Timestep 60Hz)
          </p>
        </header>
      )}

      {/* 游戏主体容器：横屏下居中并排 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: isMobile ? '8px' : '16px',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          maxHeight: '100%',
        }}
      >
        {/* 画布容器 */}
        <div style={{ position: 'relative' }}>
          <GameCanvas onEngineReady={handleEngineReady} />

          {/* 经典开场画面 */}
          {session.gameState === GameState.READY && (
            <StartScreenOverlay onStart={handleStartGame} />
          )}

          {/* 暂停遮罩 */}
          {session.gameState === GameState.PAUSED && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(28px, 6vw, 44px)',
                fontWeight: 'bold',
                color: '#ffcc00',
                letterSpacing: '6px',
                fontFamily: 'monospace',
                pointerEvents: 'none',
                zIndex: 45,
              }}
            >
              PAUSE
            </div>
          )}

          {/* 游戏结束遮罩 */}
          {session.gameState === GameState.GAME_OVER && (
            <GameOverOverlay
              score={session.score}
              stage={session.stage}
              onRestart={handleRestart}
            />
          )}

          {/* 通关过关遮罩 */}
          {session.gameState === GameState.STAGE_CLEAR && (
            <StageClearOverlay
              score={session.score}
              stage={session.stage}
              onNextStage={handleNextStage}
            />
          )}
        </div>

        {/* 状态 HUD */}
        <GameHUD
          score={session.score}
          lives={session.lives}
          stage={session.stage}
          enemiesRemaining={session.enemiesRemaining}
          gameState={session.gameState}
          onRestart={handleRestart}
          onPauseToggle={handlePauseToggle}
          isMobile={isMobile}
        />
      </div>

      {/* 移动端虚拟手柄 (D-Pad 十字键与 FIRE 按键) */}
      {isMobile && (
        <VirtualGamepad
          onDirectionChange={handleDirectionChange}
          onFireChange={handleFireChange}
          disabled={session.gameState !== GameState.PLAYING}
        />
      )}
    </div>
  );
}
