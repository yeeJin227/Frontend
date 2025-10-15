'use client'


export default function ResultHeader({
  query,
  total,
}: {
  query:string;
  total:number;
}) {


  return (
    <div className="pb-8">
      <div className="flex font-bold text-[30px] pb-8">
        <div className="bg-primary-20 px-2 mr-2">{query}</div>
        <span>에 대한 검색결과</span>
      </div>

      <div className="flex justify-between border border-primary px-[30px] py-3">
        <span>총 {total}개 상품</span>
      </div>
    </div>
  )
}