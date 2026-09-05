/**
 * 经典 FC 坦克大战 100% 原版 ROM 真实提取音频引擎 (基于 Web Audio API)
 * 支持原版 stage_start, explosion_1/2, bullet_shot, bullet_hit_1/2, game_over, tank_move, tank_idle
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  // 预解码 AudioBuffer 缓存
  private buffers: Map<string, AudioBuffer> = new Map();
  private isLoaded: boolean = false;
  private pendingStartTheme: boolean = false;

  // 坦克移动与静止音效 Loop 状态节点
  private moveSource: AudioBufferSourceNode | null = null;
  private moveGain: GainNode | null = null;
  private isMovingSoundActive: boolean = false;

  constructor() {
    this.preloadAll();
  }

  private async preloadAll(): Promise<void> {
    const audioFiles = [
      { key: 'stage_start', url: '/assets/audio/stage_start.ogg' },
      { key: 'explosion_1', url: '/assets/audio/explosion_1.ogg' },
      { key: 'explosion_2', url: '/assets/audio/explosion_2.ogg' },
      { key: 'bullet_shot', url: '/assets/audio/bullet_shot.ogg' },
      { key: 'bullet_hit_1', url: '/assets/audio/bullet_hit_1.ogg' },
      { key: 'bullet_hit_2', url: '/assets/audio/bullet_hit_2.ogg' },
      { key: 'game_over', url: '/assets/audio/game_over.ogg' },
      { key: 'tank_move', url: '/assets/audio/tank_move.ogg' },
      { key: 'tank_idle', url: '/assets/audio/tank_idle.ogg' },
    ];

    for (const item of audioFiles) {
      try {
        const res = await fetch(item.url);
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          const ctx = this.ensureContext();
          if (ctx) {
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
            this.buffers.set(item.key, audioBuffer);
          }
        }
      } catch {
        // 容错处理
      }
    }
    this.isLoaded = true;

    // 若页面初始加载时已经请求播放开场曲但被 autoplay 拦截，加载完成后且已解锁时触发
    if (this.pendingStartTheme) {
      this.pendingStartTheme = false;
      this.playStageStart();
    }
  }

  public unlock(): void {
    const ctx = this.ensureContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        if (this.pendingStartTheme) {
          this.pendingStartTheme = false;
          this.playStageStart();
        }
      }).catch(() => {});
    }
    if (!this.isLoaded) {
      this.preloadAll();
    }
  }

  private ensureContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      ctxResume(this.ctx);
    }
    return this.ctx;
  }

  private playBuffer(key: string, volume: number = 0.5): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctxResume(ctx);
    }

    const buffer = this.buffers.get(key);
    if (!buffer) return;

    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start(0);
    } catch {
      // 容错
    }
  }

  /**
   * 坦克移动引擎音效：持续循环播放
   */
  public startTankMove(): void {
    if (this.isMovingSoundActive) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const buffer = this.buffers.get('tank_move') || this.buffers.get('tank_idle');
    if (!buffer) return;

    try {
      this.stopTankMove();
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25, ctx.currentTime);

      source.connect(gain);
      gain.connect(ctx.destination);
      source.start(0);

      this.moveSource = source;
      this.moveGain = gain;
      this.isMovingSoundActive = true;
    } catch {
      // 容错
    }
  }

  /**
   * 停止坦克移动引擎音效
   */
  public stopTankMove(): void {
    if (this.moveSource) {
      try {
        if (this.moveGain && this.ctx) {
          this.moveGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
        }
        this.moveSource.stop(this.ctx ? this.ctx.currentTime + 0.05 : 0);
        this.moveSource.disconnect();
      } catch {
        // 忽略已经 stop 的异常
      }
      this.moveSource = null;
      this.moveGain = null;
    }
    this.isMovingSoundActive = false;
  }

  /**
   * 原版经典开场 8-bit "噔 噔 噔 噔——" 开场音乐
   */
  public playStageStart(): void {
    const ctx = this.ensureContext();
    if (!ctx || ctx.state === 'suspended' || !this.buffers.has('stage_start')) {
      this.pendingStartTheme = true;
    }
    this.playBuffer('stage_start', 0.6);
  }

  /**
   * 原版坦克射击音效
   */
  public playShoot(): void {
    this.playBuffer('bullet_shot', 0.35);
  }

  /**
   * 击中敌方坦克/大型爆炸 (原版 explosion_2)
   */
  public playKillEnemy(): void {
    this.playBuffer('explosion_2', 0.55);
  }

  /**
   * 普通爆炸/子弹爆炸 (原版 explosion_1)
   */
  public playExplosion(isBig: boolean = false): void {
    if (isBig) {
      this.playKillEnemy();
    } else {
      this.playBuffer('explosion_1', 0.45);
    }
  }

  /**
   * 击中砖块碎裂音效
   */
  public playHitBrick(): void {
    this.playBuffer('bullet_hit_1', 0.35);
  }

  /**
   * 击中钢墙反弹音效
   */
  public playHitSteel(): void {
    this.playBuffer('bullet_hit_2', 0.35);
  }

  /**
   * 原版游戏结束音效
   */
  public playGameOver(): void {
    this.stopTankMove();
    this.playBuffer('game_over', 0.55);
  }
}

function ctxResume(ctx: AudioContext) {
  ctx.resume().catch(() => {});
}

export const audio = new AudioManager();
