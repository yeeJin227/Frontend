'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import SearchIcon from '@/assets/icon/search.svg';

// --- API 응답 데이터에 대한 TypeScript 타입 정의 ---

interface Artist {
  id: string;
  name: string;
}

// API 응답의 'content' 배열에 포함될 개별 주문 객체의 타입
interface Order {
  // 기존 코드의 'id'와 유사한 역할을 할 고유 값
  wishId: string;
  // 주문번호
  productNumber: string;
  // 상품 이미지 URL
  imageUrl: string;
  // 상품명
  productName: string;
  // 수량 (API 응답에 없으므로 임의로 1로 표시하거나, 필요 시 API 수정 필요)
  quantity: number;
  // 구매금액
  price: number;
  // 주문상태
  sellingStatus: string;
  // 주문일자
  registeredDate: string;
}

// --- 정렬 가능한 컬럼 타입 정의 (API Request의 sort 필드 기준) ---
type SortColumn = 'productName' | 'totalAmount' | 'status' | 'orderDate' | null;
type SortDirection = 'asc' | 'desc';

// --- 디바운스 커스텀 훅 ---
// 값의 변경이 멈춘 후 일정 시간(delay)이 지나면 최신 값을 반환
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // cleanup 함수: 새로운 값이 들어오면 이전 타이머를 제거
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function OrderList() {
  // --- 상태 관리 ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  // 페이지네이션 관련 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // 정렬 관련 상태
  const [sortColumn, setSortColumn] = useState<SortColumn>('orderDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // 검색 관련 상태
  const [searchTerm, setSearchTerm] = useState('');
  // 디바운싱 적용된 검색어
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // 데이터 로딩 및 에러 상태
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 4; // 한 페이지에 보여줄 아이템 수

  const API_BASE_URL = (
    process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'
  ).replace(/\/+$/, '');

  // --- 데이터 패칭 로직 ---
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: (currentPage - 1).toString(), // API는 0-based index 사용
        size: ITEMS_PER_PAGE.toString(),
        keyword: debouncedSearchTerm,
        sort: sortColumn || 'orderDate', // 정렬 컬럼이 null이면 기본값 사용
        order: sortDirection.toUpperCase(),
      });

      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/orders?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            accept: 'application/json;charset=UTF-8',
          },
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error('데이터를 불러오는 데 실패했습니다.');
      }

      const result = await response.json();

      // API 응답 구조에 맞춰 데이터 설정
      // 응답된 content의 각 아이템에 quantity가 없으므로 임의로 추가
      const ordersWithQuantity = result.data.content.map(
        (order: Omit<Order, 'quantity'>) => ({
          ...order,
          quantity: 1, // API에 수량 정보가 없으므로 임시로 1을 할당
        }),
      );

      setOrders(ordersWithQuantity);
      setTotalPages(result.data.totalPages);
      setHasNext(result.data.hasNext);
      setHasPrevious(result.data.hasPrevious);
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

  // --- `useEffect`를 사용하여 상태 변경 시 데이터 다시 불러오기 ---
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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
    setCurrentPage(1); // 정렬 기준 변경 시 1페이지로 이동
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 검색어 변경 시 1페이지로 이동
  useEffect(() => {
    if (debouncedSearchTerm !== undefined) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);

  return (
    <div className="p-12 bg-white min-h-screen mx-auto  max-w-[50vw] w-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-6">
          <h1 className="text-3xl font-bold">주문 목록</h1>
          <p className="text-gray-600 text-sm ml-[42px] mr-[163px]">
            ** 최소 신청은 &apos;발송준비중&apos;으로 상태가 변경되기 이전까지만
            가능하며,
            <br /> 교환 / 환불 신청은 배송완료 후 7일까지만 가능합니다.
          </p>
        </div>
        {/* <div className="flex gap-3">
          <button className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50">
            취소 신청
          </button>
          <button className="px-6 py-2 bg-primary text-white rounded-md font-medium">
            교환/환불 신청
          </button>
        </div> */}
      </div>

      {/* 테이블 */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          {/* 테이블 헤더 */}
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-16 px-4 py-4"></th>
              {/* 각 헤더의 onClick 핸들러에 API 필드명 전달 */}
              <th className="px-4 py-4 text-left">
                <div className="text-sm font-medium text-gray-700">
                  주문번호
                </div>
              </th>
              <th className="px-4 py-4 text-left">
                <div className="text-sm font-medium text-gray-700">이미지</div>
              </th>
              <th className="px-4 py-4 text-left">
                <button
                  onClick={() => handleSort('productName')}
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  상품명
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      sortColumn === 'productName' && sortDirection === 'asc'
                        ? 'rotate-180'
                        : ''
                    }`}
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
                  onClick={() => handleSort('totalAmount')}
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  수량
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      sortColumn === 'totalAmount' && sortDirection === 'asc'
                        ? 'rotate-180'
                        : ''
                    }`}
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
                <div className="text-sm font-medium text-gray-700">
                  구매금액
                </div>
              </th>
              <th className="px-4 py-4 text-left">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  주문상태
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      sortColumn === 'status' && sortDirection === 'asc'
                        ? 'rotate-180'
                        : ''
                    }`}
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
                  onClick={() => handleSort('orderDate')}
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  주문일자
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      sortColumn === 'orderDate' && sortDirection === 'asc'
                        ? 'rotate-180'
                        : ''
                    }`}
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
                  로딩 중...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-red-500">
                  에러: {error}
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10">
                  주문 내역이 없습니다.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.wishId}
                  className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-4">
                    <button
                      onClick={() => toggleSelectItem(order.wishId)}
                      className="w-5 h-5 border-2 border-primary rounded-full flex items-center justify-center mx-auto"
                    >
                      {selectedItem === order.wishId && (
                        <div className="w-3 h-3 bg-primary rounded-full" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {order.productNumber}
                  </td>
                  <td className="px-4 py-4">
                    <Image
                      src={order.imageUrl || '/placeholder.png'} // 이미지가 없을 경우 대체 이미지
                      alt="상품 이미지"
                      width={64}
                      height={64}
                      className="w-16 h-16 object-cover rounded border border-gray-200"
                    />
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {order.productName}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 text-center">
                    {order.quantity}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">
                    {/* 숫자로 오는 가격을 원화 형식으로 변환 */}
                    {order.price.toLocaleString('ko-KR')}원
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {order.sellingStatus}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {/* ISO 8601 날짜 형식을 'YYYY. MM. DD'로 변환 */}
                    {new Date(order.registeredDate)
                      .toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })
                      .replace(/\s/g, '')}
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
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={!hasPrevious || loading}
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

        {totalPages > 0 &&
          [...Array(totalPages)].map((_, index) => {
            const page = index + 1;
            return (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                disabled={loading}
                className={`w-8 h-8 rounded ${
                  currentPage === page
                    ? 'text-primary font-bold underline'
                    : 'text-gray-700'
                }`}
              >
                {page}
              </button>
            );
          })}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={!hasNext || loading}
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
          onSubmit={(event) => event.preventDefault()} // Enter 키로 인한 페이지 새로고침 방지
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
