export type ReviewStats = {
  totalReviewCount: number;      // 전체 리뷰 수
  photoReviewCount: number;      // 포토리뷰 수
  generalReviewCount: number;    // 일반리뷰 수
  averageRating: number;         // 평균 평점(소수)
  ratingDistribution: Record<number, number>; // {1:개수, 2:개수, ...}
};

