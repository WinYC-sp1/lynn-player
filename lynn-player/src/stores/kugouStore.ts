import { create } from 'zustand';
import { kugouClient } from '../services/kugouClient';
import type {
  KugouSong,
  KugouSearchResult,
  KugouPlaylist,
  KugouRank,
} from '../types/kugou';
import type { TrackInfo } from '../types/player';
import { usePlayerStore } from './playerStore';

function kugouSongToTrack(song: KugouSong): TrackInfo {
  return {
    id: `kugou_${song.hash}`,
    title: song.name,
    artist: song.singer,
    album: song.albumName,
    duration: song.duration,
    source: 'kugou',
  };
}

interface KugouState {
  searchResults: KugouSearchResult | null;
  searchLoading: boolean;
  recommendSongs: KugouSong[];
  recommendPlaylists: KugouPlaylist[];
  rankList: KugouRank[];
  search: (keywords: string, type: string) => Promise<void>;
  fetchRecommendSongs: () => Promise<void>;
  fetchRecommendPlaylists: () => Promise<void>;
  fetchRankList: () => Promise<void>;
  playSong: (song: KugouSong) => Promise<void>;
  playSongs: (songs: KugouSong[], index?: number) => Promise<void>;
}

export const useKugouStore = create<KugouState>((set) => ({
  searchResults: null,
  searchLoading: false,
  recommendSongs: [],
  recommendPlaylists: [],
  rankList: [],

  search: async (keywords: string, type: string) => {
    set({ searchLoading: true });
    try {
      const results = await kugouClient.search(
        keywords,
        type as 'song' | 'album' | 'artist',
      );
      set({ searchResults: results });
    } catch {
      set({ searchResults: null });
    } finally {
      set({ searchLoading: false });
    }
  },

  fetchRecommendSongs: async () => {
    try {
      const songs = await kugouClient.getRecommendSongs();
      set({ recommendSongs: songs });
    } catch {
      set({ recommendSongs: [] });
    }
  },

  fetchRecommendPlaylists: async () => {
    try {
      const result = await kugouClient.getRecommendPlaylist();
      set({ recommendPlaylists: result.playlists });
    } catch {
      set({ recommendPlaylists: [] });
    }
  },

  fetchRankList: async () => {
    try {
      const list = await kugouClient.getRankList();
      set({ rankList: list });
    } catch {
      set({ rankList: [] });
    }
  },

  playSong: async (song: KugouSong) => {
    try {
      const urlResult = await kugouClient.getSongUrl(song.hash);
      if (!urlResult.url) return;
      const track = kugouSongToTrack(song);
      const playerStore = usePlayerStore.getState();
      const exists = playerStore.playlist.some((t) => t.id === track.id);
      if (!exists) {
        playerStore.setCurrentTrack(track);
        usePlayerStore.setState({
          playlist: [...playerStore.playlist, track],
          isPlaying: true,
        });
      } else {
        playerStore.setCurrentTrack(track);
        playerStore.setIsPlaying(true);
      }
    } catch {
      // ignore
    }
  },

  playSongs: async (songs: KugouSong[], index = 0) => {
    if (songs.length === 0) return;
    const tracks = songs.map(kugouSongToTrack);
    usePlayerStore.setState({
      playlist: tracks,
      currentTrack: tracks[index],
      isPlaying: true,
      currentTime: 0,
      duration: tracks[index].duration,
    });
  },
}));

export { kugouSongToTrack };
