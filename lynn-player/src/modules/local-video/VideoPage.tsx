import { useState, useCallback } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import VideoPlayer from '../../components/video/VideoPlayer';
import { convertToPlayableUrl, getVideoMetadata, detectFormat, getResolutionLabel } from '../../services/videoPlayer';
import type { VideoMetadata, VideoTrack } from '../../types/video';

function formatDuration(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '--:--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VideoPage() {
  const [currentVideo, setCurrentVideo] = useState<VideoTrack | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [recentVideos, setRecentVideos] = useState<VideoTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenFile = useCallback(async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: 'Video Files',
            extensions: ['mp4', 'avi', 'mkv', 'flv', 'mov', 'wmv', 'webm', 'm4v', '3gp', 'ts'],
          },
        ],
      });

      if (!selected) return;

      const filePath = selected as string;
      setIsLoading(true);

      const fileName = filePath.split(/[\\/]/).pop() ?? filePath;
      const format = detectFormat(filePath);

      let videoMetadata: VideoMetadata | null = null;
      try {
        videoMetadata = await getVideoMetadata(filePath);
        setMetadata(videoMetadata);
      } catch {
        setMetadata(null);
      }

      const track: VideoTrack = {
        id: filePath,
        title: fileName.replace(/\.[^.]+$/, ''),
        filePath,
        duration: videoMetadata?.duration ?? 0,
        resolution: videoMetadata
          ? videoMetadata.width > 0
            ? getResolutionLabel(videoMetadata.width, videoMetadata.height)
            : ''
          : '',
        format: format ?? 'mp4',
        source: 'local',
      };

      setCurrentVideo(track);
      setRecentVideos((prev) => {
        const filtered = prev.filter((v) => v.id !== track.id);
        return [track, ...filtered].slice(0, 20);
      });
      setIsLoading(false);
    } catch {
      setIsLoading(false);
    }
  }, []);

  const handlePlayRecent = useCallback((track: VideoTrack) => {
    setCurrentVideo(track);
    getVideoMetadata(track.filePath)
      .then(setMetadata)
      .catch(() => setMetadata(null));
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {currentVideo ? (
        <div style={{ flex: 1, minHeight: 0 }}>
          <VideoPlayer
            src={convertToPlayableUrl(currentVideo.filePath)}
            title={currentVideo.title}
            metadata={metadata}
            onEnded={() => {}}
            onError={() => {}}
          />
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            color: 'var(--text-secondary)',
          }}
        >
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 9l5 3-5 3V9z" fill="currentColor" />
          </svg>
          <p style={{ fontSize: '16px' }}>No video loaded</p>
          <button
            onClick={handleOpenFile}
            disabled={isLoading}
            style={{
              padding: '10px 24px',
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? 'Loading...' : 'Open Video File'}
          </button>
        </div>
      )}

      <div style={{ padding: '16px 0', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Recently Opened
          </h2>
          <button
            onClick={handleOpenFile}
            style={{
              padding: '6px 14px',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          >
            Open File
          </button>
        </div>

        {recentVideos.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            No recent videos
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {recentVideos.map((video) => (
              <div
                key={video.id}
                onClick={() => handlePlayRecent(video)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor:
                    currentVideo?.id === video.id ? 'var(--active)' : 'transparent',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (currentVideo?.id !== video.id) {
                    e.currentTarget.style.backgroundColor = 'var(--hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentVideo?.id !== video.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, color: 'var(--text-secondary)' }}>
                  <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M10 9l5 3-5 3V9z" fill="currentColor" />
                </svg>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {video.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
                    {video.resolution && <span>{video.resolution}</span>}
                    <span>{video.format.toUpperCase()}</span>
                    <span>{formatDuration(video.duration)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
