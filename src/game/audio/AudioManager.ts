/**
 * 经典 FC 坦克大战 8-bit 复古合成音效引擎 (基于原生 Web Audio API + 原版 WAV 采样缓存)
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private explosionBuffer: AudioBuffer | null = null;
  private stageStartBuffer: AudioBuffer | null = null;

  constructor() {
    // 异步静默加载原版 wav
    this.loadAudioFiles();
  }

  private async loadAudioFiles(): Promise<void> {
    try {
      const expRes = await fetch('/assets/audio/explosion.wav');
      if (expRes.ok) {
        const expArray = await expRes.arrayBuffer();
        const ctx = this.ensureContext();
        if (ctx) {
          this.explosionBuffer = await ctx.decodeAudioData(expArray);
        }
      }

      const startRes = await fetch('/assets/audio/stage_start.wav');
      if (startRes.ok) {
        const startArray = await startRes.arrayBuffer();
        const ctx = this.ensureContext();
        if (ctx) {
          this.stageStartBuffer = await ctx.decodeAudioData(startArray);
        }
      }
    } catch {
      // 降级使用内部合成器
    }
  }

  public unlock(): void {
    const ctx = this.ensureContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    // 如果之前未初始化完成，继续尝试加载
    if (!this.explosionBuffer || !this.stageStartBuffer) {
      this.loadAudioFiles();
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
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * 经典开场/重新开始 8-bit "噔 噔 噔" 开场音
   */
  public playStageStart(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    if (this.stageStartBuffer) {
      const source = ctx.createBufferSource();
      source.buffer = this.stageStartBuffer;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.45, ctx.currentTime);
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start();
      return;
    }

    // 备选降级方波
    const notes = [392, 523, 659, 784, 880, 1046];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const st = ctx.currentTime + idx * 0.08;
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, st);
      gain.gain.setValueAtTime(0.2, st);
      gain.gain.exponentialRampToValueAtTime(0.01, st + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(st);
      osc.stop(st + 0.1);
    });
  }

  /**
   * 原版 FC 坦克射击音效：短促清脆的 2A03 方波脉冲 (0.08s)
   */
  public playShoot(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(650, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  /**
   * 原版 FC 坦克爆炸音效 (优先使用原版 WAV 采样)
   */
  public playKillEnemy(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    if (this.explosionBuffer) {
      const source = ctx.createBufferSource();
      source.buffer = this.explosionBuffer;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start();
      return;
    }

    // 备选降级 NES 2A03 采样
    this.fallbackExplosion(ctx, 0.22, 0.35);
  }

  public playExplosion(isBig: boolean = false): void {
    if (isBig) {
      this.playKillEnemy();
      return;
    }
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.fallbackExplosion(ctx, 0.1, 0.2);
  }

  private fallbackExplosion(
    ctx: AudioContext,
    duration: number,
    volume: number
  ): void {
    const now = ctx.currentTime;
    const sampleRate = ctx.sampleRate;
    const totalSamples = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, totalSamples, sampleRate);
    const channel = buffer.getChannelData(0);

    let shiftRegister = 0x7fff;
    let sampleCounter = 0;
    let currentBit = 1;

    for (let i = 0; i < totalSamples; i++) {
      const t = i / totalSamples;
      const periodSamples = Math.max(
        3,
        Math.floor(sampleRate / (7000 * Math.pow(1 - t * 0.75, 1.8) + 1200))
      );

      sampleCounter++;
      if (sampleCounter >= periodSamples) {
        sampleCounter = 0;
        const feedback = (shiftRegister & 1) ^ ((shiftRegister >> 1) & 1);
        shiftRegister = (shiftRegister >> 1) | (feedback << 14);
        currentBit = shiftRegister & 1 ? 1 : -1;
      }
      channel[i] = currentBit * Math.pow(1 - t, 1.8) * volume;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(now);
  }

  /**
   * 击中砖块碎裂音效：短促 NES 噪声
   */
  public playHitBrick(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const duration = 0.05;
    const now = ctx.currentTime;
    const sampleRate = ctx.sampleRate;
    const totalSamples = Math.floor(sampleRate * duration);

    const buffer = ctx.createBuffer(1, totalSamples, sampleRate);
    const channel = buffer.getChannelData(0);

    let shiftRegister = 0x55aa;
    let sampleCounter = 0;
    let currentBit = 1;

    for (let i = 0; i < totalSamples; i++) {
      const t = i / totalSamples;
      sampleCounter++;
      if (sampleCounter >= 5) {
        sampleCounter = 0;
        const feedback = (shiftRegister & 1) ^ ((shiftRegister >> 1) & 1);
        shiftRegister = (shiftRegister >> 1) | (feedback << 14);
        currentBit = shiftRegister & 1 ? 1 : -1;
      }
      channel[i] = currentBit * (1 - t) * 0.22;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(now);
  }

  /**
   * 击中钢墙反弹音效：清脆金属音
   */
  public playHitSteel(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.setValueAtTime(2000, now + 0.02);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * 游戏结束哀伤琶音
   */
  public playGameOver(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const notes = [300, 260, 220, 180];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + idx * 0.16;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  }
}

export const audio = new AudioManager();
