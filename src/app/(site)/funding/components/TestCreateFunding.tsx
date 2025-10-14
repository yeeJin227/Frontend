'use client';

import Button from '@/components/Button';
import { createNewFunding } from '@/utils/api/funding';

function TestCreateFunding() {
  const handleCreateFunding = async () => {
    await createNewFunding({
      title: '마이폰 pro max',
      description: '멋있는 아이폰 ^^',
      categoryId: 3,
      imageUrl:
        'https://i.namu.wiki/i/gi2iAhtDbTXfXsKyzfqH7lZ8eHEjm9h4ibdxgwqIW3Yi4cW6RjYFMJNqfM1gPcdr15fF2kamuUkYukjD9WqkkL6u46Locny0MajKTBRNZlIQVBqCD1asNI2r2ju0bb2LS1gxKsUX0_OiiLbPlUhhrg.webp',
      targetAmount: 50,
      price: 50000,
      stock: 20,
      startDate: '2025-10-12T16:37:20.862Z',
      endDate: '2025-10-13T16:37:20.862Z',
    });
  };

  /*
	{
  "title": "string",
  "description": "string",
  "categoryId": 0,
  "imageUrl": "string",
  "targetAmount": 0,
  "price": 0,
  "stock": 0,
  "startDate": "2025-10-13T14:51:16.131Z",
  "endDate": "2025-10-13T14:51:16.131Z"
}
	*/
  return <Button onClick={handleCreateFunding}>새로운 펀딩 만들기</Button>;
}
export default TestCreateFunding;
