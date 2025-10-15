

/* ──────────────────────────────────────────────────────────
 * 공통 래퍼 / 공통 파라미터
 * ────────────────────────────────────────────────────────── */

export type ApiResponse<T> = {
  resultCode: string; // "200"
  msg: string;
  data: T;
};

/* ──────────────────────────────────────────────────────────
 * /api/dashboard/artist/main
 * ────────────────────────────────────────────────────────── */

export interface ArtistMainRoot {
  profile: ArtistMainProfile;
  stats: ArtistMainStats;
  trends: ArtistMainTrends;
  notifications: ArtistMainNotifications;
  trafficSources: ArtistMainTrafficSources;
  serverTime: string; // ISO
  timezone: string;
}

export interface ArtistMainProfile {
  userId: number;
  nickname: string;
  email: string;
  profileImageUrl: string;
}

export interface ArtistMainStats {
  followerCount: number;
  productCount: number;
  todaysSales: number;
  todaysOrders: number;
  totalSales: number;
  totalOrders: number;
  averageRating: number;
  pendingOrders: number;
}

export interface ArtistMainTrends {
  meta: ArtistMainMeta;
  series: ArtistMainSeries;
  changes: ArtistMainChanges;
}

export interface ArtistMainMeta {
  range: string;
  from: string;
  to: string;
  interval: string;
  timezone: string;
  maxPoints: number;
  compare: { from: string; to: string } | null;
}

export interface ArtistMainSeries {
  sales: ArtistMainSeriesData;
  orders: ArtistMainSeriesData;
  followers: ArtistMainSeriesData;
}

export interface ArtistMainSeriesData {
  unit: string;
  points: ArtistMainDataPoint[];
  total: number;
}

export interface ArtistMainDataPoint {
  t: string;
  v: number;
}

export interface ArtistMainChanges {
  sales: ArtistMainChangeData;
  orders: ArtistMainChangeData;
  followers: ArtistMainChangeData;
}

export interface ArtistMainChangeData {
  delta: number;
  rate: number;
}

export interface ArtistMainNotifications {
  orderAlerts: ArtistMainAlert[];
  fundingAlerts: ArtistMainAlert[];
}

export interface ArtistMainAlert {
  type: string;
  message: string;
  count: number;
  timestamp: string; // ISO
}

export interface ArtistMainTrafficSources {
  summary: ArtistMainTrafficSummary;
  sources: ArtistMainSource[];
  chart: ArtistMainChart;
}

export interface ArtistMainTrafficSummary {
  totalSessions: number;
  totalUsers: number;
  conversions: number;
  conversionRate: number;
  topSource: string;
}

export interface ArtistMainSource {
  name: string;
  sessions: number;
  users: number;
  share: number;
}

export interface ArtistMainChart {
  data: ArtistMainChartData[];
}

export interface ArtistMainChartData {
  name: string;
  value: number;       // sessions
  percentage: number;  // share %
  color: string;       // hex
}

export type ArtistMainParams = {
  range?: '1D' | '7D' | '30D' | '3M' | '6M' | '1Y' | 'CUSTOM';
  from?: string;     // CUSTOM일 때 필수
  to?: string;       // CUSTOM일 때 필수
  interval?: 'DAY' | 'WEEK' | 'MONTH';
  tz?: string;       // e.g. "Asia/Seoul"
};

/* ──────────────────────────────────────────────────────────
 * /api/dashboard/artist/orders
 * ────────────────────────────────────────────────────────── */

