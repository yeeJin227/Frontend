'use client';

import { useState, useEffect } from 'react';

type Props = {
  open: boolean;
  mode?: 'create' | 'edit';
  onClose: () => void;
};

export default function FundingCreateModal({ open, mode = 'create', onClose }: Props) {
  if (!open) return null;

  // --- 상태 관리 ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [targetAmount, setTargetAmount] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 이미지 미리보기
  useEffect(() => {
    if (!imageFile) return setImagePreview(null);
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const handleClose = () => onClose();

  const handleSubmit = () => {
    // 실제 API 연결은 없음 (UI 전용)
    console.log({
      title,
      description,
      categoryId,
      imageUrl: imageFile?.name,
      targetAmount,
      price,
      stock,
      startDate,
      endDate,
    });
    onClose();
  };

  // 아이콘 (닫기용)
  const IconX = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M18.3 5.7 12 12m0 0-6.3 6.3M12 12l6.3 6.3M12 12 5.7 5.7"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl overflow-hidden shadow-xl w-[800px] max-w-[95vw] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 z-10 bg-white px-6 pt-5 pb-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {mode === 'edit' ? '펀딩 수정' : '새 펀딩 작성'}
            </h2>
            <button
              className="cursor-pointer rounded p-2 hover:bg-black/5"
              onClick={handleClose}
              aria-label="닫기"
            >
              <IconX />
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
          {/* 기본정보 */}
          <section className="space-y-4">
            <h3 className="text-base font-semibold">기본 정보</h3>
            <div className="space-y-3">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">펀딩 제목 *</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="펀딩 제목을 입력하세요"
                  maxLength={50}
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">펀딩 설명 *</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="펀딩 내용을 작성하세요"
                  className="rounded border border-gray-300 px-3 py-2 text-sm min-h-[120px]"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">카테고리 *</span>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">선택하세요</option>
                  <option value="1">문구/스티커</option>
                  <option value="2">키링/악세서리</option>
                  <option value="3">패브릭</option>
                </select>
              </label>
            </div>
          </section>

          <hr />

          {/* 대표 이미지 */}
          <section className="space-y-3">
            <h3 className="text-base font-semibold">대표 이미지 *</h3>
            <div>
              <label className="block cursor-pointer w-fit border border-primary px-3 py-2 rounded text-sm hover:bg-primary/10">
                이미지 선택
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setImageFile(file);
                    e.currentTarget.value = '';
                  }}
                />
              </label>

              {imagePreview && (
                <div className="mt-3 h-40 w-40 rounded overflow-hidden border bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </section>

          <hr />

          {/* 금액 / 재고 */}
          <section className="space-y-4">
            <h3 className="text-base font-semibold">금액 설정</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">가격 *</span>
                <input
                  type="number"
                  min={1}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value) || 0)}
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">목표 금액 *</span>
                <input
                  type="number"
                  min={1}
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(Number(e.target.value) || 0)}
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">재고 (선택)</span>
                <input
                  type="number"
                  min={0}
                  value={stock}
                  onChange={(e) => setStock(e.target.value ? Number(e.target.value) : '')}
                  placeholder="비워두면 무제한"
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
            </div>
          </section>

          <hr />

          {/* 기간 */}
          <section className="space-y-4">
            <h3 className="text-base font-semibold">펀딩 기간 설정</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">시작일 *</span>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">종료일 *</span>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
            </div>
          </section>
        </div>

        {/* 하단 버튼 */}
        <div className="sticky bottom-0 z-10 bg-white px-6 py-4 border-t flex justify-end gap-2">
          <button
            onClick={handleClose}
            className="px-3 py-2 rounded-md border border-primary text-primary text-sm font-semibold"
          >
            작성취소
          </button>
          <button
            onClick={handleSubmit}
            className="px-3 py-2 rounded-md border border-primary bg-primary text-white text-sm font-semibold"
          >
            {mode === 'edit' ? '수정하기' : '작성하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
