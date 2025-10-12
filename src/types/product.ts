// 공통 업로드 타입
export type UploadType = 'MAIN' | 'ADDITIONAL' | 'THUMBNAIL' | 'DOCUMENT';

export type UploadedImageInfo = {
  url: string;
  type: UploadType;
  s3Key: string;
  originalFileName: string;
};

// 작가대시보드 - 상품관리
export type ProductRow = {
  id: string;
  name: string;
  author: string;
  status: string;
  createdAt: string; // YYYY-MM-DD
  productId?: string;
  productUuid?: string;   // 실제 수정/삭제용
  payloadSnapshot?: ProductCreatePayload;
};

// 서버 DTO
export type ProductCreateDto = {
  categoryId: number;
  name: string;
  brandName: string;
  productModelName: string;

  price: number;
  discountRate: number;

  bundleShippingAvailable: boolean;
  deliveryType: 'FREE' | 'PAID' | 'CONDITIONAL_FREE';
  deliveryCharge: number;               // FREE면 0
  additionalShippingCharge: number;
  conditionalFreeAmount: number | null; // 조건부 아니면 null

  stock: number;
  description: string;

  sellingStatus: 'BEFORE_SELLING' | 'SELLING' | 'SOLD_OUT' | 'END_OF_SALE';
  displayStatus: 'BEFORE_DISPLAY' | 'DISPLAYING' | 'END_OF_DISPLAY';

  minQuantity: number;
  maxQuantity: number;

  isPlanned: boolean;
  isRestock: boolean;
  sellingStartDate: string | null; // "YYYY-MM-DDTHH:mm:ss"
  sellingEndDate: string | null;

  tags: number[];

  options: {
    optionName: string;
    optionStock: number;
    optionAdditionalPrice: number;
  }[];

  additionalProducts: {
    additionalProductName: string;
    additionalProductStock: number;
    additionalProductPrice: number;
  }[];

  images: {
    url: string;
    type: UploadType;
    s3Key: string;
    originalFileName: string;
  }[];

  certification: boolean;
  origin: string;
  material: string;
  size: string;
};

// 공통 래퍼
export type ApiResponse<T> = {
  resultCode: string;
  msg: string;
  data: T;
};

// UI 타입
export type ShippingTypeUI = 'FREE' | 'PAID' | 'CONDITIONAL';
export type TagUI = string;

export type ProductOptionUI = { id: string; name: string; extraPrice?: number; stock?: number };
export type ProductAddonUI  = { id: string; name: string; extraPrice?: number; stock?: number };

export type ProductCreatePayload = {
  brand: string;
  title: string;
  modelName: string;
  category1: string;
  category2: string;
  size: string;
  material: string;
  origin: string;
  price: number;
  discountRate: number;
  stock: number;
  minQty: number;
  maxQty: number;
  bundleShipping: boolean;
  shipping: {
    type: ShippingTypeUI;
    fee: number;
    freeThreshold: number | null;
    jejuExtraFee: number;
  };
  plannedSale: { startAt: string; endAt: string } | null;
  tags: TagUI[];
  options: ProductOptionUI[];
  addons: ProductAddonUI[];
  lawCert: { required: boolean; detail?: string };
  bizInfo?: { companyName?: string; bizNumber?: string; ceoName?: string }; // 서버 전송 X
  description: string;
  attachments?: File[]; // 서버 전송 X
};

// 태그
export type TagDict = Record<string, number>;

// 상품 목록
// /api/products (페이지형)
export type ProductListItem = {
  productUuid: string;
  url: string;          // 썸네일/대표 이미지
  brandName: string;
  name: string;
  price: number | null;
  discountRate: number;
  discountPrice: number;
  rating: number;
};

// 페이지 컨테이너
export type ProductListData = {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  products: ProductListItem[];
};

// 쿼리 파라미터
export type ProductListParams = {
  categoryId?: number;
  tagIds?: number[]; // tagIds=1&tagIds=2
  minPrice?: number;
  maxPrice?: number;
  deliveryType?: 'PAID' | 'FREE' | 'CONDITIONAL';
  sort?: 'newest' | 'priceAsc' | 'priceDesc' | 'popular';
  page?: number; // UI 기준 0부터 (서버 전송 시 +1)
  size?: number; // 기본 10 
};