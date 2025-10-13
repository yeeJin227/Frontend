

// /api/dashboard/artist/main 응답 DTO
export namespace ArtistMainResponseDTO {
  export type Root = {
    profile: Profile;
    stats: Stats;
    trends: Trends;
    notifications: Notifications;
    trafficSources: TrafficSources;
    serverTime: string; // ISO
    timezone: string;
  };

  export type Profile = {
    userId: number;
    nickname: string;
    email: string;
    profileImageUrl: string;
  };

  export type Stats = {
    followerCount: number;
    productCount: number;
    todaysSales: number;
    todaysOrders: number;
    totalSales: number;
    totalOrders: number;
    averageRating: number;
    pendingOrders: number;
  };

  export type Trends = {
    meta: Meta;
    series: Series;
    changes: Changes;
  };

  export type Meta = {
    range: string;
    from: string;
    to: string;
    interval: string;
    timezone: string;
    maxPoints: number;
    compare: { from: string; to: string } | null;
  };

  export type Series = {
    sales: SeriesData;
    orders: SeriesData;
    followers: SeriesData;
  };

  export type SeriesData = {
    unit: string;
    points: Array<DataPoint>;
    total: number;
  };

  export type DataPoint = { t: string; v: number };

  export type Changes = {
    sales: ChangeData;
    orders: ChangeData;
    followers: ChangeData;
  };

  export type ChangeData = { delta: number; rate: number };

  export type Notifications = {
    orderAlerts: Alert[];
    fundingAlerts: Alert[];
  };

  export type Alert = {
    type: string;
    message: string;
    count: number;
    timestamp: string; // ISO
  };

  export type TrafficSources = {
    summary: TrafficSummary;
    sources: Source[];
    chart: Chart;
  };

  export type TrafficSummary = {
    totalSessions: number;
    totalUsers: number;
    conversions: number;
    conversionRate: number;
    topSource: string;
  };

  export type Source = {
    name: string;
    sessions: number;
    users: number;
    share: number;
  };

  export type Chart = {
    data: Array<ChartData>;
  };

  export type ChartData = {
    name: string;
    value: number;       // sessions
    percentage: number;  // share %
    color: string;       // hex
  };
}

// 요청 파라미터 
export type ArtistMainParams = {
  range?: '1D' | '7D' | '30D' | '3M' | '6M' | '1Y' | 'CUSTOM';
  from?: string;     // CUSTOM일 때 필수
  to?: string;       // CUSTOM일 때 필수
  interval?: 'DAY' | 'WEEK' | 'MONTH';
  tz?: string;       // e.g. "Asia/Seoul"
};




// /api/dashboard/artist/orders 응답 DTO
export namespace ArtistOrderResponseDTO {
  export type List = {
    summary: Summary;
    content: Order[];
    page: number;           // 0-base
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };

  export type Summary = {
    total: number;
    pending: number;
    preparing: number;
    shipped: number;
    delivered: number;
    canceled: number;
  };

  export type Order = {
    orderId: string;
    orderNumber: string;
    orderDate: string;      // 2025-09-18T12:34:56 or 2025-09-18
    status: string;      
    statusText: string;     // 한글 (예: 결제 완료/배송중)
    totalAmount: number;
    productSummary: string; 
    itemCount: number;
    buyer: Buyer;
    shipment: Shipment | null;
    permissions: Permissions | null;
  };

  export type Buyer = {
    id: number;  
    nickname: string;
    name: string;
  };

  export type Shipment = {
    status: string;
    trackingNo: string | null;
    shippingCompany: string | null;
  };

  export type Permissions = {
    canChangeStatus: boolean;
    canCancel: boolean;
  };
}

// 공통 API 래퍼 
export type ApiResponse<T> = {
  resultCode: string; // "200"
  msg: string;
  data: T;
};

// 공통 검색 파라미터 (UI → API)
export type ArtistOrdersParams = {
  page?: number; // UI 1-base
  size?: number;
  status?: string;          // 'DELIVERED' ...
  keyword?: string;
  startDate?: string;       // YYYY-MM-DD
  endDate?: string;         // YYYY-MM-DD
  sort?: string;            // 'status' ...
  order?: 'ASC' | 'DESC';
};


