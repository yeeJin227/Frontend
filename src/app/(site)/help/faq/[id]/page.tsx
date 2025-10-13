import FaqDetailClient from '@/components/help/FaqDetailClient';

type FaqParams = {
  id: string;
};

export default async function Page({ params }: { params: Promise<FaqParams> }) {
  const { id } = await params;
  return <FaqDetailClient faqId={id} />;
}
