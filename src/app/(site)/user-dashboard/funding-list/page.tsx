'use client';

import { useState, useEffect, useCallback } from 'react';
import SearchIcon from '@/assets/icon/search.svg';
import Image from 'next/image'; // next/image 사용을 권장합니다.

// --- API 연동을 위한 설정 ---
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'
).replace(/\/+$/, '');

// 한 페이지에 표시할 아이템 수
const ITEMS_PER_PAGE = 6;

// --- TypeScript 타입 정의 ---

// API 응답의 content 배열에 포함될 개별 펀딩 객체의 타입
// (응답 예시가 비어있어 테이블 헤더를 기준으로 필드명을 유추했습니다)
interface Funding {
  fundingSupportId: string; // 고유 key로 사용할 ID
  fundingNumber: string; // 후원번호
  imageUrl: string; // 이미지
  fundingName: string; // 펀딩명
  artistName: string; //작가명
  quantity: number; // 수량
  supportAmount: number; // 후원금액
  fundingStatus: string; // 펀딩상태
  supportedAt: string; // 후원일자 (ISO 8601 형식의 문자열로 가정)
}

// API의 sort 파라미터에 맞는 정렬 가능한 컬럼 타입
type SortColumn =
  | 'title'
  | 'artistName'
  | 'pledgedAmount'
  | 'status'
  | 'paidAt'
  | null;
type SortDirection = 'asc' | 'desc';

// --- 디바운스 커스텀 훅 ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export default function FundingListPage() {
  // --- 상태 관리 ---
  const [fundings, setFundings] = useState<Funding[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  // 페이지, 정렬, 검색 관련 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [sortColumn, setSortColumn] = useState<SortColumn>('artistName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // 데이터 로딩 및 에러 상태
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- 데이터 패칭 로직 ---
  const fetchFundings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: (currentPage - 1).toString(),
        size: ITEMS_PER_PAGE.toString(),
        keyword: debouncedSearchTerm,
        sort: sortColumn || 'artistName', // 기본 정렬 기준
        order: sortDirection.toUpperCase(),
      });

      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/funding?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json;charset=UTF-8',
          },
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error('데이터를 불러오는 데 실패했습니다.');
      }

      const result = await response.json();

      if (result.resultCode === '200') {
        setFundings(result.data.content);
        setTotalPages(result.data.totalPages);
      } else {
        throw new Error(result.msg || '알 수 없는 오류가 발생했습니다.');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, sortColumn, sortDirection]);

  useEffect(() => {
    fetchFundings();
  }, [fetchFundings]);

  // 검색어 변경 시 1페이지로 이동
  useEffect(() => {
    if (debouncedSearchTerm !== undefined) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);

  // --- 이벤트 핸들러 ---
  const toggleSelectItem = (id: string) => {
    setSelectedItem(selectedItem === id ? null : id);
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
    setCurrentPage(1); // 정렬 변경 시 1페이지로 이동
  };

  return (
    <div className="p-12 bg-white min-h-screen mx-auto max-w-[50vw] w-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-6">
          <h1 className="text-3xl font-bold">참여한 펀딩 목록</h1>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-2 bg-primary text-white rounded-md font-medium">
            후원 취소
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          {/* 테이블 헤더 */}
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-16 px-4 py-4"></th>
              <th className="px-4 py-4 text-left">
                <button
                  // API에 후원번호 정렬 기능이 없으므로 비활성화 또는 다른 필드로 대체
                  disabled
                  className="flex items-center gap-1 text-sm font-medium text-gray-400 cursor-not-allowed"
                >
                  후원번호
                </button>
              </th>
              <th className="px-4 py-4 text-left">
                <div className="text-sm font-medium text-gray-700">이미지</div>
              </th>
              <th className="px-4 py-4 text-left">
                <button
                  onClick={() => handleSort('title')}
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  펀딩명
                  <svg
                    className={`w-4 h-4 transition-transform ${sortColumn === 'title' && sortDirection === 'asc' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </th>
              <th className="px-4 py-4 text-left">
                <button
                  onClick={() => handleSort('artistName')}
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  작가명
                  <svg
                    className={`w-4 h-4 transition-transform ${sortColumn === 'artistName' && sortDirection === 'asc' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </th>
              <th className="px-4 py-4 text-center">
                <div className="text-sm font-medium text-gray-700">수량</div>
              </th>
              <th className="px-4 py-4 text-left">
                <button
                  onClick={() => handleSort('pledgedAmount')}
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  후원금액
                  <svg
                    className={`w-4 h-4 transition-transform ${sortColumn === 'pledgedAmount' && sortDirection === 'asc' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </th>
              <th className="px-4 py-4 text-left">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  펀딩상태
                  <svg
                    className={`w-4 h-4 transition-transform ${sortColumn === 'status' && sortDirection === 'asc' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </th>
              <th className="px-4 py-4 text-left">
                <button
                  onClick={() => handleSort('paidAt')}
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  후원일자
                  <svg
                    className={`w-4 h-4 transition-transform ${sortColumn === 'paidAt' && sortDirection === 'asc' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </th>
            </tr>
          </thead>

          {/* 테이블 바디 */}
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-10">
                  목록을 불러오는 중입니다...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={8} className="text-center text-red-500 py-10">
                  오류: {error}
                </td>
              </tr>
            ) : fundings.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10">
                  참여한 펀딩 내역이 없습니다.
                </td>
              </tr>
            ) : (
              fundings.map((funding) => (
                <tr
                  key={funding.fundingSupportId}
                  className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-4">
                    <button
                      onClick={() => toggleSelectItem(funding.fundingSupportId)}
                      className="w-5 h-5 border-2 border-primary rounded-full flex items-center justify-center mx-auto"
                    >
                      {selectedItem === funding.fundingSupportId && (
                        <div className="w-3 h-3 bg-primary rounded-full" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {funding.fundingNumber}
                  </td>
                  <td className="px-4 py-4">
                    <Image
                      src={funding.imageUrl || '/placeholder.png'} // 이미지가 없을 경우 대체 이미지
                      alt="펀딩 이미지"
                      width={64}
                      height={64}
                      className="w-16 h-16 object-cover rounded border border-gray-200"
                    />
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {funding.fundingName}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 text-center">
                    {funding.quantity}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">
                    {funding.supportAmount.toLocaleString('ko-KR')}원
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {funding.fundingStatus}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {new Date(funding.supportedAt).toLocaleDateString('ko-KR')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-center items-center gap-2 mt-8">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || loading}
          className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {[...Array(totalPages)].map((_, index) => {
          const page = index + 1;
          return (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              disabled={loading}
              className={`w-8 h-8 rounded ${currentPage === page ? 'text-primary font-bold underline' : 'text-gray-700'}`}
            >
              {page}
            </button>
          );
        })}

        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || loading}
          className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* 검색 폼 */}
      <div className="relative flex items-center justify-center">
        <form
          className="absolute right-0 flex h-10 w-[240px] items-center rounded-[12px] border border-primary px-4 text-sm text-[var(--color-gray-700)]"
          onSubmit={(event) => event.preventDefault()}
        >
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="검색어를 입력하세요"
            className="h-full flex-1 bg-transparent pr-8 outline-none placeholder:text-[var(--color-gray-400)]"
          />
          <SearchIcon
            className="absolute right-4 h-4 w-4 text-primary"
            aria-hidden
          />
        </form>
      </div>
    </div>
  );
}
