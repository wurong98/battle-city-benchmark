/**
 * 经典 FC 坦克大战 8-bit 复古合成音效引擎 (基于原生 Web Audio API，零外部依赖)
 * 采用 Nintendo NES 2A03 APU LFSR 噪声芯片级仿真
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  public unlock(): void {
    const ctx = this.ensureContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
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
   * 原版 FC 坦克射击音效：高频下沉方波 (2A03 脉冲波)
   */
  public playShoot(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(860, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.11);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.11);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.11);
  }

  /**
   * 经典 FC 原版坦克爆炸音效 (NES 2A03 LFSR 噪声下沉仿真)
   * 纯正的红白机粗颗粒炸裂声：高频爆破启动 -> 逐级快速降频撕裂 -> 低频轰鸣消退
   */
  public playKillEnemy(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 0.48;
    const sampleRate = ctx.sampleRate;
    const totalSamples = Math.floor(sampleRate * duration);

    // 创建 AudioBuffer 真实模拟 NES 15-bit LFSR (Linear Feedback Shift Register)
    const buffer = ctx.createBuffer(1, totalSamples, sampleRate);
    const channel = buffer.getChannelData(0);

    let shiftRegister = 0x7fff; // 15-bit NES noise LFSR 初始种子
    let sampleCounter = 0;
    let currentBit = 1;

    for (let i = 0; i < totalSamples; i++) {
      const t = i / totalSamples; // 进度 0.0 ~ 1.0

      // NES 原版爆炸秘诀：时钟周期动态拉长 (频率从 ~12kHz 极速骤降到 ~400Hz)
      // 产生红白机标志性的“粗糙下沉撕裂颗粒感”
      const periodSamples = Math.max(
        2,
        Math.floor(sampleRate / (12000 * Math.pow(1 - t * 0.95, 3.2) + 380))
      );

      sampleCounter++;
      if (sampleCounter >= periodSamples) {
        sampleCounter = 0;
        // 经典 NES Mode 0: bit 0 XOR bit 1
        const feedback = (shiftRegister & 1) ^ ((shiftRegister >> 1) & 1);
        shiftRegister = (shiftRegister >> 1) | (feedback << 14);
        currentBit = (shiftRegister & 1) ? 1 : -1;
      }

      // 4-bit 阶梯衰减音量 (模拟红白机 16 级音量包络)
      const rawVolume = Math.pow(1 - t, 1.2);
      const steppedVolume = Math.floor(rawVolume * 15) / 15;

      channel[i] = currentBit * steppedVolume * 0.7;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.9, now);
    gain.gain.linearRampToValueAtTime(0.01, now + duration);

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(now);
  }

  /**
   * 小型爆破音效 (子弹触碰/微型火花)
   */
  public playExplosion(isBig: boolean = false): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    if (isBig) {
      this.playKillEnemy();
      return;
    }

    const duration = 0.14;
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
        Math.floor(sampleRate / (8000 * Math.pow(1 - t * 0.8, 2) + 500))
      );

      sampleCounter++;
      if (sampleCounter >= periodSamples) {
        sampleCounter = 0;
        const feedback = (shiftRegister & 1) ^ ((shiftRegister >> 1) & 1);
        shiftRegister = (shiftRegister >> 1) | (feedback << 14);
        currentBit = (shiftRegister & 1) ? 1 : -1;
      }

      const steppedVolume = Math.floor((1 - t) * 15) / 15;
      channel[i] = currentBit * steppedVolume * 0.45;
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

    const duration = 0.06;
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
      if (sampleCounter >= 6) {
        sampleCounter = 0;
        const feedback = (shiftRegister & 1) ^ ((shiftRegister >> 1) & 1);
        shiftRegister = (shiftRegister >> 1) | (feedback << 14);
        currentBit = (shiftRegister & 1) ? 1 : -1;
      }
      channel[i] = currentBit * (1 - t) * 0.35;
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
    osc.frequency.setValueAtTime(2000, now + 0.025);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
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

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  }
}

export const audio = new AudioManager();
