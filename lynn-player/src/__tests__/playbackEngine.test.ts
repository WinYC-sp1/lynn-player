import { describe, it, expect, beforeEach } from 'vitest';
import { usePlayerStore } from '../stores/playerStore';
import type { TrackInfo } from '../types/player';

describe('Playback Engine', () => {
  beforeEach(() => {
    usePlayerStore.setState({
      currentTrack: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 0.8,
      playbackMode: 'sequential',
      playlist: [],
    });
  });

  const testTracks: TrackInfo[] = [
    {
      id: '1',
      title: 'Test Song 1',
      artist: 'Artist 1',
      album: 'Album 1',
      duration: 180,
      source: 'local',
    },
    {
      id: '2',
      title: 'Test Song 2',
      artist: 'Artist 2',
      album: 'Album 2',
      duration: 240,
      source: 'local',
    },
  ];

  it('should initialize with default values', () => {
    const state = usePlayerStore.getState();
    expect(state.currentTrack).toBeNull();
    expect(state.isPlaying).toBe(false);
    expect(state.volume).toBe(0.8);
    expect(state.playbackMode).toBe('sequential');
  });

  it('should set current track correctly', () => {
    const { setCurrentTrack } = usePlayerStore.getState();
    setCurrentTrack(testTracks[0]);
    const state = usePlayerStore.getState();
    expect(state.currentTrack).toEqual(testTracks[0]);
    expect(state.currentTime).toBe(0);
    expect(state.duration).toBe(180);
  });

  it('should toggle play state', () => {
    const { togglePlay, setIsPlaying } = usePlayerStore.getState();
    expect(usePlayerStore.getState().isPlaying).toBe(false);
    togglePlay();
    expect(usePlayerStore.getState().isPlaying).toBe(true);
    togglePlay();
    expect(usePlayerStore.getState().isPlaying).toBe(false);
    setIsPlaying(true);
    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });

  it('should set volume within valid range', () => {
    const { setVolume } = usePlayerStore.getState();
    setVolume(0.5);
    expect(usePlayerStore.getState().volume).toBe(0.5);
    setVolume(1.5);
    expect(usePlayerStore.getState().volume).toBe(1);
    setVolume(-0.5);
    expect(usePlayerStore.getState().volume).toBe(0);
  });

  it('should change playback mode', () => {
    const { setPlaybackMode } = usePlayerStore.getState();
    setPlaybackMode('shuffle');
    expect(usePlayerStore.getState().playbackMode).toBe('shuffle');
    setPlaybackMode('loop');
    expect(usePlayerStore.getState().playbackMode).toBe('loop');
  });

  it('should play next track in sequential mode', () => {
    usePlayerStore.setState({
      playlist: testTracks,
      currentTrack: testTracks[0],
    });
    const { playNext } = usePlayerStore.getState();
    playNext();
    expect(usePlayerStore.getState().currentTrack?.id).toBe('2');
    playNext();
    expect(usePlayerStore.getState().currentTrack?.id).toBe('1');
  });

  it('should play previous track', () => {
    usePlayerStore.setState({
      playlist: testTracks,
      currentTrack: testTracks[1],
    });
    const { playPrevious } = usePlayerStore.getState();
    playPrevious();
    expect(usePlayerStore.getState().currentTrack?.id).toBe('1');
    playPrevious();
    expect(usePlayerStore.getState().currentTrack?.id).toBe('2');
  });

  it('should not crash when playing next/prev with empty playlist', () => {
    const { playNext, playPrevious } = usePlayerStore.getState();
    expect(() => playNext()).not.toThrow();
    expect(() => playPrevious()).not.toThrow();
  });
});
