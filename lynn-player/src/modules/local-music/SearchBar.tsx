import { useState } from 'react';
import { SearchQuery } from '../../types/library';

interface SearchBarProps {
  onSearch: (query: SearchQuery) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [searchTitle, setSearchTitle] = useState(true);
  const [searchArtist, setSearchArtist] = useState(true);
  const [searchAlbum, setSearchAlbum] = useState(true);
  const [searchGenre, setSearchGenre] = useState(false);
  const [yearFilter, setYearFilter] = useState<string>('');

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSearch({
      query,
      title: searchTitle,
      artist: searchArtist,
      album: searchAlbum,
      genre: searchGenre,
      year: yearFilter ? parseInt(yearFilter) : null,
    });
  };

  const handleClear = () => {
    setQuery('');
    setSearchTitle(true);
    setSearchArtist(true);
    setSearchAlbum(true);
    setSearchGenre(false);
    setYearFilter('');
    onSearch({
      query: '',
      title: true,
      artist: true,
      album: true,
      genre: false,
      year: null,
    });
  };

  return (
    <div className="search-bar">
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="搜索音乐..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        <div className="search-options">
          <label className="search-option">
            <input
              type="checkbox"
              checked={searchTitle}
              onChange={(e) => setSearchTitle(e.target.checked)}
            />
            标题
          </label>
          <label className="search-option">
            <input
              type="checkbox"
              checked={searchArtist}
              onChange={(e) => setSearchArtist(e.target.checked)}
            />
            艺术家
          </label>
          <label className="search-option">
            <input
              type="checkbox"
              checked={searchAlbum}
              onChange={(e) => setSearchAlbum(e.target.checked)}
            />
            专辑
          </label>
          <label className="search-option">
            <input
              type="checkbox"
              checked={searchGenre}
              onChange={(e) => setSearchGenre(e.target.checked)}
            />
            流派
          </label>
          <input
            type="number"
            placeholder="年份"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="year-input"
          />
        </div>
        <div className="search-buttons">
          <button type="submit" className="search-button">
            搜索
          </button>
          <button type="button" onClick={handleClear} className="clear-button">
            清除
          </button>
        </div>
      </form>
      <style>{`
        .search-bar {
          padding: 16px;
          background: #1a1a2e;
          border-bottom: 1px solid #16213e;
        }
        .search-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 800px;
          margin: 0 auto;
        }
        .search-input {
          padding: 12px 16px;
          border: 1px solid #0f3460;
          border-radius: 8px;
          background: #0f0f23;
          color: #eee;
          font-size: 16px;
          outline: none;
        }
        .search-input:focus {
          border-color: #e94560;
        }
        .search-options {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
        }
        .search-option {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #aaa;
          cursor: pointer;
          font-size: 14px;
        }
        .search-option input[type="checkbox"] {
          accent-color: #e94560;
        }
        .year-input {
          padding: 8px 12px;
          border: 1px solid #0f3460;
          border-radius: 6px;
          background: #0f0f23;
          color: #eee;
          width: 100px;
          outline: none;
        }
        .year-input:focus {
          border-color: #e94560;
        }
        .search-buttons {
          display: flex;
          gap: 12px;
        }
        .search-button,
        .clear-button {
          padding: 10px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .search-button {
          background: #e94560;
          color: white;
        }
        .search-button:hover {
          background: #ff6b6b;
        }
        .clear-button {
          background: transparent;
          color: #aaa;
          border: 1px solid #0f3460;
        }
        .clear-button:hover {
          color: #fff;
          border-color: #e94560;
        }
      `}</style>
    </div>
  );
}
