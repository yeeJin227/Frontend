import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import { OrderDetailApiResponse } from '../types/order.types';
import OrderSuccess from '../components/OrderSuccess';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// 서버에서 주문 상세 조회
async function getOrderDetail(orderId: string) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('주문 정보 조회에 실패했습니다.');
  }

  if (response.status === 200) {
    return response.json();
  }
}

type OrderCompletePageProps = {
  searchParams: Promise<{ orderId: string }>;
};

const OrderCompletePage = async ({ searchParams }: OrderCompletePageProps) => {
  const resolvedParams = await searchParams;
  const orderId = resolvedParams.orderId;

  // orderId가 없으면 메인으로 리다이렉트
  if (!orderId) {
    redirect('/');
  }

  let orderData: OrderDetailApiResponse;

  try {
    orderData = await getOrderDetail(orderId);
  } catch (error) {
    console.error('주문 조회 실패:', error);
    redirect('/');
  }

  const order = orderData.data;

  return (
    <div className="min-h-screen bg-white">
      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto py-8">
        <div className="flex justify-center">
          <div className="flex items-center text-2xl">
            <span className="text-gray-400">01 장바구니</span>
            <span className="mx-4 text-gray-600">&gt;</span>
            <span className="text-gray-400">02 주문/결제</span>
            <span className="mx-4">&gt;</span>
            <span className="font-semibold">03 주문완료</span>
          </div>
        </div>
      </div>

      {/* Order Complete Message */}
      <div className="max-w-7xl mx-auto text-center py-12">
        <OrderSuccess />
      </div>

      {/* Order History Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8 text-black">주문 내역</h2>

        {/* Table Header */}
        <div className="bg-white border-t border-b border-gray-300 py-6">
          <div className="flex items-center px-8 pl-[170px]">
            <div className="flex items-center gap-6 w-1/2">
              <div className="w-36"></div>
              <span className="text-xl font-medium text-black">상품 정보</span>
            </div>
            <div className="w-1/4 text-center">
              <span className="text-xl font-medium text-black">주문 금액</span>
            </div>
            <div className="w-1/4 text-center">
              <span className="text-xl font-medium text-black">수량</span>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white pl-[170px]">
          {order.orderItems.map((item) => (
            <div
              key={item.orderItemId}
              className="flex items-center py-8 px-8 border-b border-gray-200"
            >
              <div className="flex items-center gap-6 w-1/2">
                <div className="w-36 h-36 bg-gray-200 rounded overflow-hidden flex items-center justify-center">
                  {item.productThumbnailUrl ? (
                    <Image
                      src={item.productThumbnailUrl}
                      alt={item.productName}
                      width={144}
                      height={144}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-600 text-sm">상품 이미지</span>
                  )}
                </div>
                <div className="flex flex-col gap-2 text-gray-600">
                  <p className="text-black font-semibold text-lg">
                    {item.productName}
                  </p>
                  {item.optionInfo && (
                    <p className="text-sm">옵션 : {item.optionInfo}</p>
                  )}
                </div>
              </div>
              <div className="w-1/4 text-center">
                <span className="text-2xl font-bold text-gray-800">
                  {item.totalPrice.toLocaleString()}원
                </span>
              </div>
              <div className="w-1/4 text-center">
                <span className="text-xl font-bold text-gray-800">
                  {item.quantity}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="flex justify-center mt-16 mb-12">
          <div className="flex gap-16 md:gap-64 text-center flex-wrap">
            <div>
              <h3 className="text-2xl font-semibold mb-4 text-black">
                총 주문금액
              </h3>
              <p className="text-2xl text-black">
                {order.totalAmount.toLocaleString()}원
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-4 text-black">
                총 배송비
              </h3>
              <p className="text-2xl text-black">
                {order.shippingFee.toLocaleString()}원
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-4 text-black">
                총 결제금액
              </h3>
              <p className="text-2xl text-black">
                {order.finalAmount.toLocaleString()}원
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-12">
          <Link
            href="/"
            className="px-8 py-3 border border-primary text-primary rounded-md font-semibold hover:bg-gray-50 transition-colors duration-200"
          >
            메인으로
          </Link>
          <Link
            href="/mypage/orders"
            className="px-8 py-3 bg-primary text-white rounded-md font-semibold hover:bg-primary/90 transition-colors duration-200"
          >
            주문내역으로
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderCompletePage;
