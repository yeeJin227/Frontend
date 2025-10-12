export interface FundingListProps {
  status: string[];
  sortBy: 'popular' | 'recent' | 'deadline' | 'highAmount';
  keyword: string;
  minPrice: number;
  maxPrice: number;
  page: number;
  size: number;
}

export interface Funding {
  id: number;
  title: string;
  imageUrl: string;
  authorName: string;
  targetAmount: number;
  currentAmount: number;
  progress: number;
  remainingDays: number;
}
