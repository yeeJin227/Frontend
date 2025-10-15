
export type ApiResponse<T> = {
  resultCode: string;
  msg: string;
  data: T;
};

export type ProductArtistInfo = {
  artistId?: number; // 공개 프로필 API 호출용
  artistName: string;
  followerCount: number;
  approvedDate: string;        // "YYYY.MM.DD"
  profileImageUrl: string | null;
  artistPageUrl: string;       // http://localhost:3000/forest/1
  description: string | null;
};
