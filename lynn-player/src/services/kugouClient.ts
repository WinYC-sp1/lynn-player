import type {
  KugouSong,
  KugouSearchResult,
  KugouSongUrl,
  KugouPlaylistDetail,
  KugouPlaylistCatlist,
  KugouTopPlaylistResult,
  KugouRecommendPlaylistResult,
  KugouNewSongsResult,
  KugouRank,
  KugouRankDetail,
  KugouArtistDetail,
  KugouArtistSongsResult,
  KugouLyric,
  KugouCommentResult,
} from '../types/kugou';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const RATE_LIMIT_DELAY = 2000;

interface KugouApiResponse<T> {
  code: number;
  data: T;
  message?: string;
}

class KugouApiError extends Error {
  code: number;
  constructor(message: string, code: number) {
    super(message);
    this.name = 'KugouApiError';
    this.code = code;
  }
}

const pendingControllers = new Map<string, AbortController>();

function createAbortKey(path: string): string {
  return path;
}

function cancelPreviousRequest(key: string): void {
  const controller = pendingControllers.get(key);
  if (controller) {
    controller.abort();
    pendingControllers.delete(key);
  }
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request<T>(
  baseUrl: string,
  path: string,
  params: Record<string, string | number | boolean> = {},
  retryCount = 0,
): Promise<T> {
  const key = createAbortKey(path);
  cancelPreviousRequest(key);

  const controller = new AbortController();
  pendingControllers.set(key, controller);

  const url = new URL(path, baseUrl);
  Object.entries(params).forEach(([k, v]) => {
    url.searchParams.set(k, String(v));
  });

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (response.status === 429) {
      if (retryCount < MAX_RETRIES) {
        await delay(RATE_LIMIT_DELAY * (retryCount + 1));
        return request<T>(baseUrl, path, params, retryCount + 1);
      }
      throw new KugouApiError('Rate limited', 429);
    }

    if (!response.ok) {
      if (retryCount < MAX_RETRIES) {
        await delay(RETRY_DELAY * (retryCount + 1));
        return request<T>(baseUrl, path, params, retryCount + 1);
      }
      throw new KugouApiError(`HTTP ${response.status}`, response.status);
    }

    const json: KugouApiResponse<T> = await response.json();

    if (json.code !== 200 && json.code !== 0) {
      throw new KugouApiError(json.message || 'API error', json.code);
    }

    return json.data;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new KugouApiError('Request cancelled', -1);
    }
    if (error instanceof KugouApiError) {
      throw error;
    }
    if (retryCount < MAX_RETRIES) {
      await delay(RETRY_DELAY * (retryCount + 1));
      return request<T>(baseUrl, path, params, retryCount + 1);
    }
    throw new KugouApiError(
      error instanceof Error ? error.message : 'Unknown error',
      -1,
    );
  } finally {
    if (pendingControllers.get(key) === controller) {
      pendingControllers.delete(key);
    }
  }
}

export class KugouClient {
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  async search(
    keywords: string,
    type: 'song' | 'album' | 'artist' = 'song',
    limit = 30,
    offset = 0,
  ): Promise<KugouSearchResult> {
    return request<KugouSearchResult>(this.baseUrl, '/search', {
      keywords,
      type,
      limit,
      offset,
    });
  }

  async getSongDetail(hash: string, albumId: string): Promise<KugouSong> {
    return request<KugouSong>(this.baseUrl, '/song/detail', { hash, albumId });
  }

  async getSongUrl(hash: string): Promise<KugouSongUrl> {
    return request<KugouSongUrl>(this.baseUrl, '/song/url', { hash });
  }

  async getPlaylistDetail(id: string): Promise<KugouPlaylistDetail> {
    return request<KugouPlaylistDetail>(this.baseUrl, '/playlist/detail', { id });
  }

  async getPlaylistCatlist(): Promise<KugouPlaylistCatlist> {
    return request<KugouPlaylistCatlist>(this.baseUrl, '/playlist/catlist');
  }

  async getTopPlaylist(
    cat = '全部',
    limit = 30,
    offset = 0,
  ): Promise<KugouTopPlaylistResult> {
    return request<KugouTopPlaylistResult>(this.baseUrl, '/top/playlist', {
      cat,
      limit,
      offset,
    });
  }

  async getRecommendSongs(): Promise<KugouSong[]> {
    return request<KugouSong[]>(this.baseUrl, '/recommend/songs');
  }

  async getRecommendPlaylist(): Promise<KugouRecommendPlaylistResult> {
    return request<KugouRecommendPlaylistResult>(this.baseUrl, '/recommend/playlist');
  }

  async getNewSongs(): Promise<KugouNewSongsResult> {
    return request<KugouNewSongsResult>(this.baseUrl, '/new/songs');
  }

  async getRankList(): Promise<KugouRank[]> {
    return request<KugouRank[]>(this.baseUrl, '/rank/list');
  }

  async getRankDetail(id: number): Promise<KugouRankDetail> {
    return request<KugouRankDetail>(this.baseUrl, '/rank/detail', { id });
  }

  async getArtistDetail(id: number): Promise<KugouArtistDetail> {
    return request<KugouArtistDetail>(this.baseUrl, '/artist/detail', { id });
  }

  async getArtistSongs(
    id: number,
    limit = 30,
    offset = 0,
  ): Promise<KugouArtistSongsResult> {
    return request<KugouArtistSongsResult>(this.baseUrl, '/artist/songs', {
      id,
      limit,
      offset,
    });
  }

  async getLyric(hash: string, id: number): Promise<KugouLyric> {
    return request<KugouLyric>(this.baseUrl, '/lyric', { hash, id });
  }

  async getComment(
    id: string,
    type = 'song',
    limit = 30,
    offset = 0,
  ): Promise<KugouCommentResult> {
    return request<KugouCommentResult>(this.baseUrl, '/comment', {
      id,
      type,
      limit,
      offset,
    });
  }
}

export const kugouClient = new KugouClient();

export { KugouApiError };
