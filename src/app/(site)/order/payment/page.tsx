import { redirect } from 'next/navigation';
import PaymentForm from './components/PaymentForm';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// 서버에서 선택된 장바구니 조회
async function getCartSelected() {
  const response = await fetch(`${API_BASE_URL}/api/cart/selected`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    cache: 'no-store', // 항상 최신 데이터
  });

  if (!response.ok) {
    throw new Error('선택된 장바구니 조회에 실패했습니다.');
  }

  return response.json();
}

const PaymentPage = async () => {
  // 서버에서 선택된 장바구니 아이템 조회
  let cartData;

  try {
    cartData = await getCartSelected();
  } catch (error) {
    // 선택된 아이템이 없거나 에러 발생 시 장바구니로 리다이렉트
    redirect('/order');
  }

  // 선택된 아이템이 없으면 장바구니로 리다이렉트
  const hasSelectedItems =
    cartData.data.normalCartItems.length > 0 ||
    cartData.data.fundingCartItems.length > 0;

  if (!hasSelectedItems) {
    redirect('/order');
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 브레드크럼 */}
        <div className="text-center text-2xl mb-8">
          <span className="text-gray-300">01 장바구니</span>
          <span className="text-gray-300 mx-2">&gt;</span>
          <span className="font-bold">02 주문/결제</span>
          <span className="text-gray-300 mx-2">&gt;</span>
          <span className="text-gray-300">03 주문완료</span>
        </div>

        {/* 클라이언트 컴포넌트 - 결제 폼 */}
        <PaymentForm cartData={cartData.data} />
      </main>
    </div>
  );
};

export default PaymentPage;
