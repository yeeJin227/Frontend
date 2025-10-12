// app/funding/_components/FundingGrid.tsx
import FundingCard from '@/components/funding/FundingCard';
import { Funding } from '../../../../types/funding';

interface FundingGridProps {
  fundings: Funding[];
}

export function FundingGrid({ fundings }: FundingGridProps) {
  return (
    <div className="grid grid-cols-4 gap-6 mb-10 w-full max-w-5xl">
      {fundings.map((funding) => (
        <div key={funding.id}>
          <FundingCard data={funding} />
        </div>
      ))}
    </div>
  );
}
