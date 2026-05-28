import { create } from 'zustand';
import type { TrackInfo, PlaybackMode } from '../types/player';

interface PlayerState {
  currentTrack: TrackInfo | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackMode: PlaybackMode;
  playlist: TrackInfo[];
  setCurrentTrack: (track: TrackInfo | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackMode: (mode: PlaybackMode) => void;
  setPlaylist: (playlist: TrackInfo[]) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlay: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  playbackMode: 'sequential',
  playlist: [],
  setCurrentTrack: (track) => set({ currentTrack: track, currentTime: 0, duration: track?.duration ?? 0 }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
  setPlaybackMode: (mode) => set({ playbackMode: mode }),
  setPlaylist: (playlist) => set({ playlist }),
  playNext: () => {
    const { playlist, currentTrack, playbackMode } = get();
    if (playlist.length === 0) return;
    const currentIndex = playlist.findIndex((t) => t.id === currentTrack?.id);
    let nextIndex: number;
    if (playbackMode === 'shuffle') {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = currentIndex < playlist.length - 1 ? currentIndex + 1 : 0;
    }
    const nextTrack = playlist[nextIndex];
    set({ currentTrack: nextTrack, currentTime: 0, duration: nextTrack.duration, isPlaying: true });
  },
  playPrevious: () => {
    const { playlist, currentTrack } = get();
    if (playlist.length === 0) return;
    const currentIndex = playlist.findIndex((t) => t.id === currentTrack?.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : playlist.length - 1;
    const prevTrack = playlist[prevIndex];
    set({ currentTrack: prevTrack, currentTime: 0, duration: prevTrack.duration, isPlaying: true });
  },
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
}));
