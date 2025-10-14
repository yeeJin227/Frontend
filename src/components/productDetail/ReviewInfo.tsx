
'use client';

import { useEffect, useRef, useState } from 'react';
import TextReviewCard from './TextReviewCard';
import PhotoReviewCard from './PhotoReviewCard';

import X from '@/assets/icon/x.svg';
import Star from '@/assets/icon/star.svg';
import LineStar from '@/assets/icon/linestar.svg';

import {
  fetchReviewStats,
  fetchReviews,
  toggleReviewLike, 
  uploadReviewImages,
  createReview,
  type ReviewDto,
  type ReviewTypeParam,
} from '@/services/reviews';
import type { ReviewStats } from '@/types/review';
import { useAuthStore } from '@/stores/authStore';

type Mode = 'photo' | 'text';
type ModalMode = 'create' | 'detail';

// UI
type Review = {
  id: number;
  type: Mode;
  content: string;
  image?: string;
  hashtags?: string[];
  rating: number;
};

export default function ReviewInfo({ productId }: { productId?: number }) {
  const [mode, setMode] = useState<Mode>('photo');
  const [modalMode, setModalMode] = useState<ModalMode>('create');

  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [editorValue, setEditorValue] = useState('');
  const [reviewUrl, setReviewUrl] = useState<string>('/defaultReview.svg');
  const [reviewFile, setReviewFile] = useState<File | null>(null);
  const [hashtagsInput, setHashtagsInput] = useState('');
  const [rating, setRating] = useState<number>(0);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [_likedIds, setLikedIds] = useState<Set<number>>(new Set());

  const [_stats, setStats] = useState<ReviewStats | null>(null);
  const [_statsError, setStatsError] = useState<string | null>(null);
  const [_statsLoading, setStatsLoading] = useState(false);

  const [_listLoading, setListLoading] = useState(false);
  const [_listError, setListError] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const accessToken = useAuthStore((s) => s.accessToken);

  const canSubmit = editorValue.trim().length >= 10 && rating > 0;

  const parseHashtags = (raw: string) =>
    raw
      .split(/[\s,]+/)
      .map((t) => t.replace(/^#/, '').trim())
      .filter(Boolean)
      .map((t) => `#${t}`)
      .slice(0, 3);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedReview(null);
    setEditorValue('');
    setReviewUrl('/defaultReview.svg');
    setReviewFile(null); // 초기화
    setHashtagsInput('');
    setRating(0);
    setOpenModal(true);
  };

  const openDetailModal = (review: Review) => {
    setModalMode('detail');
    setSelectedReview(review);
    setEditorValue(review.content);
    setReviewUrl(review.image ?? '/defaultReview.svg');
    setReviewFile(null); // 상세 모드에서는 업로드 없음
    setRating(review.rating);
    setOpenModal(true);
  };

  // 작성하기 → 이미지 업로드(+없으면 건너뜀) → 리뷰 생성
  const handleSubmit = async () => {
    if (!productId) return; // 안전장치
    if (!canSubmit) return;

    try {
      // 1) 이미지 업로드: 선택된 파일이 있을 때만
      let imagesPayload:
        | { url: string; type: 'MAIN' | 'ADDITIONAL' | 'THUMBNAIL' | 'DOCUMENT'; s3Key: string; originalFileName: string }[]
        | undefined;

      if (reviewFile) {
        const uploaded = await uploadReviewImages([reviewFile], ['MAIN'], { accessToken: accessToken ?? undefined });
        // services가 배열을 반환 ( [{ url, type, s3Key, originalFileName }] )
        imagesPayload = uploaded?.length ? uploaded : undefined;
      }

      // 2) 해시태그: 서버에는 # 제거하고 보냄
      const tagsForServer = parseHashtags(hashtagsInput).map((t) => t.replace(/^#/, ''));

      // 3) 리뷰 생성
      const dto = await createReview(
        {
          productId,
          rating,
          content: editorValue.trim(),
          images: imagesPayload,
          hashtags: tagsForServer,
          productOption: undefined,
        },
        { accessToken: accessToken ?? undefined },
      );

      // 4) UI용으로 매핑 후 목록에 추가(상단)
      const justCreated: Review = {
        id: dto.reviewId,
        type: dto.isPhotoReview ? 'photo' : 'text',
        content: dto.content ?? '',
        image: dto.isPhotoReview ? dto.images?.[0]?.imageUrl ?? undefined : undefined,
        hashtags: (dto.hashtags ?? []).map((t) => (t.startsWith('#') ? t : `#${t}`)),
        rating: Number(dto.rating ?? 0),
      };

      setReviews((prev) => [justCreated, ...prev]);
      setMode(justCreated.type); // 방금 작성한 타입 탭
      // 폼 초기화 & 모달 닫기
      setEditorValue('');
      setReviewUrl('/defaultReview.svg');
      setReviewFile(null);
      setHashtagsInput('');
      setRating(0);
      setOpenModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  // 좋아요 토글 
  const toggleLikeOptimistic = async (reviewId: number, targetBtn?: HTMLElement) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(reviewId)) next.delete(reviewId);
      else next.add(reviewId);
      return next;
    });

    if (targetBtn) targetBtn.setAttribute('data-liked', 'true');

    try {
      await toggleReviewLike(reviewId, { accessToken: accessToken ?? undefined });
    } catch (e) {
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (next.has(reviewId)) next.delete(reviewId);
        else next.add(reviewId);
        return next;
      });
      if (targetBtn) targetBtn.removeAttribute('data-liked');
      console.error(e instanceof Error ? e.message : '좋아요 처리 실패');
    }
  };

  // 통계 호출
  useEffect(() => {
    let active = true;
    if (!productId) {
      console.warn('[ReviewInfo] productId가 없어 리뷰 통계를 건너뜁니다.');
      return;
    }
    const run = async () => {
      try {
        setStatsLoading(true);
        setStatsError(null);
        const data = await fetchReviewStats(productId);
        if (!active) return;
        setStats(data);

        if (data.photoReviewCount > 0) setMode('photo');
        else if (data.generalReviewCount > 0) setMode('text');
      } catch (err) {
        if (!active) return;
        const msg = err instanceof Error ? err.message : '리뷰 통계를 불러오지 못했습니다.';
        setStatsError(msg);
      } finally {
        if (active) setStatsLoading(false);
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [productId]);

  // 목록 호출
  useEffect(() => {
    let active = true;
    if (!productId) {
      setReviews([]);
      return;
    }
    const run = async () => {
      try {
        setListLoading(true);
        setListError(null);

        const reviewType: ReviewTypeParam = mode === 'photo' ? 'PHOTO' : mode === 'text' ? 'GENERAL' : 'ALL';

        const list = await fetchReviews({
          productId,
          reviewType,
          page: 1,
          size: 10,
        });

        if (!active) return;

        const mapped: Review[] = (list.reviews ?? []).map((r: ReviewDto) => ({
          id: r.reviewId,
          type: r.isPhotoReview ? 'photo' : 'text',
          content: r.content ?? '',
          image: r.isPhotoReview ? r.images?.[0]?.imageUrl ?? undefined : undefined,
          hashtags: (r.hashtags ?? []).map((t) => (t.startsWith('#') ? t : `#${t}`)),
          rating: Number(r.rating ?? 0),
        }));

        setReviews(mapped);
      } catch (err) {
        if (!active) return;
        const msg = err instanceof Error ? err.message : '리뷰 목록을 불러오지 못했습니다.';
        setListError(msg);
        setReviews([]);
      } finally {
        if (active) setListLoading(false);
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [productId, mode]);

  useEffect(() => {
    if (!openModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [openModal]);

  // 카드 클릭에서 하트(data-like) 처리
  const handleCardClick = (review: Review) => (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const likeBtn = target.closest('[data-like]') as HTMLElement | null;
    if (likeBtn) {
      e.preventDefault();
      e.stopPropagation();
      void toggleLikeOptimistic(review.id, likeBtn);
      return;
    }
    if (review.type === 'photo') {
      openDetailModal(review);
    }
  };

  return (
    <section>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-6">
          <h3 className="font-semibold py-12">리뷰</h3>

          <div className="flex items-center gap-5 text-gray-500 font-bold text-sm">
            <label className="cursor-pointer">
              <input
                type="radio"
                name="reviewType"
                value="photo"
                checked={mode === 'photo'}
                onChange={() => setMode('photo')}
                className="accent-primary mr-2 cursor-pointer"
              />
              <span>포토리뷰</span>
            </label>

            <label className="cursor-pointer">
              <input
                type="radio"
                name="reviewType"
                value="text"
                checked={mode === 'text'}
                onChange={() => setMode('text')}
                className="accent-primary mr-2 cursor-pointer"
              />
              <span>일반리뷰</span>
            </label>
          </div>
        </div>

        <div>
          <button
            className="bg-primary rounded-lg px-4 py-2.5 text-white font-semibold border cursor-pointer transition hover:bg-white hover:border-primary hover:text-primary"
            onClick={openCreateModal}
          >
            리뷰 작성
          </button>
        </div>
      </div>

      {mode === 'photo' ? (
        <div className="grid grid-cols-4 gap-6">
          {reviews
            .filter((review) => review.type === 'photo')
            .map((review) => (
              <div key={review.id} data-review-id={review.id} onClick={handleCardClick(review)} className="max-w-[300px]">
                <PhotoReviewCard
                  image={review.image!}
                  content={review.content}
                  hashtags={review.hashtags}
                  rating={review.rating}
                  onClick={() => openDetailModal(review)}
                />
              </div>
            ))}
        </div>
      ) : (
        <div>
          {reviews
            .filter((review) => review.type === 'text')
            .map((review) => (
              <div key={review.id} data-review-id={review.id} onClick={handleCardClick(review)}>
                <TextReviewCard content={review.content} hashtags={review.hashtags} rating={review.rating} />
              </div>
            ))}
        </div>
      )}

      {openModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50" onClick={() => setOpenModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-[764px] max-w-full" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <button className="absolute right-2 top-2 p-2 rounded cursor-pointer transition hover:bg-black/5" onClick={() => setOpenModal(false)}>
                <X width={18} height={18} />
              </button>
            </div>

            <div className="grid grid-cols-2">
              <aside onClick={modalMode === 'create' ? () => fileRef.current?.click() : undefined}>
                <img
                  src={reviewUrl}
                  alt="리뷰 이미지"
                  className={`w-full h-full object-cover rounded-bl-2xl rounded-tl-2xl ${modalMode === 'create' ? 'cursor-pointer' : ''}`}
                />
                {modalMode === 'create' && (
                  <input
                    id="review-photo"
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setReviewFile(file); 
                      setReviewUrl(URL.createObjectURL(file)); // 미리보기
                      e.currentTarget.value = '';
                    }}
                  />
                )}
              </aside>

              <section className="flex flex-col">
                <div className="h-3/4 rounded-2xl overflow-hidden">
                  <textarea
                    value={editorValue}
                    onChange={(e) => setEditorValue(e.target.value)}
                    placeholder="리뷰를 남겨주세요 (10자 이상)"
                    readOnly={modalMode === 'detail'}
                    className="w-full h-full resize-none px-8 py-6 text-sm leading-6 focus:outline-none scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                  />
                </div>

                <div className="flex flex-col px-8 py-4 text-sm gap-4 text-gray-400">
                  {modalMode === 'create' ? (
                    <input
                      type="text"
                      value={hashtagsInput}
                      placeholder="#최대 3개"
                      onChange={(e) => {
                        const raw = e.target.value;
                        const tags = raw.split(/[\s,]+/).filter(Boolean);
                        if (tags.length <= 3) setHashtagsInput(raw);
                        else setHashtagsInput(tags.slice(0, 3).join(' '));
                      }}
                    />
                  ) : (
                    <div>{(selectedReview?.hashtags ?? []).map((t, i) => <span key={i}>{t}</span>)}</div>
                  )}

                  <div className="flex">
                    {modalMode === 'create' ? (
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} type="button" onClick={() => setRating(n)}>
                            {rating >= n ? <Star /> : <LineStar />}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => <span key={n}>{(selectedReview?.rating ?? 0) >= n ? <Star /> : <LineStar />}</span>)}
                      </div>
                    )}
                  </div>
                </div>

                {modalMode === 'create' && (
                  <div className="flex flex-col justify-center items-center gap-2 py-4">
                    <button
                      onClick={() => {
                        if (!canSubmit) return;
                        void handleSubmit();
                      }}
                      disabled={!canSubmit}
                      className={`px-8 py-2 rounded-lg font-semibold text-sm cursor-pointer ${
                        canSubmit ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400 transition hover:bg-primary-20'
                      }`}
                    >
                      작성하기
                    </button>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
