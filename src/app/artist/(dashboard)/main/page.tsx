'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Plus from '@/assets/icon/plus.svg';

import TrendChart from '@/components/admin/TrendChart';
import CategoryPieChart from '@/components/admin/CategoryPieChart';

import { fetchArtistMain } from '@/services/artistDashboard';
import { ArtistMainParams, ArtistMainResponseDTO } from '@/types/artistDashboard';


// TrendChart prop: { title: string; color: string; data: {label:string,value:number}[] }
// CategoryPieChart prop: data: { name:string; value:number; color:string }[]

const DEFAULT_PARAMS: ArtistMainParams = {
  range: '7D',
  interval: 'DAY',
  tz: 'Asia/Seoul',
};

type StatCards = {
  followerCount: number;
  todaysSales: number;
  todaysOrders: number;
  productCount: number;
};

function toStatCards(stats?: ArtistMainResponseDTO.Stats): StatCards {
  return {
    followerCount: stats?.followerCount ?? 0,
    todaysSales: stats?.todaysSales ?? 0,
    todaysOrders: stats?.todaysOrders ?? 0,
    productCount: stats?.productCount ?? 0,
  };
}

function toTrendSeries(trends?: ArtistMainResponseDTO.Trends) {
  const sales = (trends?.series.sales.points ?? []).map(p => ({ label: p.t, value: p.v }));
  const orders = (trends?.series.orders.points ?? []).map(p => ({ label: p.t, value: p.v }));
  const followers = (trends?.series.followers.points ?? []).map(p => ({ label: p.t, value: p.v }));

  return {
    sales,
    orders,
    followers,
  };
}

function toPieData(traffic?: ArtistMainResponseDTO.TrafficSources) {
  const data = (traffic?.chart.data ?? []).map(d => ({
    name: d.name,
    value: d.value,
    color: d.color || '#cccccc',
  }));
  return data;
}

function toNotificationsList(n?: ArtistMainResponseDTO.Notifications) {
  return {
    order: n?.orderAlerts ?? [],
    funding: n?.fundingAlerts ?? [],
  };
}

export default function Page() {
  // 요청 파라미터 UI 상태
  const [params] = useState<ArtistMainParams>(DEFAULT_PARAMS);

  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ArtistMainResponseDTO.Root | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchArtistMain(params);
        if (!alive) return;
        if (res.notFound) {
          setNotFound(true);
          setData(null);
        } else {
          setNotFound(false);
          setData(res.data);
        }
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? '메인 현황 조회 실패');
        setNotFound(false);
        setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [params]);

  // 뷰 모델
  const statsVM = useMemo(() => toStatCards(data?.stats ?? undefined), [data]);
  const trendsVM = useMemo(() => toTrendSeries(data?.trends ?? undefined), [data]);
  const pieVM = useMemo(() => toPieData(data?.trafficSources ?? undefined), [data]);
  const notices = useMemo(() => toNotificationsList(data?.notifications ?? undefined), [data]);

  return (
    <>
      {/* 상단 상태 안내 */}
      {loading && (
        <div className="mb-4 rounded-md border border-[var(--color-gray-200)] bg-[var(--color-gray-20)] px-4 py-3 text-sm">
          불러오는 중…
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notFound && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          작가 프로필을 찾을 수 없습니다. 프로필 연결 후 자동으로 데이터가 표시됩니다.
        </div>
      )}

      <div className="mb-[30px]">
        <h3 className="mb-[30px] text-2xl font-bold">메인 현황</h3>

        {/* 상단 카드 4개 */}
        <div className="grid w-full grid-cols-1 gap-[30px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div className="flex items-center justify-between rounded-2xl border border-[var(--color-primary)] px-[23px] py-[14px]">
            <h2 className="text-xl font-bold">👥 팔로워 수</h2>
            <p className="text-lg font-medium">
              {statsVM.followerCount.toLocaleString()}명
            </p>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-[var(--color-primary)] px-[23px] py-[14px]">
            <h2 className="text-xl font-bold">💲 오늘의 매출</h2>
            <p className="text-lg font-medium">
              {statsVM.todaysSales.toLocaleString()}원
            </p>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-[var(--color-primary)] px-[23px] py-[14px]">
            <h2 className="text-xl font-bold">🛒 오늘의 주문</h2>
            <p className="text-lg font-medium">
              {statsVM.todaysOrders.toLocaleString()}건
            </p>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-[var(--color-primary)] px-[23px] py-[14px]">
            <h2 className="text-xl font-bold">🎁 상품 수</h2>
            <p className="text-lg font-medium">
              {statsVM.productCount.toLocaleString()}개
            </p>
          </div>
        </div>
      </div>

      {/* 추이 차트 */}
      <div>
        <h4 className="text-xl font-bold">팔로워/주문/매출 추이</h4>
        <div className="mt-6 grid gap-[30px] md:grid-cols-2 xl:grid-cols-3">
          <TrendChart title="팔로워 수" color="var(--color-primary)" data={trendsVM.followers} />
          <TrendChart title="주문 수" color="var(--color-tertiary)" data={trendsVM.orders} />
          <TrendChart title="매출" color="var(--color-danger)" data={trendsVM.sales} />
        </div>
      </div>

      <div className="flex w-full gap-[112px] max-xl:flex-col max-xl:gap-[40px]">
        {/* 유입 경로 파이차트 */}
        <div className="mt-[60px]">
          <h4 className="mb-6 text-xl font-bold">사용자 접속 경로</h4>
          <CategoryPieChart data={pieVM} />
        </div>

        {/* 알림 섹션 */}
        <div className="mt-[60px] flex-1">
          <h4 className="mb-6 text-xl font-bold">알림</h4>
          <div className="rounded-lg bg-[var(--color-primary-20)] p-5">
            <ul className="list-inside list-disc space-y-2 text-sm">
              <div className="mb-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-bold">주문 알림</h4>
                  <Link href="/artist/orders" className="flex items-center gap-2">
                    <Plus />
                    <span>더보기</span>
                  </Link>
                </div>
                {(notFound ? [] : notices.order).slice(0, 5).map((a, i) => (
                  <li key={`order-${i}`}>{a.message}</li>
                ))}
                {!notices.order?.length && <li>알림이 없습니다.</li>}
              </div>

              <div className="mb-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-bold">펀딩 알림</h4>
                  <Link href="/artist/users" className="flex items-center gap-2">
                    <Plus />
                    <span>더보기</span>
                  </Link>
                </div>
                {(notFound ? [] : notices.funding).slice(0, 5).map((a, i) => (
                  <li key={`fund-${i}`}>{a.message}</li>
                ))}
                {!notices.funding?.length && <li>알림이 없습니다.</li>}
              </div>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
