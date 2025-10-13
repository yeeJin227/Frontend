'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { fetchArtistSettings } from '@/services/artistDashboard';
import { ArtistSettingsResponseDTO } from '@/types/artistDashboard'; 

// 예시 은행코드 
const BANKS = [
  { code: '004', name: 'KB국민' },
  { code: '088', name: '신한' },
  { code: '090', name: '카카오뱅크' },
  { code: '020', name: '우리' },
  { code: '003', name: '기업' },
];

type SnsInput = { platform: string; handle: string };

export default function AccountSettingPage() {
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ArtistSettingsResponseDTO.Root | null>(null);

  // 보기/편집 모드
  const [editing, setEditing] = useState(false);

  // 폼 상태
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [sns, setSns] = useState<SnsInput[]>([]);
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');

  const [address, setAddress] = useState('');
  const [businessRegistrationNo, setBusinessRegistrationNo] = useState('');
  const [telemarketingReportNo, setTelemarketingReportNo] = useState('');
  const [businessVerified, setBusinessVerified] = useState(false);

  const [bankCode, setBankCode] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountMasked, setAccountMasked] = useState('');
  const [payoutStatus, setPayoutStatus] =
    useState<ArtistSettingsResponseDTO.Payout['status']>('PENDING');

  // 최초 로드
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchArtistSettings();
        if (!alive) return;
        if (res.notFound) {
          setNotFound(true);
          setData(null);
        } else {
          setNotFound(false);
          setData(res.data);

          // 폼 채우기
          setNickname(res.data.profile?.nickname ?? '');
          setBio(res.data.profile?.bio ?? '');
          setSns((res.data.profile?.sns ?? []).map(s => ({ platform: s.platform, handle: s.handle })));
          setProfileImageUrl(res.data.profile?.profileImageUrl ?? '');

          setAddress(res.data.business?.address ?? '');
          setBusinessRegistrationNo(res.data.business?.businessRegistrationNo ?? '');
          setTelemarketingReportNo(res.data.business?.telemarketingReportNo ?? '');
          setBusinessVerified(!!res.data.business?.verified);

          setBankCode(res.data.payout?.bankCode ?? '');
          setAccountHolder(res.data.payout?.accountHolder ?? '');
          setAccountMasked(res.data.payout?.accountMasked ?? '');
          setPayoutStatus((res.data.payout?.status as any) ?? 'PENDING');
        }
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? '작가 설정 정보 조회 실패');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 뱃지
  const Badge = ({
    label,
    tone = 'gray',
  }: {
    label: string;
    tone?: 'gray' | 'green' | 'red' | 'amber';
  }) => {
    const tones: Record<string, string> = {
      gray: 'bg-gray-100 text-gray-700 border-gray-200',
      green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      red: 'bg-red-50 text-red-700 border-red-200',
      amber: 'bg-amber-50 text-amber-800 border-amber-200',
    };
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${tones[tone]}`}
      >
        {label}
      </span>
    );
  };

  const payoutStatusTone: Record<string, 'gray' | 'green' | 'red' | 'amber'> = {
    VERIFIED: 'green',
    PENDING: 'amber',
    REJECTED: 'red',
  };

  // SNS
  const addSns = () => setSns(prev => [...prev, { platform: '', handle: '' }]);
  const removeSns = (idx: number) => setSns(prev => prev.filter((_, i) => i !== idx));
  const updateSns = (idx: number, key: keyof SnsInput, val: string) =>
    setSns(prev => prev.map((it, i) => (i === idx ? { ...it, [key]: val } : it)));

  // 저장/취소
  const onSave = () => {
    // TODO: 저장 API 붙으면 여기에서 호출
    console.log('저장 payload:', {
      profile: { nickname, bio, sns, profileImageUrl },
      business: { address, businessRegistrationNo, telemarketingReportNo, verified: businessVerified },
      payout: { bankCode, accountHolder, accountMasked, status: payoutStatus },
    });
    setEditing(false);
  };

  const onCancelEdit = () => {
    if (data) {
      setNickname(data.profile?.nickname ?? '');
      setBio(data.profile?.bio ?? '');
      setSns((data.profile?.sns ?? []).map(s => ({ platform: s.platform, handle: s.handle })));
      setProfileImageUrl(data.profile?.profileImageUrl ?? '');

      setAddress(data.business?.address ?? '');
      setBusinessRegistrationNo(data.business?.businessRegistrationNo ?? '');
      setTelemarketingReportNo(data.business?.telemarketingReportNo ?? '');
      setBusinessVerified(!!data.business?.verified);

      setBankCode(data.payout?.bankCode ?? '');
      setAccountHolder(data.payout?.accountHolder ?? '');
      setAccountMasked(data.payout?.accountMasked ?? '');
      setPayoutStatus((data.payout?.status as any) ?? 'PENDING');
    } else {
      // notFound면 빈 값 유지
      setNickname('');
      setBio('');
      setSns([]);
      setProfileImageUrl('');
      setAddress('');
      setBusinessRegistrationNo('');
      setTelemarketingReportNo('');
      setBusinessVerified(false);
      setBankCode('');
      setAccountHolder('');
      setAccountMasked('');
      setPayoutStatus('PENDING' as any);
    }
    setEditing(false);
  };

  // 보기 모드 카드
  const ReadRow = ({ label, value }: { label: string; value?: string }) => (
    <div>
      <div className="mb-1 text-sm font-medium text-gray-600">{label}</div>
      <div className="rounded-md border border-gray-200 bg-[var(--color-primary-20)] px-4 py-3 text-[var(--color-gray-800)]">
        {value && value.trim() ? value : <span className="text-gray-400">-</span>}
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full p-8">
      {/* 상태 표시 */}
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
          작가 프로필을 찾을 수 없습니다. 프로필 연결 전이라도 편집 모드로 미리 입력할 수 있습니다.
        </div>
      )}

      {/* 헤더 + 모드 전환 버튼 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">판매자 설정</h1>
        {!editing ? (
          <button
            className="rounded-md bg-[var(--color-primary)] px-5 py-2.5 text-white hover:opacity-90"
            onClick={() => setEditing(true)}
          >
            프로필 수정
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              className="rounded-md border border-gray-300 px-5 py-2.5 text-gray-800 hover:bg-gray-50"
              onClick={onCancelEdit}
            >
              취소
            </button>
            <button
              className="rounded-md bg-[var(--color-primary)] px-5 py-2.5 text-white hover:opacity-90"
              onClick={onSave}
            >
              프로필 저장
            </button>
          </div>
        )}
      </div>

      {/* ===== 프로필 섹션 ===== */}
      <section className="mb-10 rounded-xl border border-[var(--color-gray-200)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">프로필</h2>
          <Badge label={editing ? '편집 모드' : '보기 모드'} tone={editing ? 'green' : 'gray'} />
        </div>

        {/* 프로필 이미지 */}
        <div className="mb-6 flex items-center gap-4">
          <div className="h-24 w-24 overflow-hidden rounded-full bg-gray-200">
            {profileImageUrl ? (
              <Image
                src={profileImageUrl}
                alt="프로필"
                width={96}
                height={96}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
                No Image
              </div>
            )}
          </div>
          {editing && (
            <div className="ml-auto flex gap-2">
              <button
                className="rounded-md border border-[var(--color-primary)] px-4 py-2 text-[var(--color-primary)]"
                onClick={() => console.log('이미지 업로드(미연동)')}
              >
                이미지 업로드
              </button>
              <button
                className="rounded-md border border-[var(--color-primary)] px-4 py-2 text-[var(--color-primary)]"
                onClick={() => setProfileImageUrl('')}
              >
                이미지 삭제
              </button>
            </div>
          )}
        </div>

        {!editing ? (
          <div className="grid gap-4 md:grid-cols-2">
            <ReadRow label="작가명" value={nickname} />
            <div className="md:col-span-2">
              <ReadRow label="소개글" value={bio} />
            </div>
            <div className="md:col-span-2">
              <div className="mb-1 text-sm font-medium text-gray-600">SNS</div>
              {sns.length ? (
                <ul className="list-inside list-disc rounded-md border border-gray-200 bg-[var(--color-primary-20)] p-3 text-sm">
                  {sns.map((s, i) => (
                    <li key={`${s.platform}-${i}`}>{s.platform} — {s.handle}</li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-md border border-gray-200 bg-[var(--color-primary-20)] px-4 py-3 text-gray-400">
                  등록된 SNS가 없습니다.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">작가명</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="작가명을 입력해주세요."
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-3"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">소개글</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="작가 자신을 소개하는 글을 작성해주세요."
                rows={3}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-3"
              />
            </div>

            <div className="md:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium">SNS</label>
                <button
                  type="button"
                  className="text-sm text-[var(--color-primary)]"
                  onClick={addSns}
                >
                  + 추가
                </button>
              </div>
              <div className="space-y-2">
                {sns.length === 0 && (
                  <div className="rounded-md border border-dashed border-gray-300 p-3 text-sm text-gray-500">
                    SNS 계정을 추가해주세요.
                  </div>
                )}
                {sns.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-[160px_1fr_auto] items-center gap-2">
                    <input
                      type="text"
                      placeholder="플랫폼 (Instagram, YouTube 등)"
                      value={item.platform}
                      onChange={(e) => updateSns(idx, 'platform', e.target.value)}
                      className="rounded-md border border-gray-300 bg-white px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="핸들 (@nickname)"
                      value={item.handle}
                      onChange={(e) => updateSns(idx, 'handle', e.target.value)}
                      className="rounded-md border border-gray-300 bg-white px-3 py-2"
                    />
                    <button
                      type="button"
                      onClick={() => removeSns(idx)}
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ===== 사업자 섹션 ===== */}
      <section className="mb-10 rounded-xl border border-[var(--color-gray-200)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">사업자 정보</h2>
          <Badge label={businessVerified ? '인증됨' : '미인증'} tone={businessVerified ? 'green' : 'amber'} />
        </div>

        {!editing ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <ReadRow label="사업장 소재지" value={address} />
            </div>
            <ReadRow label="사업자등록번호" value={businessRegistrationNo} />
            <ReadRow label="통신판매업신고번호" value={telemarketingReportNo} />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">사업장 소재지</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="사업장 소재지를 입력해주세요."
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">사업자등록번호</label>
              <input
                type="text"
                value={businessRegistrationNo}
                onChange={(e) => setBusinessRegistrationNo(e.target.value)}
                placeholder="숫자만 입력해주세요."
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">통신판매업신고번호</label>
              <input
                type="text"
                value={telemarketingReportNo}
                onChange={(e) => setTelemarketingReportNo(e.target.value)}
                placeholder="예: 2025-서울강남-00000"
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-3"
              />
            </div>
          </div>
        )}
      </section>

      {/* ===== 정산 계좌 섹션 ===== */}
      <section className="mb-10 rounded-xl border border-[var(--color-gray-200)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">정산 계좌</h2>
          <Badge
            label={
              payoutStatus === 'VERIFIED'
                ? '계좌 인증됨'
                : payoutStatus === 'REJECTED'
                ? '계좌 거절됨'
                : '인증 대기'
            }
            tone={payoutStatusTone[payoutStatus] ?? 'gray'}
          />
        </div>

        {!editing ? (
          <div className="grid gap-4 md:grid-cols-2">
            <ReadRow label="은행" value={BANKS.find(b => b.code === bankCode)?.name || ''} />
            <ReadRow label="예금주명" value={accountHolder} />
            <div className="md:col-span-2">
              <ReadRow label="계좌번호(마스킹)" value={accountMasked} />
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">은행</label>
              <select
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-3"
              >
                <option value="">은행 선택</option>
                {BANKS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">예금주명</label>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-3"
                placeholder="예금주명을 입력해주세요."
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text.sm font-medium">계좌번호(마스킹)</label>
              <input
                type="text"
                value={accountMasked}
                onChange={(e) => setAccountMasked(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-3"
                placeholder="****-****-123456"
              />
              <p className="mt-1 text-xs text-gray-500">
                ※ 실제 계좌 인증/저장 API 연결 후 마스킹 규칙 적용
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 하단 액션 — 보기 모드: 좌측 '작가 탈퇴', 편집 모드: 우측 '취소/저장' */}
<div className="mt-6 flex justify-between gap-3">
  {/* 보기 모드일 때만 표시 */}
  {!editing ? (
    <button
      className="rounded-md bg-gray-400 px-6 py-3 font-medium text-white hover:bg-gray-500 disabled:opacity-50"
      onClick={() => console.log('작가 탈퇴')}
    >
      작가 탈퇴
    </button>
  ) : (
    <span /> // 편집 모드에서는 왼쪽 비워두기
  )}

</div>
    </div>
  );
}
