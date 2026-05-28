import { useEffect, useState } from 'react';
import { kugouClient } from '../../services/kugouClient';
import { useKugouStore } from '../../stores/kugouStore';
import type { KugouSong, KugouRankDetail as KugouRankDetailType } from '../../types/kugou';

interface KugouRankDetailProps {
  rankId: number;
  rankName: string;
  onBack: () => void;
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default function KugouRankDetail({ rankId, rankName, onBack }: KugouRankDetailProps) {
  const [detail, setDetail] = useState<KugouRankDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const { playSong, playSongs } = useKugouStore();

  useEffect(() => {
    setLoading(true);
    kugouClient
      .getRankDetail(rankId)
      .then((data) => setDetail(data))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [rankId]);

  const songs: KugouSong[] = detail?.songs ?? [];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <button
          onClick={onBack}
          style={{
            fontSize: '14px',
            padding: '4px 8px',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
          }}
        >
          ← Back
        </button>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {rankName}
        </h3>
        {songs.length > 0 && (
          <button
            onClick={() => playSongs(songs)}
            style={{
              marginLeft: 'auto',
              fontSize: '12px',
              padding: '4px 12px',
              borderRadius: '12px',
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
            }}
          >
            Play All
          </button>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          Loading...
        </div>
      )}

      {!loading && songs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          No songs found
        </div>
      )}

      {!loading && songs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {songs.map((song, index) => (
            <div
              key={song.hash}
              onClick={() => playSong(song)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                gap: '12px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span
                style={{
                  width: '24px',
                  textAlign: 'center',
                  fontSize: '13px',
                  color: index < 3 ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: index < 3 ? 700 : 400,
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="ellipsis"
                  style={{ fontSize: '14px', color: 'var(--text-primary)' }}
                >
                  {song.name}
                </div>
                <div
                  className="ellipsis"
                  style={{ fontSize: '12px', color: 'var(--text-secondary)' }}
                >
                  {song.singer} · {song.albumName}
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', flexShrink: 0 }}>
                {formatDuration(song.duration)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
