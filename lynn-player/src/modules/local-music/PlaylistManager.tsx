import { useState } from 'react';
import { useLibraryStore } from '../../stores/libraryStore';

interface PlaylistManagerProps {
  onCreatePlaylist: (name: string, description?: string) => Promise<void>;
  onDeletePlaylist: (playlistId: number) => Promise<void>;
  onAddToPlaylist: (playlistId: number, trackId: number) => Promise<void>;
}

export default function PlaylistManager({
  onCreatePlaylist,
  onDeletePlaylist,
  onAddToPlaylist,
}: PlaylistManagerProps) {
  const {
    playlists,
    currentPlaylist,
    setCurrentPlaylist,
    selectedTracks,
  } = useLibraryStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      await onCreatePlaylist(
        newPlaylistName,
        newPlaylistDescription.trim() || undefined
      );
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setIsCreating(false);
    }
  };

  return (
    <div className="playlist-manager">
      <div className="playlist-header">
        <h3>播放列表</h3>
        <button
          className="create-playlist-btn"
          onClick={() => setIsCreating(!isCreating)}
        >
          + 新建
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreatePlaylist} className="create-form">
          <input
            type="text"
            placeholder="播放列表名称"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            className="name-input"
          />
          <input
            type="text"
            placeholder="描述（可选）"
            value={newPlaylistDescription}
            onChange={(e) => setNewPlaylistDescription(e.target.value)}
            className="desc-input"
          />
          <div className="form-buttons">
            <button type="submit" className="submit-btn">
              创建
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="cancel-btn"
            >
              取消
            </button>
          </div>
        </form>
      )}

      <div className="playlist-list">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            className={`playlist-item ${
              currentPlaylist?.id === playlist.id ? 'active' : ''
            }`}
            onClick={() => setCurrentPlaylist(playlist)}
          >
            <span className="playlist-name">{playlist.name}</span>
            <button
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDeletePlaylist(playlist.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {selectedTracks.length > 0 && (
        <div className="add-to-playlist-section">
          <p className="section-title">将选中歌曲添加到：</p>
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              className="add-btn"
              onClick={async () => {
                for (const trackId of selectedTracks) {
                  await onAddToPlaylist(playlist.id, trackId);
                }
              }}
            >
              {playlist.name}
            </button>
          ))}
        </div>
      )}

      <style>{`
        .playlist-manager {
          padding: 16px;
          background: #16213e;
          border-right: 1px solid #0f3460;
          width: 280px;
          overflow-y: auto;
        }
        .playlist-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .playlist-header h3 {
          margin: 0;
          color: #eee;
          font-size: 18px;
        }
        .create-playlist-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          background: #e94560;
          color: white;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }
        .create-playlist-btn:hover {
          background: #ff6b6b;
        }
        .create-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 16px;
          padding: 12px;
          background: #1a1a2e;
          border-radius: 8px;
        }
        .name-input,
        .desc-input {
          padding: 10px;
          border: 1px solid #0f3460;
          border-radius: 6px;
          background: #0f0f23;
          color: #eee;
          outline: none;
        }
        .name-input:focus,
        .desc-input:focus {
          border-color: #e94560;
        }
        .form-buttons {
          display: flex;
          gap: 8px;
        }
        .submit-btn,
        .cancel-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }
        .submit-btn {
          background: #e94560;
          color: white;
        }
        .submit-btn:hover {
          background: #ff6b6b;
        }
        .cancel-btn {
          background: transparent;
          color: #aaa;
          border: 1px solid #0f3460;
        }
        .cancel-btn:hover {
          color: #fff;
          border-color: #e94560;
        }
        .playlist-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .playlist-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: #1a1a2e;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .playlist-item:hover {
          background: #2a2a4e;
        }
        .playlist-item.active {
          background: #e94560;
        }
        .playlist-name {
          color: #eee;
          font-size: 14px;
        }
        .delete-btn {
          background: transparent;
          border: none;
          color: #ff6b6b;
          cursor: pointer;
          font-size: 20px;
          padding: 0 4px;
        }
        .delete-btn:hover {
          color: #ff9999;
        }
        .add-to-playlist-section {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #0f3460;
        }
        .section-title {
          color: #aaa;
          font-size: 13px;
          margin: 0 0 12px 0;
        }
        .add-btn {
          display: block;
          width: 100%;
          text-align: left;
          padding: 8px 12px;
          margin-bottom: 6px;
          background: #1a1a2e;
          border: 1px solid #0f3460;
          border-radius: 6px;
          color: #eee;
          cursor: pointer;
          transition: all 0.2s;
        }
        .add-btn:hover {
          background: #2a2a4e;
          border-color: #e94560;
        }
      `}</style>
    </div>
  );
}
