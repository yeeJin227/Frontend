export type CategoryPayload = {
  categoryName: string;
  parentId: number | null;
};

export type Category = {
  id: number;
  categoryName: string;
  parentId?: number | null;
  subCategories: Category[];
  slug: string; // 라우팅 고정키
};

export type ApiResponse<T> = {
  resultCode: string;
  msg: string;
  data: T;
};
