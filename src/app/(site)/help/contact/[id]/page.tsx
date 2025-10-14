import InquiryDetailClient from '@/components/help/InquiryDetailClient';

type PageParams = {
  id: string;
};

export default async function Page({ params }: { params: Promise<PageParams> }) {
  const { id } = await params;
  return <InquiryDetailClient inquiryId={id} />;
}
