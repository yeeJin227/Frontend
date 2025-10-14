'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import NoticeEditor from '@/components/editor/NoticeEditor';
import Button from '@/components/Button';

import Paperclip from '@/assets/icon/paperclip2.svg';

import { useToast } from '@/components/ToastProvider';
import { createInquiry, INQUIRY_CATEGORY_OPTIONS, type InquiryCategory } from '@/services/inquiries';
import { useAuthStore } from '@/stores/authStore';

export default function ContactCreatePage() {
  const router = useRouter();
  const toast = useToast();
  const accessToken = useAuthStore((store) => store.accessToken);
  const [category, setCategory] = useState<InquiryCategory>('DELIVERY');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [html, setHtml] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSecret, setIsSecret] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fileSummary = useMemo(() => {
    if (files.length === 0) return '';
    if (files.length === 1) return files[0].name;
    return `${files[0].name} 외 ${files.length - 1}개`;
  }, [files]);
  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = Array.from(incoming);
    if (next.length > 3) {
      toast.error('첨부파일은 최대 3개까지 업로드할 수 있습니다.');
      setFiles(next.slice(0, 3));
      return;
    }
    setFiles(next);
  };
  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('제목을 입력해 주세요.');
      return;
    }
    if (!content.trim()) {
      toast.error('내용을 입력해 주세요.');
      return;
    }
    if (!accessToken) {
      toast.error('로그인 후 이용해 주세요.');
      router.push('/login');
      return;
    }
    setSubmitting(true);
    try {
      const uploadedFiles = await Promise.all(files.map((file) => uploadToS3(file)));
      await createInquiry(
        {
          category,
          title: title.trim(),
          content,
          isSecret,
          files: uploadedFiles,
        },
        { accessToken },
      );
      toast.success('문의가 등록되었습니다.');
      router.replace('/help/contact');
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : '문의 등록에 실패했습니다.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <main className="mt-[94px] mb-4 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">문의하기</h1>
      <hr />
      
       <label className="flex items-center gap-4 text-sm">
        <span className="shrink-0">카테고리</span>
        <select
          className="w-48 rounded border border-[var(--color-gray-200)] px-3 py-2"
          value={category}
          onChange={(event) => setCategory(event.target.value as InquiryCategory)}
        >
          {INQUIRY_CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isSecret}
          onChange={(event) => setIsSecret(event.target.checked)}
          className="h-4 w-4 accent-[var(--color-primary)]"
        />
        <span>비공개 문의로 등록</span>
      </label>

      <hr />

      {/* 제목 */}
      <label className="flex items-center gap-6">
        <span className="shrink-0 whitespace-nowrap">제목</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="flex-1 rounded border border-[var(--color-gray-200)] px-3 py-2"
        />
      </label>
      <hr />
      {/* 에디터 */}
      <div className="flex flex-col gap-3">
        <span>내용</span>
        <NoticeEditor value={content} onChange={setContent} onUploadImage={uploadToS3} />
      </div>

      <hr />
      {/* 첨부파일 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-0.5 text-sm">
          <span className="shrink-0">첨부파일</span>
          <Paperclip className="size-4 shrink-0 text-[var(--color-gray-200)]" />
        </div>
        <div className="relative flex-1">
          <input
            id="fileInput"
            type="file"
            multiple
            className="sr-only"
            onChange={(event) => handleFiles(event.target.files)}
          />
          <input
            type="text"
            readOnly
            value={fileSummary}
            placeholder="파일을 선택하세요 (최대 3개)"
            className="w-full rounded border border-[var(--color-gray-200)] px-3 py-2 pr-24 leading-none"
            onClick={() => document.getElementById('fileInput')?.click()}
          />
          {files.length > 0 ? (
            <button
              type="button"
              onClick={() => setFiles([])}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-[var(--color-primary)] px-3 py-1 text-sm leading-none"
            >
              파일 삭제
            </button>
          ) : (
            <label
              htmlFor="fileInput"
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded border border-[var(--color-primary)] px-3 py-1 text-sm leading-none"
            >
              파일 선택
            </label>
          )}
        </div>
      </div>

      <div className="mt-6 flex self-end gap-2">
      <Button variant="outline" onClick={() => router.back()} disabled={submitting}>
        작성취소
      </Button>
      <Button onClick={handleSubmit} isLoading={submitting} disabled={submitting}>
        작성하기
      </Button>
      </div>
    </main>
  );
}

// S3 프리사인드 URL 업로드
async function uploadToS3(file: File): Promise<string> {
 const res = await fetch('api/uploads/presign', {
  method: 'POST',
  body: JSON.stringify({filename: file.name, type: file.type }),
 });
 if (!res.ok) {
  throw new Error('파일 업로드 URL을 받지 못했습니다.');
 }
 const { url, key } = await res.json();

  await fetch(url, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
  const cdn = process.env.NEXT_PUBLIC_CDN ?? '';
  return cdn ? `${cdn}/${key}` : url;
}
