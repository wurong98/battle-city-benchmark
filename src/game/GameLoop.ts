import { FIXED_DT } from './constants';

export class GameLoop {
  private lastTime = 0;
  private accumulator = 0;
  private animationFrameId: number | null = null;
  private running = false;
  private updateFn: (dt: number) => void;
  private renderFn: (interpolation: number) => void;

  constructor(
    updateFn: (dt: number) => void,
    renderFn: (interpolation: number) => void
  ) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;
  }

  public start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.animationFrameId = requestAnimationFrame(this.step);
  }

  public stop(): void {
    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private step = (currentTime: number): void => {
    if (!this.running) return;

    let frameTime = (currentTime - this.lastTime) / 1000;
    if (frameTime > 0.25) {
      frameTime = 0.25;
    }
    this.lastTime = currentTime;
    this.accumulator += frameTime;

    while (this.accumulator >= FIXED_DT) {
      this.updateFn(FIXED_DT);
      this.accumulator -= FIXED_DT;
    }

    const alpha = this.accumulator / FIXED_DT;
    this.renderFn(alpha);

    this.animationFrameId = requestAnimationFrame(this.step);
  };
}
