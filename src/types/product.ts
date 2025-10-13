
// 공통
export type ApiResponse<T> = {
  resultCode: string; 
  msg: string;
  data: T;
};

// 상품 목록
export type DeliveryType = 'FREE' | 'PAID' | 'CONDITIONAL_FREE';
export type ProductImage = {
  fileUrl: string;
  fileType: 'MAIN' | 'THUMBNAIL' | 'ADDITIONAL';
};
export type SortKey = 'newest' | 'priceAsc' | 'priceDesc' | 'popular';

export type OptionResponse = {
  optionName: string;
  optionStock: number;
  optionAdditionalPrice: number;
};

export type AdditionalProductResponse = {
  name: string;
  stock: number;
  price: number;
};

export type TagResponse = { id: number; tagName?: string; name?: string };


export type ProductEssentialInfo = {
  productModelName: string;
  certification: boolean;
  origin: string;
  material: string;
  size: string;
  businessName: string | null;
  businessNumber: string;
  ownerName: string;
  asManager: string;
  email: string;
  businessAddress: string;
  telecomSalesNumber: string;
};


export type ProductDetail = {
  productUuid: string;
  artistName: string;
  brandName: string;
  name: string;
  averageRating: number;
  reviewCount: number;
  price: number;
  discountRate: number;
  discountPrice: number;
  bundleShippingAvailable: boolean;
  deliveryCharge: number;
  deliveryType: DeliveryType;
  conditionalFreeAmount: number | null;
  additionalShippingCharge: number;
  options: OptionResponse[];
  additionalProducts: AdditionalProductResponse[];
  images: ProductImage[];
  essentialInfo: ProductEssentialInfo;
  stock: number;
  description: string;
  minQuantity: number;
  maxQuantity: number;
  sellingStatus: string | null;
  displayStatus: string | null;
  isPlanned: boolean;
  isRestock: boolean;
  tags: TagResponse[];
};


export type ProductListItem = {
  productUuid: string;
  url: string;
  brandName: string;
  name: string;
  price: number;
  discountRate: number;
  discountPrice: number;
  rating: number | null;
};

export type ProductListData = {
  page: number;          // 0-base (UI 기준)
  size: number;
  totalElements: number;
  totalPages: number;
  products: ProductListItem[];
};

export type ProductListParams = {
  categoryId?: number;
  tagIds?: number[];
  minPrice?: number;
  maxPrice?: number;
  deliveryType?: DeliveryType;
  sort?: SortKey;
  page?: number; // 0-base (UI에서 0,1,2...) — 서버에는 1로 변환되어 나감
  size?: number;
};


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
  certification:boolean;
  bizInfo?: { companyName?: string; bizNumber?: string; ceoName?: string }; // 서버 전송 X
  description: string;
  attachments?: File[]; // 서버 전송 X
};

// 태그
export type TagDict = Record<string, number>;




