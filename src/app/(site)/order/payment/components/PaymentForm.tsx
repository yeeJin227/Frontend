'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useOrderStore } from '@/app/(site)/order/stores/orderStore';
import { CartDataResponse } from '@/app/(site)/order/types/cart.types';
import { mapCartItemsResponseToCartItems } from '@/app/(site)/order/types/mapper';
import { createOrder } from '@/app/(site)/order/api/orderApi';
import { CreateOrderRequest } from '@/app/(site)/order/types/order.types';

interface PaymentFormProps {
  cartData: CartDataResponse;
}

const PaymentForm = ({ cartData }: PaymentFormProps) => {
  const router = useRouter();
  const { shippingInfo, setShippingInfo } = useOrderStore();

  const [shippingType, setShippingType] = useState<'existing' | 'new'>(
    'existing',
  );
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreements, setAgreements] = useState({
    productInfo: false,
    electronicTransaction: false,
    personalInfo: false,
    personalInfoProvision: false,
  });

  const [shippingData, setShippingData] = useState({
    name: shippingInfo?.name || '',
    recipient: '',
    zipCode: shippingInfo?.zipCode || '',
    address: shippingInfo?.address || '',
    detailAddress: shippingInfo?.detailAddress || '',
    phone: shippingInfo?.phone || '',
    phone2: '',
    phone3: '',
    deliveryRequest: '',
  });

  // 주문 생성 mutation
  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (response) => {
      // 주문 완료 페이지로 이동
      router.push(`/order/complete?orderId=${response.data.orderId}`);
    },
    onError: (error) => {
      alert(
        error instanceof Error
          ? error.message
          : '주문 생성에 실패했습니다. 다시 시도해주세요.',
      );
    },
  });

  const handleShippingDataChange = (field: string, value: string) => {
    setShippingData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Zustand 스토어에도 배송정보 업데이트
    if (
      field === 'name' ||
      field === 'zipCode' ||
      field === 'address' ||
      field === 'detailAddress' ||
      field === 'phone'
    ) {
      const updatedInfo = {
        name: field === 'name' ? value : shippingData.name,
        zipCode: field === 'zipCode' ? value : shippingData.zipCode,
        address: field === 'address' ? value : shippingData.address,
        detailAddress:
          field === 'detailAddress' ? value : shippingData.detailAddress,
        phone: field === 'phone' ? value : shippingData.phone,
      };
      setShippingInfo(updatedInfo);
    }
  };

  const handleAgreementChange = (key: string, checked: boolean) => {
    setAgreements((prev) => ({
      ...prev,
      [key]: checked,
    }));
  };

  const handleAgreeAll = (checked: boolean) => {
    setAgreeAll(checked);
    setAgreements({
      productInfo: checked,
      electronicTransaction: checked,
      personalInfo: checked,
      personalInfoProvision: checked,
    });
  };

  // API 응답을 UI 타입으로 변환
  const allCartItems = [
    ...mapCartItemsResponseToCartItems(cartData.normalCartItems),
    ...mapCartItemsResponseToCartItems(cartData.fundingCartItems),
  ];

  const calculateTotal = () => {
    const totalPrice = allCartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const shippingFee = totalPrice > 0 ? 3000 : 0;
    return {
      totalPrice,
      shippingFee,
      finalPrice: totalPrice + shippingFee,
    };
  };

  const { totalPrice, shippingFee, finalPrice } = calculateTotal();

  const handlePayment = () => {
    // 유효성 검사
    if (!shippingData.recipient) {
      alert('수령인을 입력해주세요.');
      return;
    }
    if (!shippingData.zipCode) {
      alert('우편번호를 입력해주세요.');
      return;
    }
    if (!shippingData.address) {
      alert('주소를 입력해주세요.');
      return;
    }
    if (!shippingData.phone) {
      alert('연락처를 입력해주세요.');
      return;
    }

    // 약관 동의 확인
    if (
      !agreements.electronicTransaction ||
      !agreements.personalInfo ||
      !agreements.personalInfoProvision
    ) {
      alert('필수 약관에 모두 동의해주세요.');
      return;
    }

    // 전화번호 형식 맞추기
    const fullPhone = `${shippingData.phone}-${shippingData.phone2}-${shippingData.phone3}`;

    // 주문 요청 데이터 생성
    const orderRequest: CreateOrderRequest = {
      orderItems: cartData.normalCartItems
        .concat(cartData.fundingCartItems)
        .map((item) => ({
          productUuid: item.productId.toString(), // productId를 UUID로 변환 필요할 수도
          quantity: item.quantity,
          optionInfo: item.optionInfo,
        })),
      shippingAddress1: shippingData.address,
      shippingAddress2: shippingData.detailAddress,
      shippingZip: shippingData.zipCode,
      recipientName: shippingData.recipient,
      recipientPhone: fullPhone,
      deliveryRequest: shippingData.deliveryRequest,
      paymentMethod: 'MORI_CASH',
    };

    // 주문 생성 API 호출
    createOrderMutation.mutate(orderRequest);
  };

  return (
    <div className="grid grid-cols-[2fr_1fr] gap-8">
      <div className="space-y-8">
        {/* 배송지 정보 */}
        <section>
          <h2 className="text-3xl font-bold mb-6">배송지 정보</h2>

          <div className="flex mb-6">
            <button
              onClick={() => setShippingType('existing')}
              className={`px-6 py-3 font-semibold ${
                shippingType === 'existing'
                  ? 'bg-primary text-white'
                  : 'bg-white border border-primary text-primary'
              }`}
            >
              기존배송지
            </button>
            <button
              onClick={() => setShippingType('new')}
              className={`px-6 py-3 font-semibold ${
                shippingType === 'new'
                  ? 'bg-primary text-white'
                  : 'bg-white border border-primary text-primary'
              }`}
            >
              신규입력
            </button>
          </div>

          <div className="grid grid-cols-[100px_1fr] gap-4">
            <div className="bg-gray-100 p-4 text-center">
              <div className="h-8 flex items-center justify-center text-sm mb-4">
                배송지명
              </div>
              <div className="h-8 flex items-center justify-center text-sm mb-4">
                <span className="text-primary">*</span> 수령인
              </div>
              <div className="h-8 flex items-center justify-center text-sm mb-4">
                <span className="text-primary">*</span> 우편번호
              </div>
              <div className="h-8 flex items-center justify-center text-sm mb-4">
                <span className="text-primary">*</span> 배송지 주소
              </div>
              <div className="h-8 flex items-center justify-center text-sm mb-4"></div>
              <div className="h-8 flex items-center justify-center text-sm mb-4">
                <span className="text-primary">*</span> 연락처
              </div>
              <div className="h-16 flex items-start justify-center text-sm pt-2">
                배송 요청사항
              </div>
            </div>

            <div className="pt-4">
              <div className="h-8 mb-4">
                <input
                  type="text"
                  value={shippingData.name}
                  onChange={(e) =>
                    handleShippingDataChange('name', e.target.value)
                  }
                  className="w-full h-8 px-3 border border-gray-300 rounded"
                  placeholder="배송지명을 입력하세요"
                />
              </div>

              <div className="h-8 mb-4">
                <input
                  type="text"
                  value={shippingData.recipient}
                  onChange={(e) =>
                    handleShippingDataChange('recipient', e.target.value)
                  }
                  className="w-full h-8 px-3 border border-gray-300 rounded"
                  placeholder="수령인명을 입력하세요"
                />
              </div>

              <div className="h-8 mb-4">
                <input
                  type="text"
                  value={shippingData.zipCode}
                  onChange={(e) =>
                    handleShippingDataChange('zipCode', e.target.value)
                  }
                  className="w-32 h-8 px-3 border border-gray-300 rounded"
                  placeholder="우편번호"
                />
              </div>

              <div className="h-8 mb-4">
                <input
                  type="text"
                  value={shippingData.address}
                  onChange={(e) =>
                    handleShippingDataChange('address', e.target.value)
                  }
                  className="w-full h-8 px-3 border border-gray-300 rounded"
                  placeholder="주소를 입력하세요"
                />
              </div>

              <div className="h-8 mb-4">
                <input
                  type="text"
                  value={shippingData.detailAddress}
                  onChange={(e) =>
                    handleShippingDataChange('detailAddress', e.target.value)
                  }
                  className="w-full h-8 px-3 border border-gray-300 rounded"
                  placeholder="상세주소를 입력하세요"
                />
              </div>

              <div className="h-8 mb-4">
                <div className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={shippingData.phone}
                    onChange={(e) =>
                      handleShippingDataChange('phone', e.target.value)
                    }
                    className="w-16 h-8 px-3 border border-gray-300 rounded text-center"
                    placeholder="010"
                    maxLength={3}
                  />
                  <span>-</span>
                  <input
                    type="text"
                    value={shippingData.phone2}
                    onChange={(e) =>
                      handleShippingDataChange('phone2', e.target.value)
                    }
                    className="w-16 h-8 px-3 border border-gray-300 rounded text-center"
                    maxLength={4}
                  />
                  <span>-</span>
                  <input
                    type="text"
                    value={shippingData.phone3}
                    onChange={(e) =>
                      handleShippingDataChange('phone3', e.target.value)
                    }
                    className="w-16 h-8 px-3 border border-gray-300 rounded text-center"
                    maxLength={4}
                  />
                </div>
              </div>

              <div className="h-16">
                <textarea
                  value={shippingData.deliveryRequest}
                  onChange={(e) =>
                    handleShippingDataChange('deliveryRequest', e.target.value)
                  }
                  className="w-full h-16 px-3 py-2 border border-gray-300 rounded"
                  placeholder="배송 요청사항을 입력하세요"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 주문 상품 */}
        <section>
          <h2 className="text-3xl font-bold mb-6">주문 상품</h2>
          <div className="space-y-4">
            {allCartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded"
              >
                <div className="w-[150px] h-[150px] bg-gray-200 rounded overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      상품 이미지
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    {item.name}
                  </h3>
                  <p className="text-gray-500 text-sm">옵션 : {item.option}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {item.price.toLocaleString()}원
                  </div>
                  <div className="text-sm text-gray-500">
                    수량: {item.quantity}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 결제 방법 */}
        <section>
          <h2 className="text-3xl font-bold mb-6">결제 방법</h2>
          <div className="bg-gray-100 p-6 rounded">
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                </div>
                <span>모리캐시</span>
                <span className="text-[16px] text-gray-600">
                  현재 보유 캐시 :{' '}
                  <span className="text-primary font-bold">20,000</span> 캐시
                </span>
              </label>
            </div>
          </div>
        </section>
      </div>

      {/* 오른쪽 결제 금액 영역 */}
      <div className="bg-gray-50 p-6 rounded h-fit">
        <h3 className="text-3xl font-bold mb-6">결제 금액</h3>

        <div className="space-y-4 mb-6">
          <div className="flex justify-between">
            <span>총 상품금액</span>
            <span className="font-semibold">
              {totalPrice.toLocaleString()}원
            </span>
          </div>
          <div className="flex justify-between">
            <span>총 배송비</span>
            <span className="font-semibold">
              {shippingFee.toLocaleString()}원
            </span>
          </div>
          <div>
            <div className="flex justify-between font-bold">
              <span className="text-[18px]">최종 결제금액</span>
              <span className="text-red-500 text-2xl">
                {finalPrice.toLocaleString()}원
              </span>
            </div>
          </div>
        </div>

        {/* 약관 동의 */}
        <div className="space-y-4 mb-6">
          <div className="pb-[17px] text-sm font-semibold border-b border-b-gray-300">
            주문 상품정보 및 결제대행 서비스 이용약관에
            <br /> 모두 동의하십니까?
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={agreeAll}
              onChange={(e) => handleAgreeAll(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">모두 동의</span>
          </label>

          <div className="p-4 text-sm space-y-3">
            <div className="font-semibold">주문 상품정보에 대한 동의</div>
            <div className="text-xs text-gray-600 leading-relaxed">
              주문하실 상품, 가격, 배송정보, 할인내역등을 최종 확인하였으며,
              구매에 동의합니다. (전자상거래법 제8조 제2항)
            </div>

            <div className="font-semibold">결제대행 서비스 이용약관 동의</div>

            <div className="space-y-2 bg-white border border-gray-300 p-4 rounded">
              <label className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={agreements.electronicTransaction}
                    onChange={(e) =>
                      handleAgreementChange(
                        'electronicTransaction',
                        e.target.checked,
                      )
                    }
                    className="w-3 h-3"
                  />
                  <span className="text-xs">전자금융거래 기본약관</span>
                </div>
                <button className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">
                  약관보기
                </button>
              </label>

              <label className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={agreements.personalInfo}
                    onChange={(e) =>
                      handleAgreementChange('personalInfo', e.target.checked)
                    }
                    className="w-3 h-3"
                  />
                  <span className="text-xs">개인정보 수집 및 이용 동의</span>
                </div>
                <button className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">
                  약관보기
                </button>
              </label>

              <label className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={agreements.personalInfoProvision}
                    onChange={(e) =>
                      handleAgreementChange(
                        'personalInfoProvision',
                        e.target.checked,
                      )
                    }
                    className="w-3 h-3"
                  />
                  <span className="text-xs">개인정보 제공 및 위탁 동의</span>
                </div>
                <button className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">
                  약관보기
                </button>
              </label>
            </div>
          </div>
        </div>

        {/* 결제하기 버튼 */}
        <button
          onClick={handlePayment}
          disabled={createOrderMutation.isPending}
          className="block mx-auto px-[44px] py-[13px] w-fit bg-primary text-white rounded font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createOrderMutation.isPending ? '처리 중...' : '결제하기'}
        </button>
      </div>
    </div>
  );
};

export default PaymentForm;
