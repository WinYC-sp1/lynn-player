import { useState, useEffect } from 'react';
import { useNeteaseStore } from '../../stores/neteaseStore';
import { usePlayerStore } from '../../stores/playerStore';
import { neteaseClient } from '../../services/neteaseClient';
import type { NeteasePlaylist, NeteaseSong } from '../../types/netease';
import type { TrackInfo } from '../../types/player';

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function songToTrack(song: NeteaseSong): TrackInfo {
  return {
    id: `netease-${song.id}`,
    title: song.name,
    artist: song.artists.map((a) => a.name).join(' / '),
    album: song.album.name,
    duration: song.duration,
    coverUrl: song.album.picUrl,
    source: 'netease',
  };
}

export default function NeteasePlaylist() {
  const [recommendPlaylists, setRecommendPlaylists] = useState<NeteasePlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<NeteasePlaylist | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<NeteaseSong[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const { playlists, isLoggedIn, fetchUserPlaylists } = useNeteaseStore();
  const { setCurrentTrack, setIsPlaying } = usePlayerStore();

  useEffect(() => {
    loadRecommendPlaylists();
    if (isLoggedIn) {
      fetchUserPlaylists();
    }
  }, [isLoggedIn, fetchUserPlaylists]);

  const loadRecommendPlaylists = async () => {
    try {
      const result = await neteaseClient.getRecommendResource();
      setRecommendPlaylists(result.recommend ?? []);
    } catch {
      try {
        const result = await neteaseClient.getTopPlaylist('全部', 12, 0);
        setRecommendPlaylists(result.playlists);
      } catch {
        // ignored
      }
    }
  };

  const handleSelectPlaylist = async (playlist: NeteasePlaylist) => {
    setSelectedPlaylist(playlist);
    setLoading(true);
    try {
      const result = await neteaseClient.getPlaylistDetail(playlist.id);
      setPlaylistTracks(result.playlist?.tracks ?? []);
    } catch {
      setPlaylistTracks([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = async (song: NeteaseSong) => {
    try {
      const urlResult = await neteaseClient.getSongUrl(song.id);
      if (urlResult.data?.[0]?.url) {
        const track = songToTrack(song);
        setCurrentTrack(track);
        setIsPlaying(true);
      }
    } catch {
      // ignored
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    try {
      await neteaseClient.createPlaylist(newPlaylistName.trim());
      setShowCreateModal(false);
      setNewPlaylistName('');
      await fetchUserPlaylists();
    } catch {
      // ignored
    }
  };

  const handleBack = () => {
    setSelectedPlaylist(null);
    setPlaylistTracks([]);
  };

  if (selectedPlaylist) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <button
            onClick={handleBack}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              fontSize: '13px',
            }}
          >
            ← 返回
          </button>
          <img
            src={selectedPlaylist.coverImgUrl}
            alt={selectedPlaylist.name}
            style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ellipsis" style={{ fontSize: '16px', fontWeight: 600 }}>
              {selectedPlaylist.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {selectedPlaylist.trackCount} 首
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
            加载中...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {playlistTracks.map((song, index) => (
              <div
                key={`${song.id}-${index}`}
                onClick={() => handlePlaySong(song)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ width: '28px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  {index + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ellipsis" style={{ fontSize: '14px' }}>{song.name}</div>
                  <div className="ellipsis" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {song.artists.map((a) => a.name).join(' / ')}
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {formatDuration(song.duration)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600 }}>推荐歌单</h2>
        {isLoggedIn && (
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
              fontSize: '13px',
            }}
          >
            + 新建歌单
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {recommendPlaylists.map((pl) => (
          <div
            key={pl.id}
            onClick={() => handleSelectPlaylist(pl)}
            style={{
              cursor: 'pointer',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: 'var(--bg-secondary)',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <img
              src={pl.coverImgUrl}
              alt={pl.name}
              style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }}
            />
            <div style={{ padding: '8px' }}>
              <div className="ellipsis" style={{ fontSize: '13px' }}>{pl.name}</div>
            </div>
          </div>
        ))}
      </div>

      {isLoggedIn && playlists.length > 0 && (
        <>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>我的歌单</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {playlists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => handleSelectPlaylist(pl)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <img
                  src={pl.coverImgUrl}
                  alt={pl.name}
                  style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ellipsis" style={{ fontSize: '14px' }}>{pl.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {pl.trackCount} 首
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '12px',
              padding: '24px',
              width: '320px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>新建歌单</h3>
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="歌单名称"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                marginBottom: '16px',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              >
                取消
              </button>
              <button
                onClick={handleCreatePlaylist}
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--accent)',
                  color: '#ffffff',
                  fontSize: '13px',
                }}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
