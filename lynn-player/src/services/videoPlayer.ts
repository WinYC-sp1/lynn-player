import { invoke } from '@tauri-apps/api/core';
import { convertFileSrc } from '@tauri-apps/api/core';
import type { VideoMetadata, VideoFormat } from '../types/video';

const FORMAT_EXTENSIONS: Record<VideoFormat, string[]> = {
  mp4: ['mp4', 'm4v'],
  avi: ['avi'],
  mkv: ['mkv'],
  flv: ['flv'],
  mov: ['mov'],
  wmv: ['wmv'],
  webm: ['webm'],
};

export async function getVideoMetadata(path: string): Promise<VideoMetadata> {
  return invoke<VideoMetadata>('get_video_metadata', { path });
}

export function convertToPlayableUrl(path: string): string {
  return convertFileSrc(path);
}

export async function getSupportedFormats(): Promise<string[]> {
  return invoke<string[]>('get_supported_video_formats');
}

export function detectFormat(filePath: string): VideoFormat | null {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
  for (const [format, extensions] of Object.entries(FORMAT_EXTENSIONS)) {
    if (extensions.includes(ext)) {
      return format as VideoFormat;
    }
  }
  return null;
}

export function getResolutionLabel(_width: number, height: number): string {
  if (height >= 2160) return '4k';
  if (height >= 1080) return '1080p';
  if (height >= 720) return '720p';
  if (height >= 480) return '480p';
  return '360p';
}
