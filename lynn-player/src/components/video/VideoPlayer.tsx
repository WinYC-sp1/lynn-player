import { useRef, useState, useCallback, useEffect } from 'react';
import { useVideoPlayer } from '../../hooks/useVideoPlayer';
import VideoPlayerControls from './VideoPlayerControls';
import type { VideoMetadata } from '../../types/video';
import styles from './VideoPlayer.module.css';

interface VideoPlayerProps {
  src: string;
  title?: string;
  metadata?: VideoMetadata | null;
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (time: number) => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
}

export default function VideoPlayer({
  src,
  title = '',
  metadata = null,
  onPlay,
  onPause,
  onTimeUpdate,
  onEnded,
  onError,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { videoRef, state, actions } = useVideoPlayer();
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      if (state.isPlaying) {
        setControlsVisible(false);
      }
    }, 3000);
  }, [state.isPlaying]);

  const handleMouseMove = useCallback(() => {
    showControls();
  }, [showControls]);

  const handleMouseLeave = useCallback(() => {
    if (state.isPlaying) {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      hideTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 1000);
    }
  }, [state.isPlaying]);

  const handleVideoClick = useCallback(() => {
    actions.togglePlay();
    showControls();
  }, [actions, showControls]);

  const handleDoubleClick = useCallback(() => {
    actions.toggleFullscreen(containerRef.current);
  }, [actions]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          actions.togglePlay();
          showControls();
          break;
        case 'arrowleft':
          e.preventDefault();
          actions.skip(-5);
          showControls();
          break;
        case 'arrowright':
          e.preventDefault();
          actions.skip(5);
          showControls();
          break;
        case 'arrowup':
          e.preventDefault();
          actions.setVolume(state.volume + 0.05);
          showControls();
          break;
        case 'arrowdown':
          e.preventDefault();
          actions.setVolume(state.volume - 0.05);
          showControls();
          break;
        case 'f':
          actions.toggleFullscreen(containerRef.current);
          showControls();
          break;
        case 'm':
          actions.toggleMute();
          showControls();
          break;
        case 'escape':
          if (state.isFullscreen) {
            document.exitFullscreen();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, state.volume, state.isFullscreen, showControls]);

  useEffect(() => {
    if (state.isPlaying && !controlsVisible) {
      showControls();
    }
  }, [state.isPlaying]);

  useEffect(() => {
    if (onPlay && state.isPlaying) onPlay();
  }, [state.isPlaying]);

  useEffect(() => {
    if (onPause && !state.isPlaying && state.currentTime > 0) onPause();
  }, [state.isPlaying]);

  useEffect(() => {
    if (onTimeUpdate) onTimeUpdate(state.currentTime);
  }, [state.currentTime]);

  useEffect(() => {
    if (onEnded && !state.isPlaying && state.currentTime > 0 && state.currentTime >= state.duration - 0.5) {
      onEnded();
    }
  }, [state.isPlaying, state.currentTime, state.duration]);

  useEffect(() => {
    if (onError && state.error) onError(state.error);
  }, [state.error]);

  return (
    <div
      className={styles.videoPlayer}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src={src}
        onClick={handleVideoClick}
        onDoubleClick={handleDoubleClick}
        playsInline
      />

      <div className={styles.videoPlayer__clickArea} onClick={handleVideoClick} onDoubleClick={handleDoubleClick} />

      {state.isLoading && <div className={styles.videoPlayer__loading} />}
      {state.error && <div className={styles.videoPlayer__error}>{state.error}</div>}

      <VideoPlayerControls
        isPlaying={state.isPlaying}
        currentTime={state.currentTime}
        duration={state.duration}
        volume={state.volume}
        isMuted={state.isMuted}
        isFullscreen={state.isFullscreen}
        isPip={state.isPip}
        metadata={metadata}
        title={title}
        visible={controlsVisible}
        onTogglePlay={() => {
          actions.togglePlay();
          showControls();
        }}
        onSeek={actions.seek}
        onVolumeChange={actions.setVolume}
        onToggleMute={actions.toggleMute}
        onToggleFullscreen={() => actions.toggleFullscreen(containerRef.current)}
        onTogglePip={actions.togglePip}
        onSkip={(s) => {
          actions.skip(s);
          showControls();
        }}
      />
    </div>
  );
}
