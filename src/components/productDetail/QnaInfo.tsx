'use client';

import { useEffect, useState } from "react";
import NoticeEditor from "../editor/NoticeEditor";
import X from "@/assets/icon/x.svg";
import Paperclip from '@/assets/icon/paperclip2.svg';
import React from "react";
import { fetchProductQnaDetail, ProductQnaDetail } from "@/services/qna";
import CategoryBtn from "./QnaCategoryBtn";

// Q&A 목록 조회 타입 & API

export type ProductQnaItem = {
  id: number;
  qnaCategory: string;
  qnaTitle: string;
  qnaDescription: string;
  authorName: string;
  createDate: string;
  views: number;
  qnaImages?: string; // JSON 문자열
};

export type ProductQnaListResponse = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  qnaList: ProductQnaItem[];
};

async function fetchProductQnaList(
  productUuid: string,
  params?: { page?: number; size?: number; qnaCategory?: string },
) {
  const query = new URLSearchParams({
    page: String(params?.page ?? 1),
    size: String(params?.size ?? 10),
    ...(params?.qnaCategory ? { qnaCategory: params.qnaCategory } : {}),
  });

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/qna/${productUuid}/list?${query}`,
    { credentials: 'include' },
  );

  if (!res.ok) throw new Error('Q&A 목록 조회 실패');

  const json = await res.json();

  // ✅ 다양한 응답 구조 안전 처리
  const result =
    json?.data?.qnaList ??
    json?.qnaList ??
    [];

  return Array.isArray(result) ? result : [];
}

// Q&A 등록 API
type S3FileRequest = {
  url: string;
  type: 'ADDITIONAL';
  s3Key: string;
  originalFileName: string;
};

type ProductQnaCreateRequest = {
  qnaCategory: string;
  qnaTitle: string;
  qnaDescription: string;
  qnaImages?: S3FileRequest[] | null;
};

async function createProductQna(productUuid: string, body: ProductQnaCreateRequest) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/qna/${productUuid}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    },
  );

  const json = await res.json();
  if (!res.ok) throw new Error(json.msg || '상품 Q&A 등록 실패');
  return json;
}


// QnaInfo 
export const qnaCategories = [
  { id: "all", label: "전체" },
  { id: "delivery", label: "배송" },
  { id: "stock", label: "입고/재입고" },
  { id: "exchange", label: "교환/환불" },
  { id: "etc", label: "품질/불량" },
];

type Props = {
  productUuid?: string;
};

export default function QnaInfo({ productUuid }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [editorValue, setEditorValue] = useState("");
  const [title, setTitle] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  // Q&A 목록 상태
  const [qnaList, setQnaList] = useState<ProductQnaItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedQna, setSelectedQna] = useState<ProductQnaDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string>('전체');

  const handleRowClick = async (id: number) => {
  if (openId === String(id)) {
    // 이미 열려 있다면 닫기
    setOpenId(null);
    setSelectedQna(null);
    return;
  }

  if (!productUuid) return;
  try {
    setDetailLoading(true);

    // 조회수 +1 (임시)
    setQnaList((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, views: (item.views ?? 1) + 1 }
          : item
      )
    );

    // 상세 조회
    const detail = await fetchProductQnaDetail(productUuid, id);
    setSelectedQna(detail);
    setOpenId(String(id));
  } catch (e) {
    console.error('[QnaInfo] 상세 조회 실패:', e);
  } finally {
    setDetailLoading(false);
  }
};

  // Q&A 목록 조회 api
  useEffect(() => {
  if (!productUuid) return;
  const loadQna = async () => {
    setLoading(true);
    try {
      const categoryParam =
        selectedCategory === '전체' ? undefined : selectedCategory;
      const data = await fetchProductQnaList(productUuid, {
        qnaCategory: categoryParam,
      });
      setQnaList(
        data.map((item) => ({
          ...item,
          views: item.views ?? 1,
        }))
      );
    } catch (e) {
      console.error('[QnaInfo] 목록 조회 실패:', e);
    } finally {
      setLoading(false);
    }
  };
  loadQna();
}, [productUuid, selectedCategory]);


  // 스크롤 방지 (모달 오픈 시)
  useEffect(() => {
    if (!openModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev };
  }, [openModal]);

  return (
    <section>
      <h3 className="font-semibold pt-12">상품 Q&A</h3>
      <div className="flex items-center justify-between pt-6">
        <CategoryBtn 
          items={qnaCategories}
          onSelect={(label) => setSelectedCategory(label)}
        />
        <button 
          className="bg-primary rounded-lg px-4 py-2.5 text-white font-semibold border cursor-pointer transition hover:bg-white hover:border-primary hover:text-primary"
          onClick={() => setOpenModal(true)}
        >
          Q&A 작성
        </button>
      </div>

      {/* 목록 */}
      <div className="mt-11 px-3 py-2">
        {loading ? (
          <div className="py-10 text-center text-gray-500">로딩 중...</div>
        ) : qnaList?.length === 0 ? (
          <div className="py-10 text-center text-gray-400">등록된 Q&A가 없습니다.</div>
        ) : (
          <table className="w-full text-black font-medium text-left">
            <thead className="border-y border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-4 text-center">글번호</th>
                <th className="px-4 py-4 text-center">카테고리</th>
                <th className="px-4 py-4 text-center">제목</th>
                <th className="px-4 py-4 text-center">작성자</th>
                <th className="px-4 py-4 text-center">작성일</th>
                <th className="px-4 py-4 text-center">조회수</th>
              </tr>
            </thead>
            <tbody>
              {qnaList.map((item) => (
                <React.Fragment key={item.id}>
                  <tr
                    onClick={() => handleRowClick(item.id)}
                    className="cursor-pointer hover:bg-gray-50 text-sm"
                  >
                    <td className="px-8 py-4 text-center">{item.id}</td>
                    <td className="px-8 py-4 text-center">{item.qnaCategory}</td>
                    <td className="px-8 py-4 text-center">{item.qnaTitle}</td>
                    <td className="px-8 py-4 text-center">{item.authorName}</td>
                    <td className="px-8 py-4 text-center">{item.createDate}</td>
                    <td className="px-8 py-4 text-center">{item.views}</td>
                  </tr>

                  {openId === String(item.id) && (
  <tr className="bg-primary-20 w-full">
    <td colSpan={6}>
      <div className="px-8 py-4 text-sm">
        {detailLoading ? (
          <div className="text-gray-400 py-4">로딩 중...</div>
        ) : selectedQna ? (
          <>
            <div className="bg-tertiary-20 w-[50px] font-bold text-tertiary text-center mb-2">
              내용
            </div>
            <p>{selectedQna.qnaDescription}</p>
            {selectedQna.qnaImages && selectedQna.qnaImages.length > 0 && (
              <div className="pt-4 flex flex-wrap gap-2">
                {selectedQna.qnaImages.map((img) => (
                  <img
                    key={img.s3Key}
                    src={img.url}
                    alt={img.originalFileName}
                    className="w-24 h-24 object-cover rounded"
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-gray-400 py-4">내용을 불러올 수 없습니다.</div>
            )}
          </div>
        </td>
      </tr>
    )}

                  </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Q&A 작성 모달창 */}
      {openModal && (
        <div 
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50"
          onClick={() => setOpenModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-[700px] max-w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Q&A 작성</h2>
              <button className="cursor-pointer rounded transition hover:bg-black/5 p-2" onClick={() => setOpenModal(false)}>
                <X width={16} height={16} />
              </button>
            </div>
            <hr />

            {/* 카테고리 */}
            <label className="flex items-center my-3 gap-6">
              <span className="shrink-0 whitespace-nowrap text-sm">카테고리</span>
              <select className="rounded border border-[var(--color-gray-200)] py-1 text-sm">
                <option>전체</option>
                <option>배송</option>
                <option>입고/재입고</option>
                <option>교환/환불</option>
                <option>품질/불량</option>
              </select>
            </label>
            <hr />

            {/* 제목 */}
            <label className="flex items-center py-2 gap-3">
              <span className="shrink-0 whitespace-nowrap text-sm">제목</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 rounded border border-[var(--color-gray-200)] px-3 py-1 text-sm"
              />
            </label>
            <hr />

            {/* 내용 */}
<div className="flex flex-col">
  <span className="text-sm py-2">내용</span>
  <NoticeEditor
    value={editorValue}
    onChange={setEditorValue}
    onUploadImage={async (file) => {
  try {
    const formData = new FormData();
    formData.append('files', file);
    formData.append('types', 'ADDITIONAL');

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/description-images`,
      {
        method: 'POST',
        body: formData,
        credentials: 'include',
      }
    );

    if (!res.ok) {
      console.error('본문 이미지 업로드 실패:', res.status);
      throw new Error('이미지 업로드 실패');
    }

    const json = await res.json();
    // { resultCode: "200", msg: "이미지 업로드 성공", data: [ { fileUrl: "..." } ] }
    const uploadedUrl =
      json?.data?.[0]?.fileUrl ??
      json?.data?.[0]?.url ?? // 혹시라도 url 필드가 있을 수도 있으니 백업
      '';

    if (!uploadedUrl) {
      console.error('서버 응답:', json);
      throw new Error('업로드 URL 누락');
    }

    // 반환된 URL -> 에디터 자동 삽입
    return uploadedUrl;
  } catch (e) {
    console.error('[NoticeEditor] 이미지 업로드 실패:', e);
    alert('이미지 업로드 중 오류가 발생했습니다.');
    return '';
  }
}}
  />
