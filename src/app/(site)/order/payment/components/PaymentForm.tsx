'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useOrderStore } from '@/app/(site)/order/stores/orderStore';
import { CartItemResponse } from '@/app/(site)/order/types/cart.types';
import { mapCartItemsResponseToCartItems } from '@/app/(site)/order/types/mapper';
import { createOrder } from '@/app/(site)/order/api/orderApi';
import { CreateOrderRequest } from '@/app/(site)/order/types/order.types';
import { getMoricashBalance } from '@/app/(site)/order/api/moricashApi';

interface PaymentFormProps {
  cartItems: CartItemResponse[];
}

const PaymentForm = ({ cartItems }: PaymentFormProps) => {
  const router = useRouter();
  const { shippingInfo, setShippingInfo } = useOrderStore();

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

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [currentTerms, setCurrentTerms] = useState<
    'electronic' | 'personal' | 'provision' | null
  >(null);

  // 모리캐시 잔액 조회
  const { data: moricashData } = useQuery({
    queryKey: ['moricashBalance'],
    queryFn: getMoricashBalance,
  });

  // 주문 생성 mutation
  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (response) => {
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

  const handleShowTerms = (type: 'electronic' | 'personal' | 'provision') => {
    setCurrentTerms(type);
    setShowTermsModal(true);
  };

  const allCartItems = mapCartItemsResponseToCartItems(cartItems);

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

  // 결제 가능 여부 확인
  const isPaymentEnabled =
    shippingData.recipient &&
    shippingData.zipCode &&
    shippingData.address &&
    shippingData.phone &&
    shippingData.phone2 &&
    shippingData.phone3 &&
    agreements.electronicTransaction &&
    agreements.personalInfo &&
    agreements.personalInfoProvision;

  const handlePayment = () => {
    const fullPhone = `${shippingData.phone}-${shippingData.phone2}-${shippingData.phone3}`;

    const orderRequest: CreateOrderRequest = {
      orderItems: cartItems.map((item) => ({
        productUuid: item.productUuid || item.productId?.toString() || '',
        quantity: item.quantity,
        optionInfo: item.optionInfo || '',
      })),
      shippingAddress1: shippingData.address,
      shippingAddress2: shippingData.detailAddress,
      shippingZip: shippingData.zipCode,
      recipientName: shippingData.recipient,
      recipientPhone: fullPhone,
      deliveryRequest: shippingData.deliveryRequest,
      paymentMethod: 'MORI_CASH',
    };

    createOrderMutation.mutate(orderRequest);
  };

  const getTermsContent = () => {
    switch (currentTerms) {
      case 'electronic':
        return {
          title: '전자금융거래 기본약관',
          content: `제1조(목적)
이 약관은 전자금융거래의 법률관계를 명확히 하여 거래의 안전성과 신뢰성을 확보함을 목적으로 합니다.

제2조(용어의 정의)
1. "전자금융거래"라 함은 금융회사 또는 전자금융업자가 전자적 장치를 통하여 금융상품 및 서비스를 제공하고, 이용자가 금융회사 또는 전자금융업자의 종사자와 직접 대면하거나 의사소통을 하지 아니하고 자동화된 방식으로 이를 이용하는 거래를 말합니다.

제3조(약관의 명시 및 변경)
1. 회사는 이용자가 전자금융거래를 이용하기 전에 이 약관을 게시하고 이용자가 이 약관의 중요한 내용을 확인할 수 있도록 합니다.`,
        };
      case 'personal':
        return {
          title: '개인정보 수집 및 이용 동의',
          content: `1. 개인정보의 수집 및 이용 목적
회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다.
- 서비스 제공에 관한 계약 이행 및 서비스 제공에 따른 요금정산
- 회원 관리
- 마케팅 및 광고에 활용

2. 수집하는 개인정보의 항목
회사는 회원가입, 상담, 서비스 신청 등을 위해 아래와 같은 개인정보를 수집하고 있습니다.
- 필수항목: 이름, 연락처, 주소, 이메일

3. 개인정보의 보유 및 이용기간
원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.`,
        };
      case 'provision':
        return {
          title: '개인정보 제공 및 위탁 동의',
          content: `1. 개인정보 제공
회사는 이용자의 동의가 있거나 법령의 규정에 의한 경우를 제외하고는 어떠한 경우에도 개인정보를 제3자에게 제공하지 않습니다.

2. 개인정보 처리 위탁
회사는 서비스 향상을 위해서 아래와 같이 개인정보를 위탁하고 있으며, 관계 법령에 따라 위탁계약 시 개인정보가 안전하게 관리될 수 있도록 필요한 사항을 규정하고 있습니다.

위탁 대상자: 배송업체
위탁업무 내용: 상품 배송
보유 및 이용기간: 배송 완료 후 3개월`,
        };
      default:
        return { title: '', content: '' };
    }
  };

  return (
    <>
      <div className="grid grid-cols-[2fr_1fr] gap-8">
        <div className="space-y-8">
          {/* 배송지 정보 */}
          <section>
            <h2 className="text-3xl font-bold mb-6">배송지 정보</h2>

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
                  <input
                    value={shippingData.deliveryRequest}
                    onChange={(e) =>
                      handleShippingDataChange(
                        'deliveryRequest',
                        e.target.value,
                      )
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
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={150}
                        height={150}
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
                    <p className="text-gray-500 text-sm">
                      옵션 : {item.option}
                    </p>
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
                    <span className="text-primary font-bold">
                      {moricashData?.availableBalance.toLocaleString() || 0}
                    </span>{' '}
                    캐시
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
                  <button
                    type="button"
                    onClick={() => handleShowTerms('electronic')}
                    className="px-2 py-1 bg-white border border-gray-300 rounded text-xs hover:bg-gray-50"
                  >
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
                  <button
                    type="button"
                    onClick={() => handleShowTerms('personal')}
                    className="px-2 py-1 bg-white border border-gray-300 rounded text-xs hover:bg-gray-50"
                  >
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
                  <button
                    type="button"
                    onClick={() => handleShowTerms('provision')}
                    className="px-2 py-1 bg-white border border-gray-300 rounded text-xs hover:bg-gray-50"
                  >
                    약관보기
                  </button>
                </label>
              </div>
            </div>
          </div>

          {/* 결제하기 버튼 */}
          <button
            onClick={handlePayment}
            disabled={!isPaymentEnabled || createOrderMutation.isPending}
            className="block mx-auto px-[44px] py-[13px] w-fit bg-primary text-white rounded font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createOrderMutation.isPending ? '처리 중...' : '결제하기'}
          </button>

          {!isPaymentEnabled && (
            <p className="text-xs text-center text-red-500 mt-2">
              필수 정보를 모두 입력하고 약관에 동의해주세요
            </p>
          )}
        </div>
      </div>

      {/* 약관 모달 */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">{getTermsContent().title}</h3>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                {getTermsContent().content}
              </pre>
            </div>
            <div className="p-6 border-t">
              <button
                onClick={() => setShowTermsModal(false)}
                className="w-full py-3 bg-primary text-white rounded font-semibold hover:bg-primary/90"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentForm;
