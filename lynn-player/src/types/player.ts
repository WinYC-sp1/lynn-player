export type PlaybackMode = 'sequential' | 'loop' | 'shuffle';

export type TrackSource = 'local' | 'netease' | 'kugou';

export interface TrackInfo {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverUrl?: string;
  filePath?: string;
  source: TrackSource;
}
