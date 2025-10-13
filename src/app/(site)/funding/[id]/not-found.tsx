// app/funding/[id]/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">펀딩을 찾을 수 없습니다</h2>
        <p className="text-gray-600 mb-6">존재하지 않거나 삭제된 펀딩입니다.</p>
        <Link
          href="/funding"
          className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-60 transition-colors"
        >
          펀딩 목록으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
