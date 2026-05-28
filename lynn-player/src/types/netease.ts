export interface NeteaseArtist {
  id: number;
  name: string;
  picUrl?: string;
}

export interface NeteaseAlbum {
  id: number;
  name: string;
  picUrl?: string;
  publishTime?: number;
}

export interface NeteaseSong {
  id: number;
  name: string;
  artists: NeteaseArtist[];
  album: NeteaseAlbum;
  duration: number;
  fee: number;
  publishTime: number;
}

export interface NeteasePlaylist {
  id: number;
  name: string;
  coverImgUrl: string;
  creator: { nickname: string; userId: number };
  trackCount: number;
  playCount: number;
  description?: string;
  tags: string[];
}

export interface NeteaseComment {
  commentId: number;
  user: { userId: number; nickname: string; avatarUrl: string };
  content: string;
  time: number;
  likedCount: number;
  beReplied?: NeteaseComment[];
}

export interface NeteaseLyric {
  lrcLyric: string;
  tlyricLyric?: string;
}

export interface NeteaseSearchResult {
  songs: NeteaseSong[];
  songCount: number;
}

export interface NeteaseUser {
  userId: number;
  nickname: string;
  avatarUrl: string;
  backgroundUrl?: string;
  signature?: string;
}

export interface NeteaseLoginResult {
  code: number;
  cookie: string;
  token: string;
  profile: NeteaseUser;
}

export interface NeteaseSongUrl {
  id: number;
  url: string;
  size: number;
  type: string;
  level: string;
}

export type SearchType = 'song' | 'album' | 'artist' | 'playlist';

export type SongLevel = 'standard' | 'higher' | 'exhigh' | 'lossless' | 'hires';

export interface NeteaseSearchResultAlbum {
  albums: { id: number; name: string; picUrl?: string; artist: NeteaseArtist }[];
  albumCount: number;
}

export interface NeteaseSearchResultArtist {
  artists: NeteaseArtist[];
  artistCount: number;
}

export interface NeteaseSearchResultPlaylist {
  playlists: NeteasePlaylist[];
  playlistCount: number;
}

export interface NeteasePlaylistCatlist {
  sub: { name: string; category: number }[];
  categories: Record<string, string>;
}

export interface NeteaseQrKeyResult {
  unikey: string;
}

export interface NeteaseQrCreateResult {
  qrurl: string;
  qrimg?: string;
}

export interface NeteaseQrCheckResult {
  code: number;
  message: string;
  cookie?: string;
}

export interface NeteaseCommentResult {
  comments: NeteaseComment[];
  total: number;
  more: boolean;
}

export interface NeteaseRecommendSongsResult {
  data: { id: number; name: string; artists: NeteaseArtist[]; album: NeteaseAlbum; duration: number }[];
}

export interface NeteaseRecommendResourceResult {
  recommend: NeteasePlaylist[];
}
