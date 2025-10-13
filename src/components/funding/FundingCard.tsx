import Image from 'next/image';
import { FundingItem } from '@/types/funding';
import Link from 'next/link';

interface Props {
  data: FundingItem;
}

function FundingCard({ data }: Props) {
  return (
    <Link href={`/funding/${data.id}`} className="block group">
      <div>
        <div className="relative w-[237px] h-[206px] overflow-hidden rounded-lg bg-gray-100">
          <Image
            src={data.imageUrl}
            alt={data.title}
            fill
            className="object-cover"
            sizes="237px"
          />
        </div>

        <p className="text-gray-400 text-sm font-semibold mt-3">
          {data.authorName}
        </p>
        <p className="font-semibold mt-1 line-clamp-2 group-hover:text-primary transition-colors">
          {data.title}
        </p>
        <div className="flex text-primary mt-2">
          <p className="text-sm font-semibold">달성률</p>
          <p className="ml-2 font-extrabold text-xl">{data.progress}%</p>
          <p className="ml-auto font-bold text-sm">
            {data.remainingDays > 0
              ? `D-${data.remainingDays}`
              : data.remainingDays === 0
                ? 'D-Day'
                : '펀딩 종료'}
          </p>
        </div>
      </div>
    </Link>
  );
}
export default FundingCard;
