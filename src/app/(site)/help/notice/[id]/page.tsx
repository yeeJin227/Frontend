import NoticeDetailClient from '@/components/help/NoticeDetailClient';

type PageParams = {
  id: string;
};

export default function Page({ params }: { params: PageParams }) {
  return <NoticeDetailClient noticeId={params.id} />;
}
