import NoticeEditClient from '@/components/help/NoticeEditClient';

type PageParams = {
  id: string;
};

export default function Page({ params }: { params: PageParams }) {
  return <NoticeEditClient noticeId={params.id} />;
}
