import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NeteaseClient } from '../services/neteaseClient';

describe('Netease API Client', () => {
  let client: NeteaseClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    client = new NeteaseClient('http://test.local');
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should create client with custom base url', () => {
    const customClient = new NeteaseClient('http://custom.local');
    expect(customClient).toBeDefined();
  });

  it('should set base url', () => {
    client.setBaseUrl('http://new.local');
    expect(client).toBeDefined();
  });

  it('should cancel request', () => {
    expect(() => client.cancelRequest('test-key')).not.toThrow();
  });

  it('should cancel all requests', () => {
    expect(() => client.cancelAllRequests()).not.toThrow();
  });

  describe('search', () => {
    it('should search songs', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ songs: [], songCount: 0 }),
      });
      const result = await client.search('test', 'song');
      expect(result).toBeDefined();
      expect(fetchMock).toHaveBeenCalled();
    });

    it('should search albums', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ albums: [], albumCount: 0 }),
      });
      const result = await client.search('test', 'album');
      expect(result).toBeDefined();
    });
  });

  describe('song details', () => {
    it('should get song detail', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ songs: [] }),
      });
      const result = await client.getSongDetail([123]);
      expect(result).toBeDefined();
    });

    it('should get song url', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });
      const result = await client.getSongUrl(123);
      expect(result).toBeDefined();
    });

    it('should get lyric', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ lrc: { lyric: 'test lyric' } }),
      });
      const result = await client.getLyric(123);
      expect(result.lrcLyric).toBe('test lyric');
    });
  });

  describe('playlist', () => {
    it('should get playlist detail', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ playlist: { tracks: [] } }),
      });
      const result = await client.getPlaylistDetail(123);
      expect(result).toBeDefined();
    });

    it('should get playlist catlist', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ sub: [], categories: {} }),
      });
      const result = await client.getPlaylistCatlist();
      expect(result).toBeDefined();
    });

    it('should get top playlist', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ playlists: [], total: 0 }),
      });
      const result = await client.getTopPlaylist();
      expect(result).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should throw on HTTP error', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });
      await expect(client.search('test')).rejects.toThrow();
    });

    it('should handle 429 rate limiting', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: {
          get: () => '0',
        },
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ songs: [], songCount: 0 }),
      });
      
      const result = await client.search('test');
      expect(result).toBeDefined();
    });
  });
});
