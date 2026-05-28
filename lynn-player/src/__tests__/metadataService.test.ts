import { describe, it, expect, vi } from 'vitest';
import { detectFormat, getResolutionLabel } from '../services/videoPlayer';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
  convertFileSrc: vi.fn((path) => `asset://${path}`),
}));

describe('Metadata Service', () => {
  describe('detectFormat', () => {
    it('should detect mp4 format', () => {
      expect(detectFormat('video.mp4')).toBe('mp4');
      expect(detectFormat('video.MP4')).toBe('mp4');
      expect(detectFormat('video.m4v')).toBe('mp4');
    });

    it('should detect mkv format', () => {
      expect(detectFormat('video.mkv')).toBe('mkv');
    });

    it('should detect avi format', () => {
      expect(detectFormat('video.avi')).toBe('avi');
    });

    it('should detect flv format', () => {
      expect(detectFormat('video.flv')).toBe('flv');
    });

    it('should detect mov format', () => {
      expect(detectFormat('video.mov')).toBe('mov');
    });

    it('should detect wmv format', () => {
      expect(detectFormat('video.wmv')).toBe('wmv');
    });

    it('should detect webm format', () => {
      expect(detectFormat('video.webm')).toBe('webm');
    });

    it('should return null for unknown format', () => {
      expect(detectFormat('file.txt')).toBeNull();
      expect(detectFormat('video.xyz')).toBeNull();
    });

    it('should handle paths without extension', () => {
      expect(detectFormat('file')).toBeNull();
      expect(detectFormat('/path/to/video')).toBeNull();
    });
  });

  describe('getResolutionLabel', () => {
    it('should return 4k for height >= 2160', () => {
      expect(getResolutionLabel(3840, 2160)).toBe('4k');
      expect(getResolutionLabel(4096, 2160)).toBe('4k');
      expect(getResolutionLabel(7680, 4320)).toBe('4k');
    });

    it('should return 1080p for height >= 1080 and < 2160', () => {
      expect(getResolutionLabel(1920, 1080)).toBe('1080p');
      expect(getResolutionLabel(1920, 1440)).toBe('1080p');
    });

    it('should return 720p for height >= 720 and < 1080', () => {
      expect(getResolutionLabel(1280, 720)).toBe('720p');
      expect(getResolutionLabel(1280, 900)).toBe('720p');
    });

    it('should return 480p for height >= 480 and < 720', () => {
      expect(getResolutionLabel(854, 480)).toBe('480p');
      expect(getResolutionLabel(1024, 576)).toBe('480p');
    });

    it('should return 360p for height < 480', () => {
      expect(getResolutionLabel(640, 360)).toBe('360p');
      expect(getResolutionLabel(480, 240)).toBe('360p');
    });
  });
});