export interface ArtistOrderList {
  summary: ArtistOrderSummary;
  content: ArtistOrder[];
  page: number;           // 0-base
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ArtistOrderSummary {
  total: number;
  pending: number;
  preparing: number;
  shipped: number;
  delivered: number;
  canceled: number;
}

export interface ArtistOrder {
  orderId: string;
  orderNumber: string;
  orderDate: string;      // 2025-09-18T12:34:56 or 2025-09-18
  status: string;
  statusText: string;     // 한글 (예: 결제 완료/배송중)
  totalAmount: number;
  productSummary: string;
  itemCount: number;
  buyer: ArtistOrderBuyer;
  shipment: ArtistOrderShipment | null;
  permissions: ArtistOrderPermissions | null;
  orderItems?: {
    orderItemId: number;
  }[];
}

export interface ArtistOrderBuyer {
  id: number;
  nickname: string;
  name: string;
}

export interface ArtistOrderShipment {
  status: string;
  trackingNo: string | null;
  shippingCompany: string | null;
}

export interface ArtistOrderPermissions {
  canChangeStatus: boolean;
  canCancel: boolean;
}

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

/* ──────────────────────────────────────────────────────────
 * /api/dashboard/artist/requests/cancellations
 * ────────────────────────────────────────────────────────── */

export interface ArtistCancellationList {
  summary: ArtistCancellationSummary | null;
  content: ArtistCancellationRequest[];
  page: number;           // 0-base
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ArtistCancellationSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface ArtistCancellationRequest {
  requestId: number;
  orderId: string;
  orderNumber: string;
  type: string;
  status: string;      // enum-like
  statusText: string;  // 한글 라벨
  requestDate: string; // ISO or YYYY-MM-DD
  reason: string;
  customerMessage: string;
  customer: ArtistCancellationCustomer;
  orderItem: ArtistCancellationOrderItem;
  refundAmount: number;
  permissions: ArtistCancellationPermissions | null;
}

export interface ArtistCancellationCustomer {
  id: number;
  nickname: string;
}

export interface ArtistCancellationOrderItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

export interface ArtistCancellationPermissions {
  canApprove: boolean;
  canReject: boolean;
}

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

/* ──────────────────────────────────────────────────────────
 * /api/dashboard/artist/requests/exchanges
 * ────────────────────────────────────────────────────────── */

export interface ArtistExchangeList {
  summary: ArtistExchangeSummary | null;
  content: ArtistExchangeRequest[];
  page: number;           // 0-base
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ArtistExchangeSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface ArtistExchangeRequest {
  requestId: number;
  orderId: string;
  orderNumber: string;
  type: string;
  status: string;
  statusText: string;
  requestDate: string;
  reason: string;
  customerMessage: string;
  customer: ArtistExchangeCustomer;
  orderItem: ArtistExchangeOrderItem;
  exchangeRequested: ArtistExchangeRequested | null;
  permissions: ArtistExchangePermissions | null;
}

export interface ArtistExchangeCustomer {
  id: number;
  nickname: string;
}

export interface ArtistExchangeOrderItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

export interface ArtistExchangeRequested {
  option: string;
  quantity: number;
}

export interface ArtistExchangePermissions {
  canApprove: boolean;
  canReject: boolean;
}

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

/* ──────────────────────────────────────────────────────────
 * /api/dashboard/artist/settings
 * ────────────────────────────────────────────────────────── */

export interface ArtistSettingsRoot {
  profile: ArtistSettingsProfile;
  business: ArtistSettingsBusiness;
  payout: ArtistSettingsPayout;
  permissions: ArtistSettingsPermissions;
}

export interface ArtistSettingsProfile {
  nickname: string;
  bio: string;
  sns: ArtistSettingsSns[];
  profileImageUrl: string;
}

export interface ArtistSettingsSns {
  platform: string; // e.g., "Instagram" | "YouTube" | ...
  handle: string;   // e.g., "@nickname"
}

export interface ArtistSettingsBusiness {
  address: string;
  businessRegistrationNo: string;
  telemarketingReportNo: string;
  verified: boolean;
}

export interface ArtistSettingsPayout {
  bankCode: string;       // e.g., "004"
  bankName: string;       // e.g., "KB국민"
  accountHolder: string;
  accountMasked: string;  // ****-****-123456
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | string;
}

export interface ArtistSettingsPermissions {
  canEditProfile: boolean;
  canEditBusiness: boolean;
  canEditPayout: boolean;
}


// 상품 상세 - 작가 기본정보
export type ProductArtistInfo = {
  artistId?: number; // 백엔드가 추가해줄 수 있음
  artistName: string;
  followerCount: number;
  approvedDate: string;
  profileImageUrl: string;
  artistPageUrl: string;
  description: string;
};

// 작가 공개 프로필 상세정보
export type ArtistPublicProfile = {
  artistId: number;
  artistName: string;
  profileImageUrl: string;
  description: string;
  mainProducts: string;
  snsAccount: string;
  followerCount: number;
  totalSales: number;
  productCount: number;
  createdAt: string;
  isFollowing?: boolean;
};