</div>


            {/* 첨부파일 */}
            <div className="my-[13px] flex items-center gap-3">
              <div className="flex items-center gap-0.5">
                <span className="shrink-0 text-sm">첨부파일</span>
                <Paperclip className="block size-4 overflow-visible text-[var(--color-gray-200)] shrink-0" />
              </div>
              <div className="relative flex-1">
                <input
                  id="fileInput"
                  type="file"
                  multiple
                  className="sr-only"
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                />
                <input
                  type="text"
                  readOnly
                  value={
                    files.length === 0
                      ? ''
                      : files.length === 1
                        ? files[0].name
                        : `${files[0].name} 외 ${files.length - 1}개`
                  }
                  placeholder="파일을 선택하세요"
                  className="w-full rounded border border-[var(--color-gray-200)] px-3 py-2 pr-24 leading-none text-sm"
                  onClick={() => document.getElementById('fileInput')?.click()}
                />
                {files.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setFiles([])}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-[var(--color-primary)] px-3 py-1 text-sm leading-none transition hover:bg-primary-20"
                  >
                    파일 삭제
                  </button>
                ) : (
                  <label
                    htmlFor="fileInput"
                    className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded border border-[var(--color-primary)] px-3 py-1 text-sm leading-none transition hover:bg-primary-20"
                  >
                    파일 선택
                  </label>
                )}
              </div>
            </div>

            {/* 작성버튼 */}
