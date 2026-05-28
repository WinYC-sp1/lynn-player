import { useEffect, useState } from 'react';
import { useKugouStore } from '../../stores/kugouStore';
import { kugouClient } from '../../services/kugouClient';
import type { KugouSong, KugouRank } from '../../types/kugou';
import KugouRankDetail from './KugouRankDetail';

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function formatPlayCount(count: number): string {
  if (count >= 100000000) return `${(count / 100000000).toFixed(1)}亿`;
  if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
  return String(count);
}

type SubView = 'main' | { type: 'rank'; id: number; name: string };

export default function KugouRecommend() {
  const { recommendSongs, recommendPlaylists, rankList, fetchRecommendSongs, fetchRecommendPlaylists, fetchRankList, playSong, playSongs } = useKugouStore();
  const [newSongs, setNewSongs] = useState<KugouSong[]>([]);
  const [subView, setSubView] = useState<SubView>('main');

  useEffect(() => {
    fetchRecommendSongs();
    fetchRecommendPlaylists();
    fetchRankList();
    kugouClient.getNewSongs().then((r) => setNewSongs(r.songs)).catch(() => setNewSongs([]));
  }, [fetchRecommendSongs, fetchRecommendPlaylists, fetchRankList]);

  if (subView !== 'main') {
    const rankInfo = subView as { type: 'rank'; id: number; name: string };
    return (
      <KugouRankDetail
        rankId={rankInfo.id}
        rankName={rankInfo.name}
        onBack={() => setSubView('main')}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {recommendSongs.length > 0 && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Recommended Songs</h3>
            <button
              onClick={() => playSongs(recommendSongs)}
              style={{
                fontSize: '12px',
                padding: '4px 12px',
                borderRadius: '12px',
                backgroundColor: 'var(--accent)',
                color: '#ffffff',
              }}
            >
              Play All
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {recommendSongs.slice(0, 10).map((song) => (
              <div
                key={song.hash}
                onClick={() => playSong(song)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  gap: '12px',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ellipsis" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{song.name}</div>
                  <div className="ellipsis" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{song.singer}</div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', flexShrink: 0 }}>{formatDuration(song.duration)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {recommendPlaylists.length > 0 && (
        <section>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Recommended Playlists</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
            {recommendPlaylists.slice(0, 6).map((pl) => (
              <div key={pl.id} style={{ cursor: 'pointer' }}>
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-tertiary)',
                    backgroundImage: pl.coverImgUrl ? `url(${pl.coverImgUrl})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '4px',
                      right: '6px',
                      fontSize: '10px',
                      color: '#fff',
                      textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                    }}
                  >
                    {formatPlayCount(pl.playCount)}
                  </span>
                </div>
                <div className="ellipsis" style={{ fontSize: '12px', marginTop: '6px', color: 'var(--text-primary)' }}>{pl.name}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {newSongs.length > 0 && (
        <section>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>New Songs</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {newSongs.slice(0, 10).map((song) => (
              <div
                key={song.hash}
                onClick={() => playSong(song)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  gap: '12px',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ellipsis" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{song.name}</div>
                  <div className="ellipsis" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{song.singer} · {song.albumName}</div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', flexShrink: 0 }}>{formatDuration(song.duration)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {rankList.length > 0 && (
        <section>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Rankings</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {rankList.map((rank: KugouRank) => (
              <div
                key={rank.id}
                onClick={() => setSubView({ type: 'rank', id: rank.id, name: rank.name })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-secondary)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-tertiary)',
                    backgroundImage: rank.coverImgUrl ? `url(${rank.coverImgUrl})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ellipsis" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{rank.name}</div>
                  {rank.description && (
                    <div className="ellipsis" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{rank.description}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
