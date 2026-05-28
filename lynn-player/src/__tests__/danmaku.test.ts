import { describe, it, expect } from 'vitest';

interface Danmaku {
  id: string;
  text: string;
  time: number;
  type: 'scroll' | 'top' | 'bottom';
  color: string;
  fontSize: number;
}

class DanmakuManager {
  private danmakus: Danmaku[] = [];

  add(danmaku: Omit<Danmaku, 'id'>): Danmaku {
    const newDanmaku: Danmaku = {
      ...danmaku,
      id: Math.random().toString(36).substr(2, 9),
    };
    this.danmakus.push(newDanmaku);
    return newDanmaku;
  }

  getByTime(time: number, windowSize = 5): Danmaku[] {
    return this.danmakus.filter(
      (d) => d.time >= time - windowSize && d.time <= time
    );
  }

  getAll(): Danmaku[] {
    return [...this.danmakus];
  }

  clear(): void {
    this.danmakus = [];
  }

  remove(id: string): boolean {
    const index = this.danmakus.findIndex((d) => d.id === id);
    if (index !== -1) {
      this.danmakus.splice(index, 1);
      return true;
    }
    return false;
  }
}

describe('Danmaku System', () => {
  describe('DanmakuManager', () => {
    it('should initialize with empty list', () => {
      const manager = new DanmakuManager();
      expect(manager.getAll().length).toBe(0);
    });

    it('should add danmaku', () => {
      const manager = new DanmakuManager();
      const danmaku = manager.add({
        text: 'Hello',
        time: 10,
        type: 'scroll',
        color: '#ffffff',
        fontSize: 24,
      });
      expect(danmaku.id).toBeDefined();
      expect(manager.getAll().length).toBe(1);
    });

    it('should get danmakus by time window', () => {
      const manager = new DanmakuManager();
      manager.add({ text: '1', time: 5, type: 'scroll', color: '#fff', fontSize: 24 });
      manager.add({ text: '2', time: 10, type: 'scroll', color: '#fff', fontSize: 24 });
      manager.add({ text: '3', time: 15, type: 'scroll', color: '#fff', fontSize: 24 });
      manager.add({ text: '4', time: 20, type: 'scroll', color: '#fff', fontSize: 24 });
      const result = manager.getByTime(12);
      expect(result.length).toBe(1);
    });

    it('should clear all danmakus', () => {
      const manager = new DanmakuManager();
      manager.add({ text: 'Test', time: 10, type: 'scroll', color: '#fff', fontSize: 24 });
      manager.clear();
      expect(manager.getAll().length).toBe(0);
    });

    it('should remove danmaku by id', () => {
      const manager = new DanmakuManager();
      const danmaku = manager.add({ text: 'Test', time: 10, type: 'scroll', color: '#fff', fontSize: 24 });
      expect(manager.remove(danmaku.id)).toBe(true);
      expect(manager.getAll().length).toBe(0);
      expect(manager.remove('invalid-id')).toBe(false);
    });
  });

  describe('Danmaku Types', () => {
    it('should support different danmaku types', () => {
      const manager = new DanmakuManager();
      manager.add({ text: 'Scroll', time: 0, type: 'scroll', color: '#fff', fontSize: 24 });
      manager.add({ text: 'Top', time: 0, type: 'top', color: '#fff', fontSize: 24 });
      manager.add({ text: 'Bottom', time: 0, type: 'bottom', color: '#fff', fontSize: 24 });
      const all = manager.getAll();
      expect(all[0].type).toBe('scroll');
      expect(all[1].type).toBe('top');
      expect(all[2].type).toBe('bottom');
    });

    it('should support custom colors and font sizes', () => {
      const manager = new DanmakuManager();
      const red = manager.add({ text: 'Red', time: 0, type: 'scroll', color: '#ff0000', fontSize: 24 });
      const large = manager.add({ text: 'Large', time: 0, type: 'scroll', color: '#fff', fontSize: 36 });
      expect(red.color).toBe('#ff0000');
      expect(large.fontSize).toBe(36);
    });
  });
});
