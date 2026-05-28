import { describe, it, expect, beforeEach } from 'vitest';
import { useLibraryStore } from '../stores/libraryStore';
import type { Track, Playlist } from '../types/library';

describe('Library Store', () => {
  beforeEach(() => {
    useLibraryStore.setState({
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
    });
  });

  const testTracks: Track[] = [
    {
      id: 1,
      title: 'Test Song 1',
      artist: 'Artist 1',
      album: 'Album 1',
      genre: 'Rock',
      year: 2020,
      duration: 180,
      track_number: 1,
      file_path: '/path/to/song1.mp3',
      file_size: 5000000,
      last_modified: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      title: 'Test Song 2',
      artist: 'Artist 2',
      album: 'Album 2',
      genre: 'Pop',
      year: 2021,
      duration: 240,
      track_number: 1,
      file_path: '/path/to/song2.mp3',
      file_size: 6000000,
      last_modified: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const testPlaylists: Playlist[] = [
    {
      id: 1,
      name: 'My Playlist',
      description: 'Test playlist',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  it('should initialize with default values', () => {
    const state = useLibraryStore.getState();
    expect(state.tracks).toEqual([]);
    expect(state.playlists).toEqual([]);
    expect(state.viewMode).toBe('list');
    expect(state.loading).toBe(false);
  });

  it('should set tracks', () => {
    const { setTracks } = useLibraryStore.getState();
    setTracks(testTracks);
    expect(useLibraryStore.getState().tracks).toEqual(testTracks);
  });

  it('should set playlists', () => {
    const { setPlaylists } = useLibraryStore.getState();
    setPlaylists(testPlaylists);
    expect(useLibraryStore.getState().playlists).toEqual(testPlaylists);
  });

  it('should set current playlist', () => {
    const { setCurrentPlaylist } = useLibraryStore.getState();
    setCurrentPlaylist(testPlaylists[0]);
    expect(useLibraryStore.getState().currentPlaylist).toEqual(testPlaylists[0]);
    setCurrentPlaylist(null);
    expect(useLibraryStore.getState().currentPlaylist).toBeNull();
  });

  it('should set playlist tracks', () => {
    const { setPlaylistTracks } = useLibraryStore.getState();
    setPlaylistTracks(testTracks);
    expect(useLibraryStore.getState().playlistTracks).toEqual(testTracks);
  });

  it('should set genres', () => {
    const { setGenres } = useLibraryStore.getState();
    const genres = ['Rock', 'Pop', 'Jazz'];
    setGenres(genres);
    expect(useLibraryStore.getState().genres).toEqual(genres);
  });

  it('should set artists', () => {
    const { setArtists } = useLibraryStore.getState();
    const artists = ['Artist 1', 'Artist 2'];
    setArtists(artists);
    expect(useLibraryStore.getState().artists).toEqual(artists);
  });

  it('should set albums', () => {
    const { setAlbums } = useLibraryStore.getState();
    const albums = ['Album 1', 'Album 2'];
    setAlbums(albums);
    expect(useLibraryStore.getState().albums).toEqual(albums);
  });

  it('should set years', () => {
    const { setYears } = useLibraryStore.getState();
    const years = [2020, 2021, 2022];
    setYears(years);
    expect(useLibraryStore.getState().years).toEqual(years);
  });

  it('should set view mode', () => {
    const { setViewMode } = useLibraryStore.getState();
    setViewMode('grid');
    expect(useLibraryStore.getState().viewMode).toBe('grid');
    setViewMode('album');
    expect(useLibraryStore.getState().viewMode).toBe('album');
    setViewMode('list');
    expect(useLibraryStore.getState().viewMode).toBe('list');
  });

  it('should set scanning state', () => {
    const { setIsScanning } = useLibraryStore.getState();
    setIsScanning(true);
    expect(useLibraryStore.getState().isScanning).toBe(true);
    setIsScanning(false);
    expect(useLibraryStore.getState().isScanning).toBe(false);
  });

  it('should set selected tracks', () => {
    const { setSelectedTracks } = useLibraryStore.getState();
    setSelectedTracks([1, 2]);
    expect(useLibraryStore.getState().selectedTracks).toEqual([1, 2]);
  });

  it('should set loading state', () => {
    const { setLoading } = useLibraryStore.getState();
    setLoading(true);
    expect(useLibraryStore.getState().loading).toBe(true);
    setLoading(false);
    expect(useLibraryStore.getState().loading).toBe(false);
  });

  it('should set error', () => {
    const { setError } = useLibraryStore.getState();
    const errorMsg = 'Test error';
    setError(errorMsg);
    expect(useLibraryStore.getState().error).toBe(errorMsg);
    setError(null);
    expect(useLibraryStore.getState().error).toBeNull();
  });
});
