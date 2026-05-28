import { useState, useEffect, useCallback, useRef } from 'react';
import { useKugouStore } from '../../stores/kugouStore';

const DEBOUNCE_MS = 300;

const searchTabs = [
  { key: 'song', label: 'Songs' },
  { key: 'album', label: 'Albums' },
  { key: 'artist', label: 'Artists' },
] as const;

type SearchType = (typeof searchTabs)[number]['key'];

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default function KugouSearch() {
  const [keywords, setKeywords] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('song');
  const { searchResults, searchLoading, search, playSong } = useKugouStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSearch = useCallback(
    (kw: string, type: SearchType) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (!kw.trim()) return;
      timerRef.current = setTimeout(() => {
        search(kw, type);
      }, DEBOUNCE_MS);
    },
    [search],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setKeywords(val);
    debouncedSearch(val, searchType);
  };

  const handleTabChange = (type: SearchType) => {
    setSearchType(type);
    if (keywords.trim()) {
      search(keywords, type);
    }
  };

  const handlePlay = (song: Parameters<typeof playSong>[0]) => {
    playSong(song);
  };

  const songs = searchResults?.songs ?? [];

  return (
    <div>
      <div style={{ marginBottom: '12px' }}>
        <input
          type="text"
          value={keywords}
          onChange={handleInputChange}
          placeholder="Search Kugou Music..."
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            fontSize: '14px',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {searchTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key as SearchType)}
            style={{
              padding: '4px 14px',
              borderRadius: '14px',
              fontSize: '12px',
              backgroundColor:
                searchType === tab.key ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: searchType === tab.key ? '#ffffff' : 'var(--text-secondary)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {searchLoading && (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
          Loading...
        </div>
      )}

      {!searchLoading && keywords.trim() && songs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
          No results found
        </div>
      )}

      {!searchLoading && songs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {songs.map((song) => (
            <div
              key={song.hash}
              onClick={() => handlePlay(song)}
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

      {!keywords.trim() && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
          Search for songs, albums, or artists on Kugou Music
        </div>
      )}
    </div>
  );
}
