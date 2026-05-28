interface PerformanceMetrics {
  fps: number;
  memory?: MemoryInfo;
  frameTime: number;
  lastUpdate: number;
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceMonitorOptions {
  sampleInterval?: number;
  historySize?: number;
  onUpdate?: (metrics: PerformanceMetrics) => void;
}

class PerformanceMonitor {
  private frameCount = 0;
  private lastFpsUpdate = performance.now();
  private fps = 0;
  private lastFrameTime = performance.now();
  private frameTime = 0;
  private sampleInterval: number;
  private historySize: number;
  private history: PerformanceMetrics[] = [];
  private onUpdate: ((metrics: PerformanceMetrics) => void) | undefined;
  private animationFrameId: number | null = null;
  private isRunning = false;

  constructor(options: PerformanceMonitorOptions = {}) {
    this.sampleInterval = options.sampleInterval || 500;
    this.historySize = options.historySize || 60;
    this.onUpdate = options.onUpdate;
  }

  private tick = () => {
    if (!this.isRunning) return;

    const now = performance.now();
    this.frameCount++;

    this.frameTime = now - this.lastFrameTime;
    this.lastFrameTime = now;

    if (now - this.lastFpsUpdate >= this.sampleInterval) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;

      const metrics: PerformanceMetrics = {
        fps: this.fps,
        frameTime: this.frameTime,
        lastUpdate: now,
        memory: (performance as any).memory,
      };

      this.history.push(metrics);
      if (this.history.length > this.historySize) {
        this.history.shift();
      }

      if (this.onUpdate) {
        this.onUpdate(metrics);
      }
    }

    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    this.lastFrameTime = performance.now();
    this.tick();
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  getMetrics(): PerformanceMetrics {
    return {
      fps: this.fps,
      frameTime: this.frameTime,
      lastUpdate: performance.now(),
      memory: (performance as any).memory,
    };
  }

  getHistory(): PerformanceMetrics[] {
    return [...this.history];
  }

  reset() {
    this.history = [];
    this.frameCount = 0;
    this.fps = 0;
    this.frameTime = 0;
  }
}

export function createPerformanceMonitor(options: PerformanceMonitorOptions = {}) {
  return new PerformanceMonitor(options);
}

export function measurePerformance<T extends (...args: any[]) => any>(
  fn: T,
  label?: string
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>): ReturnType<T> => {
    const start = performance.now();
    try {
      return fn(...args);
    } finally {
      const end = performance.now();
      console.log(`${label || fn.name} took ${(end - start).toFixed(2)}ms`);
    }
  };
}

export async function measureAsyncPerformance<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  label?: string
): Promise<(...args: Parameters<T>) => Promise<ReturnType<T>>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const start = performance.now();
    try {
      return await fn(...args);
    } finally {
      const end = performance.now();
      console.log(`${label || fn.name} took ${(end - start).toFixed(2)}ms`);
    }
  };
}

const globalMonitor = createPerformanceMonitor();

export default globalMonitor;
