import InquiryEditClient from '@/components/help/InquiryEditClient';

type Params = {
  id: string;
};

export default async function Page({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  return <InquiryEditClient inquiryId={id} />;
}