<div className="flex justify-end gap-2 mt-4">
  <button
    onClick={() => setOpenModal(false)}
    className="px-3 py-2 rounded-md border border-primary text-primary font-semibold text-sm cursor-pointer"
  >
    작성취소
  </button>

  <button
    onClick={async () => {
      if (!productUuid) return alert('상품 정보가 없습니다.');
      if (!title.trim() || !editorValue.trim()) {
        alert('제목과 내용을 입력해주세요.');
        return;
      }

      try {
        let uploadedImages: S3FileRequest[] = [];

        /* 1️첨부파일 업로드 */
        if (files.length > 0) {
          const formData = new FormData();

          files.forEach((file) => formData.append('files', file));
          // 모든 파일의 타입 : "ADDITIONAL" 로 전달
          files.forEach(() => formData.append('types', 'ADDITIONAL'));

          const uploadRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/images`,
            {
              method: 'POST',
              body: formData,
              credentials: 'include',
            }
          );

          if (!uploadRes.ok) {
            console.error('첨부파일 업로드 실패:', uploadRes.status);
            throw new Error('첨부파일 업로드 실패');
          }

          const uploadJson = await uploadRes.json();

          // 응답 구조: { resultCode, msg, data: [{ url, type, s3Key, originalFileName }, ...] }
          uploadedImages = uploadJson?.data ?? [];
        }

        // Q&A 등록 데이터 구성 */
        const newQna = {
          qnaCategory: '배송', 
          qnaTitle: title,
          qnaDescription: editorValue, // 에디터에서 이미 <img src="..."> 포함된 HTML 문자열
          qnaImages: uploadedImages.length ? uploadedImages : null,
        };

        // 3️ Q&A 등록 API
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/qna/${productUuid}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newQna),
            credentials: 'include',
          }
        );

        const json = await res.json();
        if (!res.ok) throw new Error(json?.msg || '상품 Q&A 등록 실패');

        alert('Q&A가 등록되었습니다.');

        /* 목록 다시 불러오기 */
        const updatedList = await fetchProductQnaList(productUuid);
        setQnaList(updatedList);

        /* q&a폼 초기화 */
        setOpenModal(false);
        setTitle('');
        setEditorValue('');
        setFiles([]);
      } catch (e) {
        console.error('[QnaInfo] 등록 중 오류:', e);
        alert('Q&A 등록 중 오류가 발생했습니다.');
      }
    }}
    className="px-3 py-2 rounded-md border border-primary bg-primary text-white font-semibold text-sm cursor-pointer"
  >
    작성하기
  </button>
</div>
          </div>
        </div>
      )}
    </section>
  );
}
