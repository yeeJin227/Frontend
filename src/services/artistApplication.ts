
import 'server-only';
import type { ApiResponse, ArtistApplicationRequest, S3FileRequest } from '@/types/artistApplication';

// 문서 파일 업로드 (멀티파트)

export async function uploadArtistDocuments(files: File[]): Promise<S3FileRequest[]> {
  if (!files.length) return [];

  const form = new FormData();
  files.forEach((f) => form.append('files', f));

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/images`, {
    method: 'POST',
    body: form,
    headers: { accept: 'application/json' },
    credentials: 'include',
  });

  const text = await res.text().catch(() => '');
  if (!res.ok) {
    throw new Error(text || '문서 업로드 실패');
  }

  // 서버 표준 ApiResponse
  let json: ApiResponse<Array<Pick<S3FileRequest, 'url' | 's3Key' | 'originalFileName'>>>;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('문서 업로드 응답 파싱 실패');
  }
  if (json.resultCode !== '200' || !Array.isArray(json.data)) {
    throw new Error(json.msg || '문서 업로드 실패');
  }

  return json.data.map((d) => ({
    url: d.url,
    s3Key: d.s3Key,
    originalFileName: d.originalFileName,
    type: 'DOCUMENT',
  }));
}

// 작가 신청 API -> 성공 시 "data: number"
export async function applyAsArtist(payload: ArtistApplicationRequest): Promise<number> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/artist/application`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json;charset=UTF-8',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const text = await res.text().catch(() => '');
  if (!res.ok) {
    throw new Error(text || `작가 신청 실패 (HTTP ${res.status})`);
  }

  let json: ApiResponse<number>;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('작가 신청 응답 파싱 실패');
  }

  if (json.resultCode !== '200') {
    throw new Error(json.msg || '작가 신청 실패');
  }
  return json.data;
}
