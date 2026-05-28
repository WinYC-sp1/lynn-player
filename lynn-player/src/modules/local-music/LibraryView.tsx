import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { useLibraryStore } from '../../stores/libraryStore';
import { SearchQuery, Track } from '../../types/library';
import SearchBar from './SearchBar';
import PlaylistManager from './PlaylistManager';
import { usePlayerStore } from '../../stores/playerStore';

export default function LibraryView() {
  const {
    tracks,
    playlists,
    currentPlaylist,
    playlistTracks,
    viewMode,
    isScanning,
    selectedTracks,
    loading,
    error,
    setTracks,
    setPlaylists,
    setCurrentPlaylist,
    setPlaylistTracks,
    setViewMode,
    setIsScanning,
    setSelectedTracks,
    setLoading,
    setError,
  } = useLibraryStore();

  const { setCurrentTrack, setIsPlaying } = usePlayerStore();
  const [displayTracks, setDisplayTracks] = useState<Track[]>([]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tracksRes, playlistsRes] = await Promise.all([
        invoke<Track[]>('get_all_tracks'),
        invoke<any[]>('get_all_playlists'),
      ]);
      setTracks(tracksRes);
      setPlaylists(playlistsRes);
      setDisplayTracks(tracksRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [setTracks, setPlaylists, setLoading, setError]);

  const handleScan = async () => {
    const selected = await open({
      multiple: false,
      directory: true,
    });
    if (selected) {
      setIsScanning(true);
      setError(null);
      try {
        const scannedTracks = await invoke<Track[]>('scan_library', {
          path: selected,
        });
        setTracks(scannedTracks);
        setDisplayTracks(scannedTracks);
      } catch (err) {
        setError(err instanceof Error ? err.message : '扫描失败');
      } finally {
        setIsScanning(false);
      }
    }
  };

  const handleSearch = async (query: SearchQuery) => {
    try {
      if (query.query || query.year) {
        const results = await invoke<Track[]>('search_tracks', { query });
        setDisplayTracks(results);
      } else {
        setDisplayTracks(tracks);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败');
    }
  };

  const handleCreatePlaylist = async (name: string, description?: string) => {
    try {
      const newPlaylist = await invoke<any>('create_playlist', {
        name,
        description: description || null,
      });
      setPlaylists([...playlists, newPlaylist]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    }
  };

  const handleDeletePlaylist = async (playlistId: number) => {
    try {
      await invoke('delete_playlist', { playlistId });
      setPlaylists(playlists.filter((p) => p.id !== playlistId));
      if (currentPlaylist?.id === playlistId) {
        setCurrentPlaylist(null);
        setPlaylistTracks([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleAddToPlaylist = async (playlistId: number, trackId: number) => {
    try {
      await invoke('add_track_to_playlist', { playlistId, trackId });
      if (currentPlaylist?.id === playlistId) {
        const updated = await invoke<Track[]>('get_playlist_tracks', { playlistId });
        setPlaylistTracks(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加失败');
    }
  };

  const handlePlayTrack = (track: Track) => {
    const trackInfo = {
      id: track.id.toString(),
      title: track.title,
      artist: track.artist,
      album: track.album,
      duration: track.duration,
      source: 'local' as const,
      filePath: track.file_path,
    };
    setCurrentTrack(trackInfo);
    setIsPlaying(true);
  };

  const handleToggleSelect = (trackId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedTracks.includes(trackId)) {
      setSelectedTracks(selectedTracks.filter((id) => id !== trackId));
    } else {
      setSelectedTracks([...selectedTracks, trackId]);
    }
  };

  const activeTracks = currentPlaylist ? playlistTracks : displayTracks;

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    if (currentPlaylist) {
      setDisplayTracks(playlistTracks);
    } else {
      setDisplayTracks(tracks);
    }
  }, [currentPlaylist, playlistTracks, tracks]);

  const renderListView = () => (
    <div className="track-list">
      <div className="track-header">
        <span className="col-select"></span>
        <span className="col-title">标题</span>
        <span className="col-artist">艺术家</span>
        <span className="col-album">专辑</span>
        <span className="col-duration">时长</span>
      </div>
      {activeTracks.map((track) => (
        <div
          key={track.id}
          className={`track-item ${selectedTracks.includes(track.id) ? 'selected' : ''}`}
          onClick={() => handlePlayTrack(track)}
        >
          <span className="col-select">
            <input
              type="checkbox"
              checked={selectedTracks.includes(track.id)}
              onChange={(e) => handleToggleSelect(track.id, e as any)}
              onClick={(e) => e.stopPropagation()}
            />
          </span>
          <span className="col-title">{track.title}</span>
          <span className="col-artist">{track.artist}</span>
          <span className="col-album">{track.album}</span>
          <span className="col-duration">{formatDuration(track.duration)}</span>
        </div>
      ))}
    </div>
  );

  const renderGridView = () => (
    <div className="track-grid">
      {activeTracks.map((track) => (
        <div
          key={track.id}
          className={`track-card ${selectedTracks.includes(track.id) ? 'selected' : ''}`}
          onClick={() => handlePlayTrack(track)}
        >
          <div className="track-cover">
            <span className="cover-placeholder">♪</span>
          </div>
          <div className="track-info">
            <h4 className="track-title">{track.title}</h4>
            <p className="track-artist">{track.artist}</p>
            <p className="track-album">{track.album}</p>
          </div>
          <input
            type="checkbox"
            className="card-checkbox"
            checked={selectedTracks.includes(track.id)}
            onChange={(e) => handleToggleSelect(track.id, e as any)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ))}
    </div>
  );

  const renderAlbumView = () => {
    const albums = new Map<string, Track[]>();
    activeTracks.forEach((track) => {
      const albumName = track.album || '未知专辑';
      if (!albums.has(albumName)) {
        albums.set(albumName, []);
      }
      albums.get(albumName)!.push(track);
    });

    return (
      <div className="album-grid">
        {Array.from(albums.entries()).map(([album, albumTracks]) => (
          <div key={album} className="album-card">
            <div className="album-cover">
              <span className="cover-placeholder">💿</span>
              <span className="track-count">{albumTracks.length} 首</span>
            </div>
            <h4 className="album-title">{album}</h4>
            <p className="album-artist">{albumTracks[0].artist}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="library-view">
      <SearchBar onSearch={handleSearch} />
      <div className="library-content">
        <PlaylistManager
          onCreatePlaylist={handleCreatePlaylist}
          onDeletePlaylist={handleDeletePlaylist}
          onAddToPlaylist={handleAddToPlaylist}
        />
        <div className="tracks-container">
          <div className="toolbar">
            <div className="toolbar-left">
              <button className="scan-btn" onClick={handleScan} disabled={isScanning}>
                {isScanning ? '扫描中...' : '扫描文件夹'}
              </button>
              {currentPlaylist && (
                <button
                  className="back-btn"
                  onClick={() => {
                    setCurrentPlaylist(null);
                    setPlaylistTracks([]);
                  }}
                >
                  ← 返回全部音乐
                </button>
              )}
            </div>
            <div className="view-toggle">
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                📋
              </button>
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                🔲
              </button>
              <button
                className={`view-btn ${viewMode === 'album' ? 'active' : ''}`}
                onClick={() => setViewMode('album')}
              >
                💿
              </button>
            </div>
          </div>
          <div className="tracks-content">
            {error && <div className="error-message">{error}</div>}
            {loading ? (
              <div className="loading">加载中...</div>
            ) : activeTracks.length === 0 ? (
              <div className="empty-state">
                <p>暂无音乐</p>
                <p>点击"扫描文件夹"添加本地音乐</p>
              </div>
            ) : (
              <>
                {viewMode === 'list' && renderListView()}
                {viewMode === 'grid' && renderGridView()}
                {viewMode === 'album' && renderAlbumView()}
              </>
            )}
          </div>
        </div>
      </div>
      <style>{`
        .library-view {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #0f0f23;
        }
        .library-content {
          display: flex;
          flex: 1;
          overflow: hidden;
        }
        .tracks-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #1a1a2e;
          border-bottom: 1px solid #16213e;
        }
        .toolbar-left {
          display: flex;
          gap: 12px;
        }
        .scan-btn,
        .back-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          background: #e94560;
          color: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.2s;
        }
        .scan-btn:hover:not(:disabled),
        .back-btn:hover {
          background: #ff6b6b;
        }
        .scan-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .back-btn {
          background: #0f3460;
        }
        .back-btn:hover {
          background: #1a4a7a;
        }
        .view-toggle {
          display: flex;
          gap: 4px;
        }
        .view-btn {
          padding: 8px 12px;
          border: none;
          border-radius: 6px;
          background: #16213e;
          color: #aaa;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
        }
        .view-btn:hover {
          background: #2a2a4e;
          color: #fff;
        }
        .view-btn.active {
          background: #e94560;
          color: white;
        }
        .tracks-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }
        .loading,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: #aaa;
        }
        .empty-state p {
          margin: 4px 0;
        }
        .error-message {
          padding: 12px;
          background: rgba(233, 69, 96, 0.1);
          border: 1px solid #e94560;
          border-radius: 8px;
          color: #ff6b6b;
          margin-bottom: 16px;
        }
        .track-list {
          display: flex;
          flex-direction: column;
        }
        .track-header,
        .track-item {
          display: grid;
          grid-template-columns: 40px 2fr 1.5fr 1.5fr 100px;
          gap: 12px;
          padding: 12px 16px;
          align-items: center;
        }
        .track-header {
          background: #16213e;
          color: #aaa;
          font-size: 13px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .track-item {
          background: #1a1a2e;
          border-bottom: 1px solid #16213e;
          cursor: pointer;
          transition: background 0.2s;
        }
        .track-item:hover {
          background: #2a2a4e;
        }
        .track-item.selected {
          background: rgba(233, 69, 96, 0.2);
        }
        .col-title,
        .col-artist,
        .col-album,
        .col-duration {
          color: #eee;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .col-artist,
        .col-album {
          color: #aaa;
        }
        .track-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
        }
        .track-card {
          background: #1a1a2e;
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }
        .track-card:hover {
          background: #2a2a4e;
          transform: translateY(-2px);
        }
        .track-card.selected {
          box-shadow: 0 0 0 2px #e94560;
        }
        .track-cover,
        .album-cover {
          aspect-ratio: 1;
          background: #16213e;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          position: relative;
        }
        .cover-placeholder {
          font-size: 48px;
          color: #3a3a5e;
        }
        .track-info {
          text-align: center;
        }
        .track-title,
        .album-title {
          margin: 0 0 4px 0;
          color: #eee;
          font-size: 14px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .track-artist,
        .track-album,
        .album-artist {
          margin: 2px 0;
          color: #aaa;
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .card-checkbox {
          position: absolute;
          top: 8px;
          right: 8px;
        }
        .album-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
        }
        .album-card {
          background: #1a1a2e;
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .album-card:hover {
          background: #2a2a4e;
          transform: translateY(-2px);
        }
        .track-count {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.6);
          color: #fff;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}
