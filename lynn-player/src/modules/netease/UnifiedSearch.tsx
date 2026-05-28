import { useState, useCallback, useRef, useEffect } from 'react';
import { useUnifiedMusicStore, type UnifiedSong } from '../../stores/unifiedMusicStore';
import { useNeteaseStore } from '../../stores/neteaseStore';
import { useKugouStore } from '../../stores/kugouStore';
import { usePlayerStore } from '../../stores/playerStore';
import { neteaseClient } from '../../services/neteaseClient';
import { kugouClient } from '../../services/kugouClient';
import type { TrackInfo } from '../../types/player';

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function unifiedSongToTrack(song: UnifiedSong): TrackInfo {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    album: song.album,
    duration: song.duration,
    coverUrl: song.coverUrl,
    source: song.source,
  };
}

const sourceLabels: Record<string, string> = {
  netease: '网易云音乐',
  kugou: '酷狗音乐',
  local: '本地音乐',
};

export default function UnifiedSearch() {
  const [keywords, setKeywords] = useState('');
  const [searchMode, setSearchMode] = useState<'unified' | 'single'>('unified');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    activeSource,
    setActiveSource,
    searchAll,
    isSearching,
    neteaseResults,
    kugouResults,
  } = useUnifiedMusicStore();
  const { search: searchNetease, searchResults: neteaseSingleResults, searchLoading: neteaseLoading } = useNeteaseStore();
  const { search: searchKugou, searchResults: kugouSingleResults, searchLoading: kugouLoading } = useKugouStore();
  const { setCurrentTrack, setIsPlaying } = usePlayerStore();

  const debouncedSearch = useCallback(
    (kw: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        if (kw.trim()) {
          if (searchMode === 'unified') {
            searchAll(kw);
          } else {
            if (activeSource === 'netease') {
              searchNetease(kw, 'song');
            } else if (activeSource === 'kugou') {
              searchKugou(kw, 'song');
            }
          }
        }
      }, 300);
    },
    [searchAll, searchNetease, searchKugou, searchMode, activeSource],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleInputChange = (value: string) => {
    setKeywords(value);
    debouncedSearch(value);
  };

  const handlePlayUnifiedSong = async (song: UnifiedSong) => {
    try {
      if (song.source === 'netease' && song.originalData) {
        const urlResult = await neteaseClient.getSongUrl((song.originalData as any).id);
        if (urlResult.data?.[0]?.url) {
          const track = unifiedSongToTrack(song);
          setCurrentTrack(track);
          setIsPlaying(true);
        }
      } else if (song.source === 'kugou' && song.originalData) {
        const urlResult = await kugouClient.getSongUrl((song.originalData as any).hash);
        if (urlResult.url) {
          const track = unifiedSongToTrack(song);
          setCurrentTrack(track);
          setIsPlaying(true);
        }
      }
    } catch {
    }
  };

  const allResults = [...neteaseResults, ...kugouResults];
  const loading = searchMode === 'unified' ? isSearching :
    (activeSource === 'netease' ? neteaseLoading : kugouLoading);
  const singleResults = activeSource === 'netease' ?
    (neteaseSingleResults?.songs || []).map((s) => ({
      id: `netease-${s.id}`,
      source: 'netease' as const,
      title: s.name,
      artist: s.artists.map((a) => a.name).join(' / '),
      album: s.album.name,
      duration: s.duration,
      coverUrl: s.album.picUrl,
      originalData: s,
    })) :
    (kugouSingleResults?.songs || []).map((s) => ({
      id: `kugou-${s.hash}`,
      source: 'kugou' as const,
      title: s.name,
      artist: s.singer,
      album: s.albumName,
      duration: s.duration,
      originalData: s,
    }));

  const displayResults = searchMode === 'unified' ? allResults : singleResults;

  const renderSongItem = (song: UnifiedSong) => (
    <div
      key={song.id}
      onClick={() => handlePlayUnifiedSong(song)}
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
      {song.coverUrl && (
        <img
          src={song.coverUrl}
          alt=""
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '4px',
            marginRight: '12px',
            objectFit: 'cover',
          }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="ellipsis"
          style={{ fontSize: '14px', color: 'var(--text-primary)' }}
        >
          {song.title}
        </div>
        <div
          className="ellipsis"
          style={{ fontSize: '12px', color: 'var(--text-secondary)' }}
        >
          {song.artist} — {song.album}
        </div>
      </div>
      <div style={{
        marginLeft: '8px',
        fontSize: '11px',
        color: 'var(--text-secondary)',
        padding: '2px 8px',
        backgroundColor: 'var(--bg-tertiary)',
        borderRadius: '4px',
      }}>
        {sourceLabels[song.source]}
      </div>
      <div style={{ marginLeft: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
        {formatDuration(song.duration)}
      </div>
    </div>
  );

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

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setSearchMode('unified')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            backgroundColor: searchMode === 'unified' ? 'var(--accent)' : 'var(--bg-tertiary)',
            color: searchMode === 'unified' ? '#ffffff' : 'var(--text-primary)',
            fontSize: '13px',
            transition: 'all 0.2s',
          }}
        >
          聚合搜索
        </button>
        <button
          onClick={() => setSearchMode('single')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            backgroundColor: searchMode === 'single' ? 'var(--accent)' : 'var(--bg-tertiary)',
            color: searchMode === 'single' ? '#ffffff' : 'var(--text-primary)',
            fontSize: '13px',
            transition: 'all 0.2s',
          }}
        >
          单源搜索
        </button>
      </div>

      {searchMode === 'single' && (
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
          {['netease', 'kugou'].map((source) => (
            <button
              key={source}
              onClick={() => setActiveSource(source as any)}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                backgroundColor: activeSource === source ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: activeSource === source ? '#ffffff' : 'var(--text-primary)',
                fontSize: '13px',
              }}
            >
              {sourceLabels[source]}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
          搜索中...
        </div>
      )}

      {!loading && displayResults.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {displayResults.map(renderSongItem)}
        </div>
      )}

      {!loading && keywords.trim() && displayResults.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
          未找到结果
        </div>
      )}

      {!keywords.trim() && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
          输入关键词开始搜索音乐
        </div>
      )}
    </div>
  );
}
