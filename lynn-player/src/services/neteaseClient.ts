import type {
  NeteaseSong,
  NeteaseSongUrl,
  NeteaseLyric,
  NeteasePlaylist,
  NeteasePlaylistCatlist,
  NeteaseLoginResult,
  NeteaseUser,
  NeteaseSearchResult,
  NeteaseSearchResultAlbum,
  NeteaseSearchResultArtist,
  NeteaseSearchResultPlaylist,
  NeteaseQrKeyResult,
  NeteaseQrCreateResult,
  NeteaseQrCheckResult,
  NeteaseCommentResult,
  NeteaseRecommendSongsResult,
  NeteaseRecommendResourceResult,
  SearchType,
  SongLevel,
} from '../types/netease';

const SEARCH_TYPE_MAP: Record<SearchType, number> = {
  song: 1,
  album: 10,
  artist: 100,
  playlist: 1000,
};

class NeteaseClient {
  private baseUrl: string;
  private maxRetries = 3;
  private retryDelay = 1000;
  private controllers: Map<string, AbortController> = new Map();

  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  private createController(key: string): AbortController {
    const existing = this.controllers.get(key);
    if (existing) {
      existing.abort();
    }
    const controller = new AbortController();
    this.controllers.set(key, controller);
    return controller;
  }

  cancelRequest(key: string) {
    const controller = this.controllers.get(key);
    if (controller) {
      controller.abort();
      this.controllers.delete(key);
    }
  }

  cancelAllRequests() {
    this.controllers.forEach((controller) => controller.abort());
    this.controllers.clear();
  }

  private async request<T>(
    endpoint: string,
    params: Record<string, string | number | boolean> = {},
    requestKey?: string,
  ): Promise<T> {
    const controller = requestKey
      ? this.createController(requestKey)
      : new AbortController();

    const url = new URL(endpoint, this.baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(url.toString(), {
          signal: controller.signal,
          credentials: 'include',
        });

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : this.retryDelay * (attempt + 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (requestKey) {
          this.controllers.delete(requestKey);
        }

        return data as T;
      } catch (error) {
        lastError = error as Error;
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw error;
        }
        if (attempt < this.maxRetries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.retryDelay * (attempt + 1)),
          );
        }
      }
    }

    throw lastError ?? new Error('Request failed');
  }

  async search(
    keywords: string,
    type: SearchType = 'song',
    limit = 30,
    offset = 0,
  ): Promise<NeteaseSearchResult | NeteaseSearchResultAlbum | NeteaseSearchResultArtist | NeteaseSearchResultPlaylist> {
    return this.request('/cloudsearch', {
      keywords,
      type: SEARCH_TYPE_MAP[type],
      limit,
      offset,
    }, `search-${keywords}-${type}`);
  }

  async getSongDetail(ids: number[]): Promise<{ songs: NeteaseSong[] }> {
    return this.request('/song/detail', {
      ids: ids.join(','),
    });
  }

  async getSongUrl(id: number, level: SongLevel = 'exhigh'): Promise<{ data: NeteaseSongUrl[] }> {
    return this.request('/song/url/v1', {
      id,
      level,
    });
  }

  async getLyric(id: number): Promise<NeteaseLyric> {
    const raw = await this.request<{
      lrc?: { lyric: string };
      tlyric?: { lyric: string };
    }>('/lyric', { id });
    return {
      lrcLyric: raw.lrc?.lyric ?? '',
      tlyricLyric: raw.tlyric?.lyric,
    };
  }

  async getPlaylistDetail(id: number): Promise<{ playlist: NeteasePlaylist & { tracks: NeteaseSong[] } }> {
    return this.request('/playlist/detail', { id });
  }

  async getPlaylistCatlist(): Promise<NeteasePlaylistCatlist> {
    return this.request('/playlist/catlist');
  }

  async getTopPlaylist(
    cat = '全部',
    limit = 30,
    offset = 0,
  ): Promise<{ playlists: NeteasePlaylist[]; total: number }> {
    return this.request('/top/playlist', { cat, limit, offset });
  }

  async createPlaylist(
    name: string,
    privacy: string = '0',
  ): Promise<{ id: number; name: string }> {
    return this.request('/playlist/create', { name, privacy });
  }

  async addSongToPlaylist(pid: number, tracks: number[]): Promise<void> {
    await this.request('/playlist/tracks', {
      op: 'add',
      pid,
      tracks: tracks.join(','),
    });
  }

  async removeSongFromPlaylist(pid: number, tracks: number[]): Promise<void> {
    await this.request('/playlist/tracks', {
      op: 'del',
      pid,
      tracks: tracks.join(','),
    });
  }

  async login(phone: string, password: string): Promise<NeteaseLoginResult> {
    return this.request('/login/cellphone', { phone, password });
  }

  async loginQrKey(): Promise<NeteaseQrKeyResult> {
    const result = await this.request<{ unikey: string }>('/login/qr/key', {
      timestamp: Date.now(),
    });
    return { unikey: result.unikey };
  }

  async loginQrCreate(key: string, qrimg = true): Promise<NeteaseQrCreateResult> {
    return this.request('/login/qr/create', { key, qrimg, timestamp: Date.now() });
  }

  async loginQrCheck(key: string): Promise<NeteaseQrCheckResult> {
    return this.request('/login/qr/check', { key, timestamp: Date.now() });
  }

  async logout(): Promise<void> {
    await this.request('/logout');
  }

  async getUserDetail(uid: number): Promise<{ profile: NeteaseUser }> {
    return this.request('/user/detail', { uid });
  }

  async getUserPlaylist(uid: number): Promise<{ playlist: NeteasePlaylist[] }> {
    return this.request('/user/playlist', { uid });
  }

  async like(id: number, like = true): Promise<void> {
    await this.request('/like', { id, like, timestamp: Date.now() });
  }

  async getLikelist(uid: number): Promise<{ ids: number[] }> {
    return this.request('/likelist', { uid, timestamp: Date.now() });
  }

  async getCommentMusic(
    id: number,
    limit = 30,
    offset = 0,
  ): Promise<NeteaseCommentResult> {
    return this.request('/comment/music', { id, limit, offset });
  }

  async commentMusic(id: number, msg: string): Promise<void> {
    await this.request('/comment', { t: 1, type: 0, id, content: msg });
  }

  async getRecommendSongs(): Promise<NeteaseRecommendSongsResult> {
    return this.request('/recommend/songs');
  }

  async getRecommendResource(): Promise<NeteaseRecommendResourceResult> {
    return this.request('/recommend/resource');
  }

  async getDownloadUrl(id: number, level: string): Promise<{ data: NeteaseSongUrl[] }> {
    return this.request('/song/download/url', { id, level });
  }
}

export const neteaseClient = new NeteaseClient();
export { NeteaseClient };
