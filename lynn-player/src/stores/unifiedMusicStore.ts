import { create } from 'zustand';
import { useNeteaseStore } from './neteaseStore';
import { useKugouStore } from './kugouStore';
import type { NeteaseSong } from '../types/netease';
import type { KugouSong } from '../types/kugou';

export type MusicSource = 'netease' | 'kugou' | 'local';

export interface UnifiedSong {
  id: string;
  source: MusicSource;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverUrl?: string;
  originalData: NeteaseSong | KugouSong | null;
}

interface UnifiedMusicState {
  activeSource: MusicSource;
  searchQuery: string;
  isSearching: boolean;
  neteaseResults: UnifiedSong[];
  kugouResults: UnifiedSong[];
  localResults: UnifiedSong[];
  setActiveSource: (source: MusicSource) => void;
  setSearchQuery: (query: string) => void;
  searchAll: (query: string) => Promise<void>;
  clearResults: () => void;
}

function neteaseSongToUnified(song: NeteaseSong): UnifiedSong {
  return {
    id: `netease-${song.id}`,
    source: 'netease',
    title: song.name,
    artist: song.artists.map((a) => a.name).join(' / '),
    album: song.album.name,
    duration: song.duration,
    coverUrl: song.album.picUrl,
    originalData: song,
  };
}

function kugouSongToUnified(song: KugouSong): UnifiedSong {
  return {
    id: `kugou-${song.hash}`,
    source: 'kugou',
    title: song.name,
    artist: song.singer,
    album: song.albumName,
    duration: song.duration,
    originalData: song,
  };
}

export const useUnifiedMusicStore = create<UnifiedMusicState>((set) => ({
  activeSource: 'netease',
  searchQuery: '',
  isSearching: false,
  neteaseResults: [],
  kugouResults: [],
  localResults: [],

  setActiveSource: (source) => set({ activeSource: source }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  searchAll: async (query: string) => {
    set({ searchQuery: query, isSearching: true });

    try {
      const neteaseStore = useNeteaseStore.getState();
      const kugouStore = useKugouStore.getState();

      await Promise.all([
        (async () => {
          if (query.trim()) {
            await neteaseStore.search(query, 'song');
            const results = useNeteaseStore.getState().searchResults?.songs || [];
            set({ neteaseResults: results.map(neteaseSongToUnified) });
          }
        })(),
        (async () => {
          if (query.trim()) {
            await kugouStore.search(query, 'song');
            const results = useKugouStore.getState().searchResults?.songs || [];
            set({ kugouResults: results.map(kugouSongToUnified) });
          }
        })(),
      ]);
    } finally {
      set({ isSearching: false });
    }
  },

  clearResults: () => set({
    searchQuery: '',
    neteaseResults: [],
    kugouResults: [],
    localResults: [],
  }),
}));
