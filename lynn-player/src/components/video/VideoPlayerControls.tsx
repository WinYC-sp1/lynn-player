import { useCallback } from 'react';
import type { VideoMetadata } from '../../types/video';
import styles from './VideoPlayerControls.module.css';

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface VideoPlayerControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  isPip: boolean;
  metadata: VideoMetadata | null;
  title: string;
  visible: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onTogglePip: () => void;
  onSkip: (seconds: number) => void;
}

export default function VideoPlayerControls({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isFullscreen,
  isPip,
  metadata,
  title,
  visible,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleFullscreen,
  onTogglePip,
  onSkip,
}: VideoPlayerControlsProps) {
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumePercent = isMuted ? 0 : volume * 100;

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(percent * duration);
    },
    [duration, onSeek]
  );

  const handleVolumeClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onVolumeChange(percent);
    },
    [onVolumeChange]
  );

  const resolutionLabel = metadata
    ? metadata.width > 0
      ? `${metadata.width}x${metadata.height}`
      : ''
    : '';

  return (
    <div className={`${styles.controls} ${visible ? '' : styles.controlsHidden}`}>
      <div className={styles.controls__backdrop} />

      {title && (
        <div className={styles.controls__metadata}>
          <span className={styles.controls__title}>{title}</span>
          {resolutionLabel && (
            <span className={styles.controls__resolution}>{resolutionLabel}</span>
          )}
        </div>
      )}

      <div className={styles.controls__content}>
        <div
          className={styles.controls__progress}
          onClick={handleProgressClick}
        >
          <div className={styles.controls__progressTrack}>
            <div
              className={styles.controls__progressFill}
              style={{ width: `${progressPercent}%` }}
            />
            <div
              className={styles.controls__progressThumb}
              style={{ left: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className={styles.controls__row}>
          <button className={styles.controls__btn} onClick={() => onSkip(-10)}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12.5 8.14v7.72L6.5 12l6-3.86zM18.5 8.14v7.72L12.5 12l6-3.86z"
                fill="currentColor"
              />
            </svg>
          </button>

          <button className={styles.controls__btn} onClick={onTogglePlay}>
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
                <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5v14l11-7z" fill="currentColor" />
              </svg>
            )}
          </button>

          <button className={styles.controls__btn} onClick={() => onSkip(10)}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M5.5 8.14v7.72L11.5 12l-6-3.86zM11.5 8.14v7.72L17.5 12l-6-3.86z"
                fill="currentColor"
              />
            </svg>
          </button>

          <span className={styles.controls__time}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className={styles.controls__spacer} />

          <div className={styles.controls__volume}>
            <button className={`${styles.controls__btn} ${styles.smallBtn}`} onClick={onToggleMute}>
              {isMuted || volume === 0 ? (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M23 9l-6 6M17 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : volume < 0.5 ? (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M15.54 8.46a5 5 0 010 7.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M15.54 8.46a5 5 0 010 7.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M19.07 4.93a10 10 0 010 14.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>
            <div className={styles.controls__volumeSlider} onClick={handleVolumeClick}>
              <div className={styles.controls__volumeTrack}>
                <div className={styles.controls__volumeFill} style={{ width: `${volumePercent}%` }} />
              </div>
            </div>
          </div>

          <button
            className={`${styles.controls__btn} ${styles.smallBtn}`}
            onClick={onTogglePip}
            style={{ opacity: isPip ? 1 : 0.7 }}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
              <rect x="12" y="11" width="8" height="7" rx="1" fill="currentColor" />
            </svg>
          </button>

          <button className={`${styles.controls__btn} ${styles.smallBtn}`} onClick={onToggleFullscreen}>
            {isFullscreen ? (
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 3v3H5M21 8h-3V5M3 16h3v3M16 21v-3h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 3H5v3M16 3h3v3M8 21H5v-3M16 21h3v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
