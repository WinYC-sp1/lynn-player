import { create } from 'zustand';
import { neteaseClient } from '../services/neteaseClient';
import type {
  NeteaseUser,
  NeteasePlaylist,
  NeteaseSearchResult,
  SearchType,
} from '../types/netease';

interface NeteaseState {
  isLoggedIn: boolean;
  user: NeteaseUser | null;
  playlists: NeteasePlaylist[];
  likelist: number[];
  searchResults: NeteaseSearchResult | null;
  searchLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  qrLogin: () => Promise<void>;
  logout: () => Promise<void>;
  search: (keywords: string, type: SearchType) => Promise<void>;
  fetchUserPlaylists: () => Promise<void>;
  fetchLikelist: () => Promise<void>;
  toggleLike: (id: number) => Promise<void>;
}

export const useNeteaseStore = create<NeteaseState>((set, get) => ({
  isLoggedIn: false,
  user: null,
  playlists: [],
  likelist: [],
  searchResults: null,
  searchLoading: false,

  login: async (phone: string, password: string) => {
    const result = await neteaseClient.login(phone, password);
    if (result.code === 200 && result.profile) {
      set({
        isLoggedIn: true,
        user: result.profile,
      });
      await get().fetchUserPlaylists();
      await get().fetchLikelist();
    } else {
      throw new Error('Login failed');
    }
  },

  qrLogin: async () => {
    const keyResult = await neteaseClient.loginQrKey();
    await neteaseClient.loginQrCreate(keyResult.unikey, true);

    const pollInterval = setInterval(async () => {
      try {
        const checkResult = await neteaseClient.loginQrCheck(keyResult.unikey);
        if (checkResult.code === 800) {
          clearInterval(pollInterval);
        }
        if (checkResult.code === 803 || checkResult.code === 802) {
          clearInterval(pollInterval);
          if (checkResult.code === 803) {
            const userDetail = await neteaseClient.getUserDetail(0);
            set({
              isLoggedIn: true,
              user: userDetail.profile,
            });
            await get().fetchUserPlaylists();
            await get().fetchLikelist();
          }
        }
      } catch {
        clearInterval(pollInterval);
      }
    }, 2000);

    set({
      isLoggedIn: false,
      user: null,
    });
  },

  logout: async () => {
    try {
      await neteaseClient.logout();
    } finally {
      set({
        isLoggedIn: false,
        user: null,
        playlists: [],
        likelist: [],
      });
    }
  },

  search: async (keywords: string, type: SearchType) => {
    set({ searchLoading: true });
    try {
      const result = await neteaseClient.search(keywords, type);
      if (type === 'song') {
        set({ searchResults: result as NeteaseSearchResult });
      } else {
        set({ searchResults: null });
      }
    } finally {
      set({ searchLoading: false });
    }
  },

  fetchUserPlaylists: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const result = await neteaseClient.getUserPlaylist(user.userId);
      set({ playlists: result.playlist });
    } catch {
      set({ playlists: [] });
    }
  },

  fetchLikelist: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const result = await neteaseClient.getLikelist(user.userId);
      set({ likelist: result.ids });
    } catch {
      set({ likelist: [] });
    }
  },

  toggleLike: async (id: number) => {
    const { likelist } = get();
    const isLiked = likelist.includes(id);
    await neteaseClient.like(id, !isLiked);
    if (isLiked) {
      set({ likelist: likelist.filter((lid) => lid !== id) });
    } else {
      set({ likelist: [...likelist, id] });
    }
  },
}));
