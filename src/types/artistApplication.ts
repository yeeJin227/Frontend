
export type DocumentType = 'BUSINESS_LICENSE' | 'TELECOM_CERTIFICATION' | 'PORTFOLIO';

export type S3FileRequest = {
  url: string;
  type: 'DOCUMENT';         // 서버 DTO
  s3Key: string;
  originalFileName: string;
};

export type ArtistApplicationRequest = {
  ownerName: string;  
  email: string;
  phone: string;
  artistName: string;
  businessNumber: string;            // "123-45-67890"
  businessAddress: string;       
  businessAddressDetail: string;   
  businessZipCode: string;         
  telecomSalesNumber: string;       

  documents: Record<DocumentType, S3FileRequest[]>;

  // 선택 필드
  businessName?: string;
  snsAccount?: string;
  mainProducts?: string;
  managerPhone?: string;
  bankName?: string;
  bankAccount?: string;
  accountName?: string;
};

export type ApiResponse<T> = {
  resultCode: string; // "200"
  msg: string;
  data: T;
};
