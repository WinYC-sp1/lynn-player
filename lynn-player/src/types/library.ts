export interface Track {
  id: number;
  title: string;
  artist: string;
  album: string;
  genre: string;
  year: number | null;
  duration: number;
  track_number: number | null;
  file_path: string;
  file_size: number;
  last_modified: number;
  created_at: string;
  updated_at: string;
}

export interface Playlist {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface SearchQuery {
  query: string;
  title: boolean;
  artist: boolean;
  album: boolean;
  genre: boolean;
  year: number | null;
}

export type ViewMode = 'list' | 'grid' | 'album';

export interface LibraryState {
  tracks: Track[];
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  playlistTracks: Track[];
  genres: string[];
  artists: string[];
  albums: string[];
  years: number[];
  viewMode: ViewMode;
  isScanning: boolean;
  selectedTracks: number[];
  loading: boolean;
  error: string | null;

  setTracks: (tracks: Track[]) => void;
  setPlaylists: (playlists: Playlist[]) => void;
  setCurrentPlaylist: (playlist: Playlist | null) => void;
  setPlaylistTracks: (tracks: Track[]) => void;
  setGenres: (genres: string[]) => void;
  setArtists: (artists: string[]) => void;
  setAlbums: (albums: string[]) => void;
  setYears: (years: number[]) => void;
  setViewMode: (mode: ViewMode) => void;
  setIsScanning: (scanning: boolean) => void;
  setSelectedTracks: (trackIds: number[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}
