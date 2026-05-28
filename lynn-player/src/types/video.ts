export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  videoCodec: string;
  audioCodec: string;
  frameRate: number;
  hasSubtitles: boolean;
}

export type VideoFormat = 'mp4' | 'avi' | 'mkv' | 'flv' | 'mov' | 'wmv' | 'webm';

export type VideoQuality = '360p' | '480p' | '720p' | '1080p' | '4k';

export interface VideoTrack {
  id: string;
  title: string;
  filePath: string;
  duration: number;
  resolution: string;
  format: VideoFormat;
  source: 'local' | 'bilibili';
}
