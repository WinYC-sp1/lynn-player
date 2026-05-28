import { create } from 'zustand';
import { LibraryState, Track, Playlist, ViewMode } from '../types/library';

export const useLibraryStore = create<LibraryState>((set) => ({
  tracks: [],
  playlists: [],
  currentPlaylist: null,
  playlistTracks: [],
  genres: [],
  artists: [],
  albums: [],
  years: [],
  viewMode: 'list',
  isScanning: false,
  selectedTracks: [],
  loading: false,
  error: null,

  setTracks: (tracks: Track[]) => set({ tracks }),
  setPlaylists: (playlists: Playlist[]) => set({ playlists }),
  setCurrentPlaylist: (playlist: Playlist | null) => set({ currentPlaylist: playlist }),
  setPlaylistTracks: (tracks: Track[]) => set({ playlistTracks: tracks }),
  setGenres: (genres: string[]) => set({ genres }),
  setArtists: (artists: string[]) => set({ artists }),
  setAlbums: (albums: string[]) => set({ albums }),
  setYears: (years: number[]) => set({ years }),
  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),
  setIsScanning: (scanning: boolean) => set({ isScanning: scanning }),
  setSelectedTracks: (trackIds: number[]) => set({ selectedTracks: trackIds }),
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
}));
