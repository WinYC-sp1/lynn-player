export interface KugouSong {
  id: number;
  hash: string;
  name: string;
  singer: string;
  singerId: number;
  albumName: string;
  albumId: number;
  duration: number;
  fee: number;
  publishTime?: string;
}

export interface KugouAlbum {
  id: number;
  name: string;
  picUrl?: string;
  publishTime?: string;
  singer?: string;
}

export interface KugouArtist {
  id: number;
  name: string;
  picUrl?: string;
  songCount?: number;
  albumCount?: number;
}

export interface KugouPlaylist {
  id: number;
  name: string;
  coverImgUrl: string;
  creator?: string;
  trackCount: number;
  playCount: number;
  description?: string;
  tags: string[];
}

export interface KugouSearchResult {
  songs: KugouSong[];
  total: number;
}

export interface KugouRank {
  id: number;
  name: string;
  coverImgUrl: string;
  description?: string;
}

export interface KugouSongUrl {
  url: string;
  size: number;
  type: string;
  bitrate: number;
}

export interface KugouLyric {
  lrcLyric: string;
  tlyricLyric?: string;
}

export interface KugouSearchParams {
  keywords: string;
  type: 'song' | 'album' | 'artist';
  limit: number;
  offset: number;
}

export interface KugouPlaylistCatlist {
  categories: Record<string, string>;
  sub: Array<{
    name: string;
    category: number;
    hot: boolean;
  }>;
}

export interface KugouComment {
  commentId: string;
  content: string;
  nickname: string;
  avatarUrl: string;
  time: number;
  likedCount: number;
}

export interface KugouCommentResult {
  comments: KugouComment[];
  total: number;
}

export interface KugouArtistSongsResult {
  songs: KugouSong[];
  total: number;
}

export interface KugouRankDetail {
  info: KugouRank;
  songs: KugouSong[];
}

export interface KugouRecommendPlaylistResult {
  playlists: KugouPlaylist[];
}

export interface KugouNewSongsResult {
  songs: KugouSong[];
}

export interface KugouPlaylistDetail {
  playlist: KugouPlaylist;
  songs: KugouSong[];
}

export interface KugouTopPlaylistResult {
  playlists: KugouPlaylist[];
  total: number;
  more: boolean;
}

export interface KugouArtistDetail {
  artist: KugouArtist;
  hotSongs: KugouSong[];
}
