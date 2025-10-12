'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import NoticeEditor from '@/components/editor/NoticeEditor';
import Button from '@/components/Button';
import Paperclip from '@/assets/icon/paperclip2.svg';
import { fetchNoticeDetail, updateNotice, type NoticeDetail, type NoticeDocument } from '@/services/notices';
import { useToast } from '@/components/ToastProvider';
import { useAuthStore } from '@/stores/authStore';

type NoticeEditClientProps = {
  noticeId: string;
};

type AttachmentState = NoticeDocument & { markedForDeletion?: boolean };

export default function NoticeEditClient({ noticeId }: NoticeEditClientProps) {
  const router = useRouter();
  const toast = useToast();
  const { role, isHydrated } = useAuthStore((store) => ({ role: store.role, isHydrated: store.isHydrated }));

  const [notice, setNotice] = useState<NoticeDetail | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'important' | 'normal'>('normal');
  const [attachments, setAttachments] = useState<AttachmentState[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    fetchNoticeDetail(noticeId)
      .then((data) => {
        if (!mounted) return;
        setNotice(data);
        setTitle(data.title);
        setContent(data.content);
        setPriority(data.isImportant ? 'important' : 'normal');
        setAttachments(
          data.documents.map((doc) => ({
            ...doc,
            markedForDeletion: false,
          })),
        );
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : '공지사항을 불러오지 못했습니다.';
        setError(msg);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [noticeId]);

  useEffect(() => {
    if (!isHydrated) return;
    if (role !== 'ADMIN') {
      toast.error('관리자만 공지사항을 수정할 수 있습니다.');
      router.replace(`/help/notice/${noticeId}`);
    }
  }, [isHydrated, role, router, noticeId, toast]);

  const markedDeleteIds = useMemo(
    () => attachments.filter((file) => file.markedForDeletion).map((file) => file.id),
    [attachments],
  );

  const handleSubmit = async () => {
    if (!notice) return;
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
      await updateNotice(notice.id, {
        title: title.trim(),
        content,
        isImportant: priority === 'important',
        files: [],
        deleteFileIds: markedDeleteIds,
      });
      toast.success('공지사항을 수정했습니다.');
      router.replace(`/help/notice/${notice.id}`);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '공지사항 수정에 실패했습니다.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="mt-[94px] flex flex-col gap-4">
        <div className="h-10 w-48 animate-pulse rounded bg-[var(--color-gray-100)]" />
        <div className="h-6 w-full max-w-xl animate-pulse rounded bg-[var(--color-gray-100)]" />
        <div className="h-96 w-full animate-pulse rounded bg-[var(--color-gray-100)]" />
      </main>
    );
  }

  if (error || !notice) {
    return (
      <main className="mt-[94px] flex flex-col items-center gap-4 text-center">
        <h1 className="text-xl font-semibold">공지사항 정보를 불러오지 못했습니다.</h1>
        <p className="text-sm text-[var(--color-gray-600)]">{error}</p>
        <Button onClick={() => router.replace(`/help/notice/${noticeId}`)}>돌아가기</Button>
      </main>
    );
  }

  return (
    <main className="mt-[94px] mb-4 flex flex-col">
      <h1 className="mb-[30px] text-2xl font-bold">공지사항 수정</h1>
      <hr />

      <fieldset className="my-[13px] flex items-center gap-6">
        <span>중요도</span>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="priority"
            value="important"
            checked={priority === 'important'}
            onChange={() => setPriority('important')}
            className="h-4 w-4 accent-[var(--color-primary)]"
          />
          <span>중요</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="priority"
            value="normal"
            checked={priority === 'normal'}
            onChange={() => setPriority('normal')}
            className="h-4 w-4 accent-[var(--color-primary)]"
          />
          <span>일반</span>
        </label>
      </fieldset>
      <hr />

      <label className="my-[13px] flex items-center gap-6">
        <span className="shrink-0 whitespace-nowrap">제목</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 rounded border border-[var(--color-gray-200)] px-3 py-2"
          placeholder="제목을 입력해 주세요"
        />
      </label>
      <hr />

      <div className="my-[13px]">
        <span>내용</span>
        <div className="my-[13px]">
          <NoticeEditor value={content} onChange={setContent} onUploadImage={uploadToS3} />
        </div>
      </div>
      <hr />

      <div className="my-[13px] flex flex-col gap-3">
        <div className="flex items-center gap-0.5">
          <span className="shrink-0">첨부파일</span>
          <Paperclip className="size-4 shrink-0 text-[var(--color-gray-200)]" />
        </div>

        {attachments.length === 0 ? (
          <p className="text-sm text-[var(--color-gray-500)]">등록된 첨부파일이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {attachments.map((file) => (
              <li key={file.id} className="flex items-center justify-between gap-4 rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm">
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
                    checked={file.markedForDeletion ?? false}
                    onChange={(e) =>
                      setAttachments((prev) =>
                        prev.map((item) =>
                          item.id === file.id ? { ...item, markedForDeletion: e.target.checked } : item,
                        ),
                      )
                    }
                  />
                  삭제 예정
                </label>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-[var(--color-gray-500)]">
          첨부파일 추가 업로드는 추후 지원 예정입니다. 삭제할 파일에 체크한 뒤 저장하면 반영됩니다.
        </p>
      </div>

      <div className="mt-6 flex self-end gap-2">
        <Button variant="outline" onClick={() => router.back()} disabled={submitting}>
          취소
        </Button>
        <Button onClick={handleSubmit} isLoading={submitting}>
          수정 완료
        </Button>
      </div>
    </main>
  );
}

// S3 업로드 (에디터 이미지 전용)
async function uploadToS3(file: File): Promise<string> {
  const res = await fetch('/api/uploads/presign', {
    method: 'POST',
    body: JSON.stringify({ filename: file.name, type: file.type }),
  });
  if (!res.ok) {
    throw new Error('이미지 업로드 URL을 받지 못했습니다.');
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
