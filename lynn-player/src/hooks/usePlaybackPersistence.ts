import { useEffect } from 'react';
import { usePlayerStore } from '../stores/playerStore';
import type { TrackInfo } from '../types/player';

const STORAGE_KEY = 'lynn-player-playback-state';

interface PersistedPlaybackState {
  currentTrack: TrackInfo | null;
  currentTime: number;
  volume: number;
  playbackMode: string;
  playlist: TrackInfo[];
  timestamp: number;
}

export function usePlaybackPersistence() {
  const {
    currentTrack,
    currentTime,
    volume,
    playbackMode,
    playlist,
    setCurrentTrack,
    setCurrentTime,
    setVolume,
    setPlaybackMode,
  } = usePlayerStore();

  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const state: PersistedPlaybackState = JSON.parse(savedState);
        if (state.currentTrack) {
          setCurrentTrack(state.currentTrack);
        }
        setCurrentTime(state.currentTime);
        setVolume(state.volume);
        setPlaybackMode(state.playbackMode as any);
      } catch (error) {
        console.error('Failed to restore playback state:', error);
      }
    }
  }, [setCurrentTrack, setCurrentTime, setVolume, setPlaybackMode]);

  useEffect(() => {
    const state: PersistedPlaybackState = {
      currentTrack,
      currentTime,
      volume,
      playbackMode,
      playlist,
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save playback state:', error);
    }
  }, [currentTrack, currentTime, volume, playbackMode, playlist]);
}
