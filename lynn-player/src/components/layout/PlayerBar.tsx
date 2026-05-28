import { usePlayerStore } from '../../stores/playerStore';
import type { PlaybackMode } from '../../types/player';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const modeOrder: PlaybackMode[] = ['sequential', 'loop', 'shuffle'];

function ModeIcon({ mode }: { mode: PlaybackMode }) {
  switch (mode) {
    case 'sequential':
      return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 8h12M4 16h12M20 8l-3 3 3 3M20 16l-3 3 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'loop':
      return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 1l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 11V9a4 4 0 014-4h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 23l-4-4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21 13v2a4 4 0 01-4 4H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'shuffle':
      return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

export default function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackMode,
    setIsPlaying,
    setCurrentTime,
    setVolume,
    setPlaybackMode,
    playNext,
    playPrevious,
    togglePlay,
  } = usePlayerStore();

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumePercent = volume * 100;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    setCurrentTime(percent * duration);
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    setVolume(percent);
  };

  const cyclePlaybackMode = () => {
    const currentIndex = modeOrder.indexOf(playbackMode);
    const nextIndex = (currentIndex + 1) % modeOrder.length;
    setPlaybackMode(modeOrder[nextIndex]);
  };

  return (
    <div className="app-layout__playerbar">
      <div className="playerbar__track-info">
        <div className="playerbar__cover">
          {currentTrack?.coverUrl ? (
            <img src={currentTrack.coverUrl} alt="" />
          ) : (
            <svg className="playerbar__cover-placeholder" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" />
              <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2" />
            </svg>
          )}
        </div>
        <div className="playerbar__track-text">
          <div className="playerbar__track-title">{currentTrack?.title ?? 'No track playing'}</div>
          <div className="playerbar__track-artist">{currentTrack?.artist ?? '--'}</div>
        </div>
      </div>

      <div className="playerbar__controls">
        <div className="playerbar__buttons">
          <button className="playerbar__btn" onClick={playPrevious}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 20L9 12l10-8v16zM5 4v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button className="playerbar__btn playerbar__btn--play" onClick={togglePlay}>
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
          <button className="playerbar__btn" onClick={playNext}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 4l10 8-10 8V4zM19 4v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="playerbar__progress">
          <span className="playerbar__progress-time">{formatTime(currentTime)}</span>
          <div className="playerbar__progress-bar" onClick={handleProgressClick}>
            <div className="playerbar__progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="playerbar__progress-time">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="playerbar__extra">
        <div className="playerbar__volume">
          <button className="playerbar__volume-btn" onClick={() => setIsPlaying(!isPlaying)}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              {volume > 0 && (
                <path d="M15.54 8.46a5 5 0 010 7.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              )}
              {volume > 0.5 && (
                <path d="M19.07 4.93a10 10 0 010 14.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
          <div className="playerbar__volume-slider" onClick={handleVolumeClick}>
            <div className="playerbar__volume-fill" style={{ width: `${volumePercent}%` }} />
          </div>
        </div>
        <button
          className={`playerbar__mode-btn ${playbackMode !== 'sequential' ? 'playerbar__mode-btn--active' : ''}`}
          onClick={cyclePlaybackMode}
          title={playbackMode}
        >
          <ModeIcon mode={playbackMode} />
        </button>
      </div>
    </div>
  );
}
