//======= 펀딩 불러오기 관련 타입 ==========

// 요청 파라미터 타입
export type FundingStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'OPEN'
  | 'CLOSED'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELED';

export type SortBy = 'popular' | 'recent' | 'deadline' | 'highAmount';

export interface FundingListProps {
  status?: FundingStatus[];
  sortBy?: SortBy;
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
  categoryIds?: number[];
  page?: number;
  size?: number;
}

// 응답 타입
export interface FundingItem {
  id: number;
  title: string;
  imageUrl: string;
  categoryName: string;
  authorName: string;
  targetAmount: number;
  currentAmount: number;
  progress: number;
  remainingDays: number;
}

export interface Sort {
  empty: boolean;
  unsorted: boolean;
  sorted: boolean;
}

export interface Pageable {
  offset: number;
  sort: Sort;
  paged: boolean;
  pageNumber: number;
  pageSize: number;
  unpaged: boolean;
}

export interface FundingListData {
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
  size: number;
  content: FundingItem[];
  number: number;
  sort: Sort;
  pageable: Pageable;
  numberOfElements: number;
  empty: boolean;
}

export interface ApiResponse<T> {
  resultCode: string;
  msg: string;
  data: T;
}

export type FundingListResponse = ApiResponse<FundingListData>;

// ===== 펀딩 생성 관련 타입 =====

// 펀딩 옵션 (요청용)
export interface CreateFundingOptionRequest {
  name: string;
  price: number;
  stock: number;
  sortOrder: number;
}

// 펀딩 옵션 (응답용)
export interface FundingOptionResponse {
  id: number;
  name: string;
  price: number;
  stock: number;
  sortOrder: number;
}

export interface UploadedImage {
  url: string;
  type: 'MAIN' | 'DETAIL';
  s3Key: string;
  originalFileName: string;
}

// 펀딩 생성 요청
export interface CreateFundingRequest {
  title: string;
  description: string;
  categoryId: number;
  imageUrl: string;
  targetAmount: number;
  price: number;
  stock?: number;
  startDate: string; // ISO 8601 형식
  endDate: string; // ISO 8601 형식
  images: UploadedImage[];
}

// 펀딩 생성 응답 데이터
export interface CreateFundingData {
  fundingId: number;
  title: string;
  description: string;
  categoryName: string;
  imageUrl: string;
  targetAmount: number;
  startDate: string;
  endDate: string;
  options: FundingOptionResponse[];
}

// 펀딩 생성 응답
export interface CreateFundingResponse {
  resultCode: string;
  msg: string;
  data: CreateFundingData;
}

//======== 펀딩 상세 페이지 =============

export interface FundingOption {
  id: number;
  name: string;
  price: number;
  stock: number;
}

export interface FundingNews {
  id: number;
  actorNickname: string;
  title: string;
  content: string;
  imageUrl: string;
  createDate: string;
}

export interface FundingDetailResponse {
  resultCode: string;
  msg: string;
  data: FundingDetail;
}

// 변경된 이미지 타입을 위한 인터페이스
export interface FundingImage {
  fileUrl: string;
  fileType: string;
}

// 'author' 객체에 email 필드 추가
export interface FundingDetailAuthor {
  id: number;
  name: string;
  email: string; // email 필드 추가
  profileImageUrl: string;
  artistDescription: string;
}

// 메인 'FundingDetail' 인터페이스 업데이트
export interface FundingDetail {
  id: number;
  title: string;
  description: string;
  images: FundingImage[]; // 'imageUrl'을 'images' 배열로 변경
  categoryName: string;
  targetAmount: number;
  price: number;
  stock: number;
  soldCount: number;
  currentAmount: number;
  participants: number;
  startDate: string;
  endDate: string;
  remainingDays: number;
  progress: number;
  status: FundingStatus;
  author: FundingDetailAuthor;
  news: FundingNews[];
  communities: FundingCommunity[];
}

export interface FundingCommunity {
  id: number;
  writerName: string;
  writerEmail: string;
  profileImageUrl: string;
  content: string;
  createDate: string;
}
