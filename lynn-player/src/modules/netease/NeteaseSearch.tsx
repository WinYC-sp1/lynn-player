import { useState, useEffect, useRef, useCallback } from 'react';
import { useNeteaseStore } from '../../stores/neteaseStore';
import { usePlayerStore } from '../../stores/playerStore';
import { neteaseClient } from '../../services/neteaseClient';
import type { NeteaseSong, SearchType, NeteaseSearchResultAlbum, NeteaseSearchResultArtist, NeteaseSearchResultPlaylist } from '../../types/netease';
import type { TrackInfo } from '../../types/player';

const TABS: { key: SearchType; label: string }[] = [
  { key: 'song', label: '单曲' },
  { key: 'album', label: '专辑' },
  { key: 'artist', label: '歌手' },
  { key: 'playlist', label: '歌单' },
];

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

export default function NeteaseSearch() {
  const [keywords, setKeywords] = useState('');
  const [activeTab, setActiveTab] = useState<SearchType>('song');
  const [albumResults, setAlbumResults] = useState<NeteaseSearchResultAlbum | null>(null);
  const [artistResults, setArtistResults] = useState<NeteaseSearchResultArtist | null>(null);
  const [playlistResults, setPlaylistResults] = useState<NeteaseSearchResultPlaylist | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { searchResults, searchLoading, search } = useNeteaseStore();
  const { setCurrentTrack, setIsPlaying } = usePlayerStore();

  const debouncedSearch = useCallback(
    (kw: string, type: SearchType) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        if (kw.trim()) {
          if (type === 'song') {
            search(kw, type);
          } else {
            performSearch(kw, type);
          }
        }
      }, 300);
    },
    [search],
  );

  const performSearch = async (kw: string, type: SearchType) => {
    try {
      const result = await neteaseClient.search(kw, type);
      if (type === 'album') setAlbumResults(result as NeteaseSearchResultAlbum);
      if (type === 'artist') setArtistResults(result as NeteaseSearchResultArtist);
      if (type === 'playlist') setPlaylistResults(result as NeteaseSearchResultPlaylist);
    } catch {
      // ignored
    }
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleInputChange = (value: string) => {
    setKeywords(value);
    if (value.trim()) {
      debouncedSearch(value, activeTab);
    }
  };

  const handleTabChange = (type: SearchType) => {
    setActiveTab(type);
    if (keywords.trim()) {
      if (type === 'song') {
        search(keywords, type);
      } else {
        performSearch(keywords, type);
      }
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

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="text"
          value={keywords}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="搜索音乐..."
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            fontSize: '14px',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              backgroundColor: activeTab === tab.key ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: activeTab === tab.key ? '#ffffff' : 'var(--text-primary)',
              fontSize: '13px',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {searchLoading && (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
          搜索中...
        </div>
      )}

      {!searchLoading && activeTab === 'song' && searchResults?.songs && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {searchResults.songs.map((song) => (
            <div
              key={song.id}
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
                  {song.artists.map((a) => a.name).join(' / ')} — {song.album.name}
                </div>
              </div>
              <div style={{ marginLeft: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {formatDuration(song.duration)}
              </div>
            </div>
          ))}
        </div>
      )}

      {!searchLoading && activeTab === 'album' && albumResults?.albums && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
          {albumResults.albums.map((album) => (
            <div
              key={album.id}
              style={{
                cursor: 'pointer',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              {album.picUrl && (
                <img
                  src={album.picUrl}
                  alt={album.name}
                  style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }}
                />
              )}
              <div style={{ padding: '8px' }}>
                <div className="ellipsis" style={{ fontSize: '13px' }}>{album.name}</div>
                <div className="ellipsis" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {album.artist.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!searchLoading && activeTab === 'artist' && artistResults?.artists && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
          {artistResults.artists.map((artist) => (
            <div
              key={artist.id}
              style={{
                textAlign: 'center',
                cursor: 'pointer',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              {artist.picUrl && (
                <img
                  src={artist.picUrl}
                  alt={artist.name}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    marginBottom: '8px',
                  }}
                />
              )}
              <div className="ellipsis" style={{ fontSize: '13px' }}>{artist.name}</div>
            </div>
          ))}
        </div>
      )}

      {!searchLoading && activeTab === 'playlist' && playlistResults?.playlists && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
          {playlistResults.playlists.map((pl) => (
            <div
              key={pl.id}
              style={{
                cursor: 'pointer',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <img
                src={pl.coverImgUrl}
                alt={pl.name}
                style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }}
              />
              <div style={{ padding: '8px' }}>
                <div className="ellipsis" style={{ fontSize: '13px' }}>{pl.name}</div>
                <div className="ellipsis" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {pl.trackCount} 首
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!searchLoading && keywords.trim() && !searchResults?.songs?.length && activeTab === 'song' && (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
          未找到结果
        </div>
      )}
    </div>
  );
}