// /api/dashboard/artist/requests/cancellations 응답 DTO
export namespace ArtistCancellationResponseDTO {
  export type List = {
    summary: Summary | null;
    content: CancellationRequest[];
    page: number;           // 0-base
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };

  export type Summary = {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };

  export type CancellationRequest = {
    requestId: number;
    orderId: string;
    orderNumber: string;
    type: string;
    status: string;      // enum-like
    statusText: string;  // 한글 라벨
    requestDate: string; // ISO or YYYY-MM-DD
    reason: string;
    customerMessage: string;
    customer: Customer;
    orderItem: OrderItem;
    refundAmount: number;
    permissions: Permissions | null;
  };

  export type Customer = {
    id: number;
    nickname: string;
  };

  export type OrderItem = {
    productId: number;
    productName: string;
    quantity: number;
    price: number;
  };

  export type Permissions = {
    canApprove: boolean;
    canReject: boolean;
  };
}


// 검색 파라미터 (UI → API) 
export type ArtistCancellationParams = {
  page?: number; // UI 1-base
  size?: number;
  status?: string;          // 'PENDING' | 'APPROVED' | 'REJECTED' ...
  keyword?: string;
  startDate?: string;       // YYYY-MM-DD
  endDate?: string;         // YYYY-MM-DD
  productId?: number;
  sort?: string;       
  order?: 'ASC' | 'DESC';
};


// /api/dashboard/artist/requests/exchanges 응답 DTO
export namespace ArtistExchangeResponseDTO {
  export type List = {
    summary: Summary | null;
    content: ExchangeRequest[];
    page: number;           // 0-base
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };

  export type Summary = {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };

  export type ExchangeRequest = {
    requestId: number;
    orderId: string;
    orderNumber: string;
    type: string;
    status: string; 
    statusText: string; 
    requestDate: string; 
    reason: string;
    customerMessage: string;
    customer: Customer;
    orderItem: OrderItem;
    exchangeRequested: ExchangeRequested | null;
    permissions: Permissions | null;
  };

  export type Customer = { id: number; nickname: string; };

  export type OrderItem = {
    productId: number;
    productName: string;
    quantity: number;
    price: number;
  };

  export type ExchangeRequested = {
    option: string;
    quantity: number;
  };

  export type Permissions = {
    canApprove: boolean;
    canReject: boolean;
  };
}


// 검색 파라미터 (UI → API) 
export type ArtistExchangeParams = {
  page?: number; // UI 1-base
  size?: number;
  status?: string;          // 'PENDING' | 'APPROVED' | 'REJECTED' ...
  keyword?: string;
  startDate?: string;       // YYYY-MM-DD
  endDate?: string;         // YYYY-MM-DD
  productId?: number;
  sort?: string;            // 'status' 
  order?: 'ASC' | 'DESC';
};


// /api/dashboard/artist/settings
export namespace ArtistSettingsResponseDTO {
  export type Root = {
    profile: Profile;
    business: Business;
    payout: Payout;
    permissions: Permissions;
  };

  export type Profile = {
    nickname: string;
    bio: string;
    sns: Sns[];
    profileImageUrl: string;
  };

  export type Sns = {
    platform: string; // e.g., "Instagram" | "YouTube" | ...
    handle: string;   // e.g., "@nickname"
  };

  export type Business = {
    address: string;
    businessRegistrationNo: string;
    telemarketingReportNo: string;
    verified: boolean;
  };

  export type Payout = {
    bankCode: string;       // e.g., "004"
    bankName: string;       // e.g., "KB국민"
    accountHolder: string;
    accountMasked: string;  // ****-****-123456
    status: 'PENDING' | 'VERIFIED' | 'REJECTED' | string;
  };

  export type Permissions = {
    canEditProfile: boolean;
    canEditBusiness: boolean;
    canEditPayout: boolean;
  };
}
