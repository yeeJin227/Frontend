'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import NoticeEditor from '@/components/editor/NoticeEditor';
import Button from '@/components/Button';
import Paperclip from '@/assets/icon/paperclip2.svg';
import { useToast } from '@/components/ToastProvider';
import {
  fetchInquiryDetail,
  updateInquiry,
  INQUIRY_CATEGORY_OPTIONS,
  type InquiryCategory,
} from '@/services/inquiries';
import { useAuthStore } from '@/stores/authStore';

type Props = {
  inquiryId: string;
};

type AttachmentState = {
  id: number;
  fileName: string;
  fileUrl: string;
  markedForDeletion: boolean;
};

export default function InquiryEditClient({ inquiryId }: Props) {
  const router = useRouter();
  const toast = useToast();
  const accessToken = useAuthStore((store) => store.accessToken);
  const role = useAuthStore((store) => store.role);
  const currentUser = useAuthStore((store) => store.userProfile?.nickname ?? store.userProfile?.email ?? '');

  const [category, setCategory] = useState<InquiryCategory>('DELIVERY');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSecret, setIsSecret] = useState(false);
  const [existingFiles, setExistingFiles] = useState<AttachmentState[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchInquiryDetail(inquiryId)
      .then((data) => {
        if (cancelled) return;
        setCategory((data.category as InquiryCategory) ?? 'DELIVERY');
        setTitle(data.title);
        setContent(data.content);
        setIsSecret(Boolean(data.isSecret));
        setExistingFiles(
          data.documents.map((doc) => ({
            id: doc.id,
            fileName: doc.fileName,
            fileUrl: doc.fileUrl,
            markedForDeletion: false,
          })),
        );
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : '문의 정보를 불러오지 못했습니다.';
        setError(message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [inquiryId]);

  const fileSummary = useMemo(() => {
    const activeCount = existingFiles.filter((file) => !file.markedForDeletion).length;
    const total = activeCount + newFiles.length;
    if (total === 0) return '';
    if (newFiles.length === 0 && activeCount > 0) {
      return `${activeCount}개의 기존 파일`;
    }
    if (newFiles.length === 1 && activeCount === 0) return newFiles[0].name;
    if (newFiles.length === 1 && activeCount > 0) {
      return `${newFiles[0].name} 외 ${activeCount}개`;
    }
    return `${total}개의 파일`;
  }, [existingFiles, newFiles]);

  const handleNewFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const activeExisting = existingFiles.filter((file) => !file.markedForDeletion).length;
    const next = Array.from(incoming);
    if (activeExisting + next.length > 3) {
      toast.error('첨부파일은 최대 3개까지 업로드할 수 있습니다.');
      setNewFiles(next.slice(0, Math.max(0, 3 - activeExisting)));
      return;
    }
    setNewFiles(next);
  };

  const handleSubmit = async () => {
    if (!accessToken) {
      toast.error('로그인 후 이용해 주세요.');
      router.push('/login');
      return;
    }
    if (!title.trim()) {
      toast.error('제목을 입력해 주세요.');
      return;
    }
    if (!content.trim()) {
      toast.error('내용을 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const uploadedFiles = await Promise.all(newFiles.map((file) => uploadToS3(file)));
      const deleteFileIds = existingFiles
        .filter((file) => file.markedForDeletion)
        .map((file) => file.id);

      await updateInquiry(
        inquiryId,
        {
          category,
          title: title.trim(),
          content,
          isSecret,
          files: uploadedFiles,
          deleteFileIds,
        },
        { accessToken },
      );

      toast.success('문의가 수정되었습니다.');
      router.replace(`/help/contact/${inquiryId}`);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : '문의 수정에 실패했습니다.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="mt-[94px] flex flex-col gap-4">
        <div className="h-10 w-48 animate-pulse rounded bg-[var(--color-gray-100)]" />
        <div className="h-6 w-full max-w-xl animate-pulse rounded bg-[var(--color-gray-100)]" />
        <div className="h-64 w-full animate-pulse rounded bg-[var(--color-gray-100)]" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="mt-[94px] flex flex-col items-center gap-4 text-center">
        <h1 className="text-xl font-semibold">문의 정보를 불러오지 못했습니다.</h1>
        <p className="text-sm text-[var(--color-gray-600)]">{error}</p>
        <Button onClick={() => router.replace(`/help/contact/${inquiryId}`)}>돌아가기</Button>
      </main>
    );
  }

  const canManage = Boolean(accessToken) && (role === 'ADMIN' || Boolean(currentUser));
  if (!canManage) {
    return (
      <main className="mt-[94px] flex flex-col items-center gap-4 text-center">
        <h1 className="text-xl font-semibold">권한이 없습니다.</h1>
        <Button onClick={() => router.replace(`/help/contact/${inquiryId}`)}>돌아가기</Button>
      </main>
    );
  }

  return (
    <main className="mt-[94px] mb-10 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">문의 수정</h1>
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

      <label className="flex items-center gap-6">
        <span className="shrink-0 whitespace-nowrap">제목</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="flex-1 rounded border border-[var(--color-gray-200)] px-3 py-2"
          placeholder="제목을 입력해 주세요"
        />
      </label>

      <hr />

      <div className="flex flex-col gap-3">
        <span>내용</span>
        <NoticeEditor value={content} onChange={setContent} onUploadImage={uploadToS3} />
      </div>

      <hr />

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-0.5 text-sm">
          <span className="shrink-0">첨부파일</span>
          <Paperclip className="size-4 shrink-0 text-[var(--color-gray-200)]" />
        </div>

        {existingFiles.length > 0 && (
          <ul className="flex flex-col gap-2">
            {existingFiles.map((file) => (
              <li key={file.id} className="flex items-center justify-between rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm">
                <a
                  href={file.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-[var(--color-primary)] underline-offset-2 hover:underline"
                >
                  {file.fileName}
                </a>
                <label className="flex items-center gap-2 text-xs text-[var(--color-gray-600)]">
                  <input
                    type="checkbox"
                    checked={file.markedForDeletion}
                    onChange={(event) =>
                      setExistingFiles((prev) =>
                        prev.map((item) =>
                          item.id === file.id ? { ...item, markedForDeletion: event.target.checked } : item,
                        ),
                      )
                    }
                  />
                  삭제
                </label>
              </li>
            ))}
          </ul>
        )}

        <div className="relative flex-1">
          <input
            id="fileInput"
            type="file"
            multiple
            className="sr-only"
            onChange={(event) => handleNewFiles(event.target.files)}
          />
          <input
            type="text"
            readOnly
            value={fileSummary}
            placeholder="파일을 선택하세요 (최대 3개)"
            className="w-full rounded border border-[var(--color-gray-200)] px-3 py-2 pr-24 leading-none"
            onClick={() => document.getElementById('fileInput')?.click()}
          />
          {newFiles.length > 0 ? (
            <button
              type="button"
              onClick={() => setNewFiles([])}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-[var(--color-primary)] px-3 py-1 text-sm leading-none"
            >
              새 파일 삭제
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
          취소
        </Button>
        <Button onClick={handleSubmit} isLoading={submitting} disabled={submitting}>
          수정 완료
        </Button>
      </div>
    </main>
  );
}

async function uploadToS3(file: File): Promise<string> {
  const res = await fetch('/api/uploads/presign', {
    method: 'POST',
    body: JSON.stringify({ filename: file.name, type: file.type }),
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
