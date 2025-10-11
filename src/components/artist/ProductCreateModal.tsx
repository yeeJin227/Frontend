'use client';

import { useEffect, useMemo, useState } from 'react';
import X from '@/assets/icon/x.svg';
import Paperclip from '@/assets/icon/paperclip2.svg';
import NoticeEditor from '@/components/editor/NoticeEditor';
import { createProduct, deleteProduct, updateProduct, uploadProductImages /* updateProduct, deleteProduct */ } from '@/services/products';
import { fetchCategoriesClient } from '@/lib/server/categories.client';
import type { Category } from '@/types/category';
import { fetchTagsClient } from '@/lib/server/tags.client';
import type { Tag as RemoteTag } from '@/types/tag';

import type {
  UploadType,
  UploadedImageInfo,
  ProductCreateDto,
  ProductCreatePayload,
  ShippingTypeUI,
  TagDict,
  ProductOptionUI,
  ProductAddonUI,
} from '@/types/product';

// "2025-10-10T12:30" → "2025-10-10T12:30:00"
const toLocalDateTime = (s?: string | null) =>
  s ? (s.includes(':') && s.length === 16 ? `${s}:00` : s) : null;

function toProductCreateDto(
  payload: ProductCreatePayload, // 사용자가 입력한 데이터
  opts: { uploadedImages: UploadedImageInfo[]; tagDict: TagDict }
): ProductCreateDto {
  const categoryId = Number(payload.category2 || payload.category1); // String → number
  const deliveryType =
    payload.shipping.type === 'CONDITIONAL' ? 'CONDITIONAL_FREE' : payload.shipping.type; // CONDITIONAL -> CONDITIONAL_FREE

  return {
    categoryId,
    name: payload.title,
    brandName: payload.brand,
    productModelName: payload.modelName,

    price: payload.price,
    discountRate: payload.discountRate,

    bundleShippingAvailable: payload.bundleShipping,
    deliveryType,
    deliveryCharge: deliveryType === 'FREE' ? 0 : payload.shipping.fee,
    additionalShippingCharge: payload.shipping.jejuExtraFee,
    conditionalFreeAmount:
      deliveryType === 'CONDITIONAL_FREE' ? (payload.shipping.freeThreshold ?? 0) : null,

    stock: payload.stock,
    description: payload.description,

    sellingStatus: 'SELLING',
    displayStatus: 'DISPLAYING',

    minQuantity: payload.minQty,
    maxQuantity: payload.maxQty,

    isPlanned: !!payload.plannedSale, // 판매 기간 입력 여부로 판단
    isRestock: false, // 재입고 상품 false
    sellingStartDate: payload.plannedSale ? toLocalDateTime(payload.plannedSale.startAt) : null, // 입력값이 있으면 toLocalDateTime
    sellingEndDate: payload.plannedSale ? toLocalDateTime(payload.plannedSale.endAt) : null,

    tags: (payload.tags ?? []) // ["모던", "심플"] -> [1, 4]
      .map((t) => opts.tagDict[t])
      .filter((id): id is number => typeof id === 'number'),

    options: (payload.options ?? []).map((o) => ({
      optionName: o.name,
      optionStock: o.stock ?? 0,
      optionAdditionalPrice: o.extraPrice ?? 0,
    })),

    additionalProducts: (payload.addons ?? []).map((a) => ({
      additionalProductName: a.name,
      additionalProductStock: a.stock ?? 0,
      additionalProductPrice: a.extraPrice ?? 0,
    })),

    images: (opts.uploadedImages ?? []).map((img) => ({
      url: img.url,
      type: img.type,
      s3Key: img.s3Key,
      originalFileName: img.originalFileName,
    })),

    certification: payload.lawCert?.required ?? false,
    origin: payload.origin,
    material: payload.material,
    size: payload.size,
  };
}

type Props = {
  open: boolean;
  onClose: () => void;

  // 생성
  onCreated?: (args: { productUuid: string; payload: ProductCreatePayload }) => void;

  // 수정/삭제
  mode?: 'create' | 'edit';
  productUuid?: string;
  initialPayload?: ProductCreatePayload;
  onUpdated?: (args: { productUuid: string; payload: ProductCreatePayload }) => void;
  onDeleted?: (args: { productUuid: string }) => void;

  // 공통
  initialBrand?: string;
  initialBizInfo?: { companyName?: string; bizNumber?: string; ceoName?: string };
  onLoadBizFromProfile?: () =>
    | Promise<{ companyName?: string; bizNumber?: string; ceoName?: string } | void>
    | void;
};

export default function ProductCreateModal({
  open,
  onClose,
  onCreated,
  mode = 'create',
  productUuid,
  initialPayload,
  onUpdated,
  onDeleted,
  initialBrand = '모리모리',
  initialBizInfo,
  onLoadBizFromProfile,
}: Props) {

  // ----- 기본 정보 -----
  const [brand, setBrand] = useState(initialBrand);
  const [title, setTitle] = useState('');
  const [modelName, setModelName] = useState('');
  const [category1, setCategory1] = useState('');
  const [category2, setCategory2] = useState('');

  // 카테고리 트리 상태
  const [catTree, setCatTree] = useState<Category[]>([]);
  const [catsLoading, setCatsLoading] = useState(false);
  const [catsErr, setCatsErr] = useState<string | null>(null);
  
  // 태그 목록
  const [tagsRemote, setTagsRemote] = useState<RemoteTag[]>([]);
  const [tagsError, setTagsError] = useState<string | null>(null);
  const [tagsLoading, setTagsLoading] = useState(false);

  // 사이즈/재질/원산지
  const [size, setSize] = useState('');
  const [material, setMaterial] = useState('');
  const [origin, setOrigin] = useState('');
  
  // 가격/재고/구매제한
  const [price, setPrice] = useState<number>(0);
  const [discountRate, setDiscountRate] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [minQty, setMinQty] = useState<number>(1);
  const [maxQty, setMaxQty] = useState<number>(0);
  
  // 배송 정보
  const [bundleShipping, setBundleShipping] = useState<boolean>(true);
  const [shippingType, setShippingType] = useState<ShippingTypeUI>('FREE');
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [freeThreshold, setFreeThreshold] = useState<number>(0); // 조건부 무료 기준 금액
  const [jejuExtraFee, setJejuExtraFee] = useState<number>(0);

  // 판매 설정
  const [isPlanned, setIsPlanned] = useState<boolean>(false);
  const [saleStart, setSaleStart] = useState<string>('');
  const [saleEnd, setSaleEnd] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]); // UI에서 선택한 태그명(string)

  // 옵션/추가상품
  const [useOptions, setUseOptions] = useState<boolean>(false);
  const [options, setOptions] = useState<ProductOptionUI[]>([]);
  const [addons, setAddons] = useState<ProductAddonUI[]>([]);
  // 옵션/추가상품 (추가/삭제/수정)
  const addOption = () => setOptions((p) => [...p, { id: crypto.randomUUID(), name: '' }]);
  const removeOption = (idx: number) => setOptions((p) => p.filter((_, i) => i !== idx));
  const updateOption = (idx: number, patch: Partial<ProductOptionUI>) =>
    setOptions((p) => p.map((o, i) => (i === idx ? { ...o, ...patch } : o)));
  const addAddon = () => setAddons((p) => [...p, { id: crypto.randomUUID(), name: '' }]);
  const removeAddon = (idx: number) => setAddons((p) => p.filter((_, i) => i !== idx));
  const updateAddon = (idx: number, patch: Partial<ProductAddonUI>) =>
    setAddons((p) => p.map((o, i) => (i === idx ? { ...o, ...patch } : o)));

  // 인증/사업자
  const [lawCertRequired, setLawCertRequired] = useState<boolean>(false);
  const [lawCertDetail, setLawCertDetail] = useState<string>('');
  const [bizInfo, setBizInfo] = useState({
    companyName: initialBizInfo?.companyName ?? '',
    bizNumber: initialBizInfo?.bizNumber ?? '',
    ceoName: initialBizInfo?.ceoName ?? '',
  });

  // 에디터/파일
  const [editorValue, setEditorValue] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [fileTypes, setFileTypes] = useState<UploadType[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImageInfo[]>([]);

  const [submitting, setSubmitting] = useState(false);

  

  // 모달 열릴 때 태그 로드
  useEffect(() => {
    if (!open) return;
    (async () => {
      setTagsLoading(true);
      setTagsError(null);
      try {
        const data = await fetchTagsClient();
        setTagsRemote(data);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : '태그 로드 실패';
        setTagsError(msg);
      } finally {
        setTagsLoading(false);
      }
    })();
  }, [open]);

  // 모달 열릴 때 카테고리 로드
  useEffect(() => {
    if (!open) return;
    (async () => {
      setCatsLoading(true);
      setCatsErr(null);
      try {
        const data = await fetchCategoriesClient();
        setCatTree(data);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : '카테고리 로드 실패';
        setCatsErr(msg);
        setCatTree([]);
      } finally {
        setCatsLoading(false);
      }
    })();
  }, [open]);

  const subOptions = useMemo(() => {
    const root = catTree.find((c) => String(c.id) === category1);
    return root?.subCategories ?? [];
  }, [catTree, category1]);

  const tagDict = useMemo(() => {
    const dict: TagDict = {};
    tagsRemote.forEach((t) => (dict[t.tagName] = t.id));
    return dict;
  }, [tagsRemote]);

  useEffect(() => {
    const urls = files.map((f) => (f.type?.startsWith('image/') ? URL.createObjectURL(f) : ''));
    setPreviews(urls);
    return () => urls.forEach((u) => u && URL.revokeObjectURL(u));
  }, [files]);

  // body scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

//payload -> 내부 state 주입 유틸
function hydrateFromPayload(payload: ProductCreatePayload) {
  setBrand(payload.brand ?? initialBrand);
  setTitle(payload.title ?? '');
  setModelName(payload.modelName ?? '');
  setCategory1(payload.category1 ?? '');
  setCategory2(payload.category2 ?? '');

  setSize(payload.size ?? '');
  setMaterial(payload.material ?? '');
  setOrigin(payload.origin ?? '');

  setPrice(payload.price ?? 0);
  setDiscountRate(payload.discountRate ?? 0);
  setStock(payload.stock ?? 0);
  setMinQty(payload.minQty ?? 1);
  setMaxQty(payload.maxQty ?? 0);

  // 배송
  setBundleShipping(!!payload.bundleShipping);
  setShippingType(payload.shipping?.type ?? 'FREE');
  setShippingFee(payload.shipping?.type === 'FREE' ? 0 : (payload.shipping?.fee ?? 0));
  setFreeThreshold(
    payload.shipping?.type === 'CONDITIONAL' ? (payload.shipping?.freeThreshold ?? 0) : 0
  );
  setJejuExtraFee(payload.shipping?.jejuExtraFee ?? 0);

  // 판매설정
  const planned = !!payload.plannedSale;
  setIsPlanned(planned);
  setSaleStart(planned ? (payload.plannedSale?.startAt ?? '') : '');
  setSaleEnd(planned ? (payload.plannedSale?.endAt ?? '') : '');

  // 태그/옵션/추가상품
  setTags(payload.tags ?? []);
  const usingOptions = (payload.options?.length ?? 0) > 0 || (payload.addons?.length ?? 0) > 0;
  setUseOptions(usingOptions);
  setOptions(payload.options ?? []);
  setAddons(payload.addons ?? []);

  // 인증/사업자/본문
  setLawCertRequired(!!payload.lawCert?.required);
  setLawCertDetail(payload.lawCert?.detail ?? '');
  setBizInfo({
    companyName: payload.bizInfo?.companyName ?? '',
    bizNumber: payload.bizInfo?.bizNumber ?? '',
    ceoName: payload.bizInfo?.ceoName ?? '',
  });
  setEditorValue(payload.description ?? '');
}

  // 생성 모달 열리면 입력값 비우기 
  useEffect(() => {
  if (!open) return;

  if (mode === 'edit' && initialPayload) {
    // 수정 모드 → initialPayload로 주입
    hydrateFromPayload(initialPayload);
  } else if (mode === 'create') {
    // 생성 모드 → 깔끔히 초기화 + 브랜드만 세팅
    resetAll();
    setBrand(initialBrand);
  }
}, [open, mode, initialPayload, initialBrand]);

  // 전체 초기화
  const resetAll = () => {
    setTitle('');
    setModelName('');
    setCategory1('');
    setCategory2('');
    setSize('');
    setMaterial('');
    setOrigin('');
    setPrice(0);
    setDiscountRate(0);
    setStock(0);
    setMinQty(1);
    setMaxQty(0);
    setBundleShipping(true);
    setShippingType('FREE');
    setShippingFee(0);
    setFreeThreshold(0);
    setJejuExtraFee(0);
    setIsPlanned(false);
    setSaleStart('');
    setSaleEnd('');
    setTags([]);
    setUseOptions(false);
    setOptions([]);
    setAddons([]);
    setLawCertRequired(false);
    setLawCertDetail('');
    setEditorValue('');
    setFiles([]);
    setFileTypes([]);
    setUploadedImages([]);
  };

  const handleSelectFiles = (incoming: File[]) => {
    if (incoming.length === 0) return;
    const key = (f: File) => `${f.name}-${f.size}-${f.lastModified}`;
    const dedup = incoming.filter((nf) => !files.some((ef) => key(ef) === key(nf)));
    if (dedup.length === 0) return;
    const nextFiles = [...files, ...dedup];
    setFiles(nextFiles);
    const defaults = dedup.map((_, i) => (files.length === 0 && i === 0 ? 'MAIN' : 'ADDITIONAL'));
    setFileTypes((prev) => [...prev, ...defaults]);
  };

  const handleChangeFileType = (index: number, newType: UploadType) => {
    setFileTypes((prev) => {
      const updated = [...prev];
      updated[index] = newType;
      return updated;
    });
  };

  const handleUploadImages = async () => {
    if (files.length === 0) return alert('파일을 선택하세요.');
    try {
      const uploaded = await uploadProductImages(files, fileTypes);
      setUploadedImages(uploaded);
      alert('이미지 업로드 성공');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '이미지 업로드 실패';
      alert(msg);
    }
  };

  const handleLoadBizFromProfile = async () => {
    if (!onLoadBizFromProfile) return;
    const res = (await onLoadBizFromProfile()) || {};
    setBizInfo((prev) => ({
      ...prev,
      companyName: res.companyName ?? prev.companyName,
      bizNumber: res.bizNumber ?? prev.bizNumber,
      ceoName: res.ceoName ?? prev.ceoName,
    }));
  };

  // 폼 payload
  const buildPayload = (): ProductCreatePayload => ({
    brand,
    title,
    modelName,
    category1,
    category2,
    size,
    material,
    origin,
    price,
    discountRate,
    stock,
    minQty,
    maxQty,
    bundleShipping,
    shipping: {
      type: shippingType,
      fee: shippingType === 'FREE' ? 0 : shippingFee,
      freeThreshold: shippingType === 'CONDITIONAL' ? freeThreshold : null,
      jejuExtraFee,
    },
    plannedSale: isPlanned ? { startAt: saleStart, endAt: saleEnd } : null,
    tags,
    options: useOptions ? options : [],
    addons: useOptions ? addons : [],
    lawCert: lawCertRequired ? { required: true, detail: lawCertDetail } : { required: false },
    description: editorValue,
    bizInfo,         // 서버 전송 X
    attachments: [], // 서버 전송 X
  });

  // 생성 
  const handleCreate = async () => {
    const payload = buildPayload();
    if (!payload.title.trim()) return alert('상품명을 입력해주세요.');
    if (payload.price < 0) return alert('판매가는 0 이상이어야 합니다.');
    if (payload.shipping.type === 'CONDITIONAL' && (!payload.shipping.freeThreshold || payload.shipping.freeThreshold <= 0))
      return alert('조건부 무료배송 기준 금액을 입력해주세요.');

    const dto = toProductCreateDto(payload, { uploadedImages, tagDict });
    const newUuid = await createProduct(dto);
    onCreated?.({ productUuid: newUuid, payload });
    alert(`상품 등록 성공: ${newUuid}`);
    onClose();
  };

// 수정
const handleUpdate = async () => {
  if (!productUuid) return alert('상품 식별자가 없습니다.');
  const payload = buildPayload();

  if (!payload.title.trim()) return alert('상품명을 입력해주세요.');
  if (payload.price < 0) return alert('판매가는 0 이상이어야 합니다.');
  if (payload.shipping.type === 'CONDITIONAL' && (!payload.shipping.freeThreshold || payload.shipping.freeThreshold <= 0)) {
    return alert('조건부 무료배송 기준 금액을 입력해주세요.');
  }

  try {
    setSubmitting(true);
    const dto = toProductCreateDto(payload, { uploadedImages, tagDict });
    const updatedUuid = await updateProduct(productUuid, dto);
    onUpdated?.({ productUuid: updatedUuid, payload });
    alert('상품이 수정되었습니다.');
    onClose();
  } catch (e) {
    const msg = e instanceof Error ? e.message : '상품 수정 중 오류가 발생했습니다.';
    alert(msg);
  } finally {
    setSubmitting(false);
  }
};

// 삭제 
const handleDelete = async () => {
  if (!productUuid) return alert('상품 식별자가 없습니다.');
  if (!confirm('정말 삭제하시겠어요?')) return;

  try {
    setSubmitting(true);
    const deletedUuid = await deleteProduct(productUuid);
    onDeleted?.({ productUuid: deletedUuid });
    alert('상품이 삭제되었습니다.');
    onClose();
  } catch (e) {
    const msg = e instanceof Error ? e.message : '상품 삭제 중 오류가 발생했습니다.';
    alert(msg);
  } finally {
    setSubmitting(false);
  }
};

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl overflow-hidden shadow-xl w-[960px] max-w-[95vw] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 z-10 bg-white px-6 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{mode === 'edit' ? '상품 수정' : '상품 등록'}</h2>

            <button
              className="cursor-pointer rounded transition hover:bg-black/5 p-2"
              onClick={onClose}
              aria-label="닫기"
            >
              <X width={16} height={16} />
            </button>
          </div>
        </div>
        <hr />

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-8">
          {/* 기본 정보 */}
          <section className="space-y-4">
            <h3 className="text-base font-semibold">기본 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-sm">브랜드</span>
                <input
                  value={brand}
                  readOnly
                  className="flex-1 rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm bg-gray-50"
                />
              </label>

              <label className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-sm">상품명</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="flex-1 rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                />
              </label>

              <label className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-sm">모델명</span>
                <input
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="flex-1 rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                />
              </label>

              <div className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-sm">카테고리</span>
                {/* 상위 카테고리 */}
                <select
                  value={category1}
                  onChange={(e) => {
                    setCategory1(e.target.value);
                    setCategory2('');
                  }}
                  disabled={catsLoading || !!catsErr}
                  className="rounded border border-[var(--color-gray-200)] py-2 px-3 text-sm"
                >
                  <option value="">
                    {catsLoading ? '불러오는 중…' : catsErr ? '불러오기 실패' : '상위 카테고리'}
                  </option>
                  {!catsLoading &&
                    !catsErr &&
                    catTree.map((c: Category) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.categoryName}
                      </option>
                    ))}
                </select>
                {/* 하위 카테고리 */}
                <select
                  value={category2}
                  onChange={(e) => setCategory2(e.target.value)}
                  disabled={!category1 || catsLoading || !!catsErr}
                  className="rounded border border-[var(--color-gray-200)] py-2 px-3 text-sm"
                >
                  <option value="">
                    {!category1
                      ? '하위 카테고리'
                      : subOptions.length
                      ? '하위 카테고리'
                      : '하위 카테고리 없음'}
                  </option>
                  {category1 &&
                    subOptions.map((s: Category) => (
                      <option key={s.id} value={String(s.id)}>
                        {s.categoryName}
                      </option>
                    ))}
                </select>
              </div>

              <label className="flex items-center gap-3">
                <span className="w-28 text-sm">사이즈</span>
                <input
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="flex-1 rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                />
              </label>
              <label className="flex items-center gap-3">
                <span className="w-28 text-sm">재질</span>
                <input
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="flex-1 rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                />
              </label>
              <label className="flex items-center gap-3">
                <span className="w-28 text-sm">원산지</span>
                <input
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="flex-1 rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                />
              </label>
            </div>
          </section>

          <hr />

          {/* 가격 / 재고 */}
          <section className="space-y-4">
            <h3 className="text-base font-semibold">가격 / 재고</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-3">
                <span className="w-28 text-sm">판매가</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value) || 0)}
                  className="flex-1 rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                />
              </label>
              <label className="flex items-center gap-3">
                <span className="w-28 text-sm">할인율(%)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={discountRate}
                  onChange={(e) => setDiscountRate(Number(e.target.value) || 0)}
                  className="flex-1 rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                />
              </label>
              <label className="flex items-center gap-3">
                <span className="w-28 text-sm">재고</span>
                <input
                  type="number"
                  min={0}
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value) || 0)}
                  className="flex-1 rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                />
              </label>
              <label className="flex items-center gap-3">
                <span className="w-28 text-sm">최소구매</span>
                <input
                  type="number"
                  min={1}
                  value={minQty}
                  onChange={(e) => setMinQty(Number(e.target.value) || 1)}
                  className="flex-1 rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                />
              </label>
              <label className="flex items-center gap-3">
                <span className="w-28 text-sm">최대구매</span>
                <input
                  type="number"
                  min={0}
                  value={maxQty}
                  onChange={(e) => setMaxQty(Number(e.target.value) || 0)}
                  placeholder="0 = 제한 없음"
                  className="flex-1 rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                />
              </label>
            </div>
          </section>

          <hr />

          {/* 배송 정보 */}
          <section className="space-y-4">
            <h3 className="text-base font-semibold">배송 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-3">
                <span className="w-32 text-sm">묶음배송 가능</span>
                <input
                  type="checkbox"
                  checked={bundleShipping}
                  onChange={(e) => setBundleShipping(e.target.checked)}
                />
              </label>

              <label className="flex items-center gap-3">
                <span className="w-32 text-sm">배송비 유형</span>
                <select
                  value={shippingType}
                  onChange={(e) => setShippingType(e.target.value as ShippingTypeUI)}
                  className="flex-1 rounded border border-[var(--color-gray-200)] py-2 px-3 text-sm"
                >
                  <option value="FREE">무료배송</option>
                  <option value="PAID">유료배송</option>
                  <option value="CONDITIONAL">조건부 무료배송</option>
                </select>
              </label>

              {(shippingType === 'PAID' || shippingType === 'CONDITIONAL') && (
                <label className="flex items-center gap-3">
                  <span className="w-32 text-sm">배송비</span>
                  <input
                    type="number"
                    min={0}
                    value={shippingFee}
                    onChange={(e) => setShippingFee(Number(e.target.value) || 0)}
                    className="flex-1 rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                  />
                </label>
              )}

              {shippingType === 'CONDITIONAL' && (
                <label className="flex items-center gap-3 md:col-span-2">
                  <span className="w-32 text-sm">무료배송 기준(원)</span>
                  <input
                    type="number"
                    min={0}
                    value={freeThreshold}
                    onChange={(e) => setFreeThreshold(Number(e.target.value) || 0)}
                    className="flex-1 rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                  />
                </label>
              )}

              <label className="flex items-center gap-3">
                <span className="w-32 text-sm">제주 추가배송비</span>
                <input
                  type="number"
                  min={0}
                  value={jejuExtraFee}
                  onChange={(e) => setJejuExtraFee(Number(e.target.value) || 0)}
                  className="flex-1 rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                />
              </label>
            </div>
          </section>

          <hr />

          {/* 판매 설정 */}
          <section className="space-y-4">
            <h3 className="text-base font-semibold">판매 설정</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-3">
                <span className="w-32 text-sm">기획상품</span>
                <input
                  type="checkbox"
                  checked={isPlanned}
                  onChange={(e) => setIsPlanned(e.target.checked)}
                />
              </label>

              {isPlanned && (
                <>
                  <label className="flex items-center gap-3">
                    <span className="w-32 text-sm">판매 시작일</span>
                    <input
                      type="datetime-local"
                      value={saleStart}
                      onChange={(e) => setSaleStart(e.target.value)}
                      className="flex-1 rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="flex items-center gap-3">
                    <span className="w-32 text-sm">판매 종료일</span>
                    <input
                      type="datetime-local"
                      value={saleEnd}
                      onChange={(e) => setSaleEnd(e.target.value)}
                      className="flex-1 rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                    />
                  </label>
                </>
              )}

              {/* 태그(스타일) */}
              <div className="md:col-span-3">
                <div className="flex items-start gap-3">
                  <span className="w-32 shrink-0 text-sm mt-2">태그(스타일)</span>

                  {tagsLoading ? (
                    <p className="text-sm text-gray-500 mt-2">태그 불러오는 중...</p>
                  ) : tagsError ? (
                    <p className="text-sm text-red-500 mt-2">{tagsError}</p>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {tagsRemote.map((t) => (
                        <label
                          key={t.id}
                          className="inline-flex items-center gap-2 text-sm border rounded px-2 py-1"
                        >
                          <input
                            type="checkbox"
                            checked={tags.includes(t.tagName)}
                            onChange={(e) =>
                              setTags((prev) =>
                                e.target.checked
                                  ? [...prev, t.tagName]
                                  : prev.filter((x) => x !== t.tagName)
                              )
                            }
                          />
                          <span>{t.tagName}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <hr />

          {/* 옵션 / 추가상품 */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">옵션 / 추가상품</h3>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={useOptions}
                  onChange={(e) => setUseOptions(e.target.checked)}
                />
                옵션/추가상품 사용
              </label>
            </div>

            {useOptions && (
              <>
                <div className="space-y-2">
                  <div className="text-sm font-medium">옵션</div>
                  {options.map((opt, idx) => (
                    <div key={opt.id} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <input
                        placeholder="옵션명 (예: 색상/레드)"
                        value={opt.name}
                        onChange={(e) => updateOption(idx, { name: e.target.value })}
                        className="rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        placeholder="추가금(원)"
                        value={opt.extraPrice ?? 0}
                        onChange={(e) =>
                          updateOption(idx, { extraPrice: Number(e.target.value) || 0 })
                        }
                        className="rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        placeholder="재고"
                        value={opt.stock ?? 0}
                        onChange={(e) => updateOption(idx, { stock: Number(e.target.value) || 0 })}
                        className="rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                      />
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => removeOption(idx)}
                          className="text-sm border rounded px-3 py-2 hover:bg-black/5"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addOption}
                    className="text-sm border rounded px-3 py-2 hover:bg-black/5"
                  >
                    옵션 추가
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">추가상품</div>
                  {addons.map((ad, idx) => (
                    <div key={ad.id} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <input
                        placeholder="추가상품명"
                        value={ad.name}
                        onChange={(e) => updateAddon(idx, { name: e.target.value })}
                        className="rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        placeholder="추가금(원)"
                        value={ad.extraPrice ?? 0}
                        onChange={(e) =>
                          updateAddon(idx, { extraPrice: Number(e.target.value) || 0 })
                        }
                        className="rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        placeholder="재고"
                        value={ad.stock ?? 0}
                        onChange={(e) => updateAddon(idx, { stock: Number(e.target.value) || 0 })}
                        className="rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                      />
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => removeAddon(idx)}
                          className="text-sm border rounded px-3 py-2 hover:bg-black/5"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addAddon}
                    className="text-sm border rounded px-3 py-2 hover:bg-black/5"
                  >
                    추가상품 추가
                  </button>
                </div>
              </>
            )}
          </section>

          <hr />

          {/* 인증 / 사업자 정보 */}
          <section className="space-y-4">
            <h3 className="text-base font-semibold">인증 / 사업자 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-3">
                <span className="w-40 text-sm">법적 인증/허가 필요</span>
                <input
                  type="checkbox"
                  checked={lawCertRequired}
                  onChange={(e) => setLawCertRequired(e.target.checked)}
                />
              </label>

              {lawCertRequired && (
                <label className="md:col-span-2 flex items-center gap-3">
                  <span className="w-40 text-sm">인증/허가 상세</span>
                  <input
                    value={lawCertDetail}
                    onChange={(e) => setLawCertDetail(e.target.value)}
                    placeholder="예: 전기용품 안전인증 번호 등"
                    className="flex-1 rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                  />
                </label>
              )}

              <div className="md:col-span-3 flex items-center gap-3">
                <span className="w-40 text-sm">사업자 정보</span>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    value={bizInfo.companyName}
                    onChange={(e) => setBizInfo({ ...bizInfo, companyName: e.target.value })}
                    placeholder="상호"
                    className="rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                  />
                  <input
                    value={bizInfo.bizNumber}
                    onChange={(e) => setBizInfo({ ...bizInfo, bizNumber: e.target.value })}
                    placeholder="사업자등록번호"
                    className="rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                  />
                  <input
                    value={bizInfo.ceoName}
                    onChange={(e) => setBizInfo({ ...bizInfo, ceoName: e.target.value })}
                    placeholder="대표자명"
                    className="rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                  />
                </div>
                {onLoadBizFromProfile && (
                  <button
                    type="button"
                    onClick={handleLoadBizFromProfile}
                    className="shrink-0 text-sm border rounded px-3 py-2 hover:bg-black/5"
                  >
                    불러오기
                  </button>
                )}
              </div>
            </div>
          </section>

          <hr />

          {/* 내용(에디터) */}
          <section className="space-y-2">
            <span className="text-sm">내용</span>
            <NoticeEditor
              value={editorValue}
              onChange={setEditorValue}
              onUploadImage={async (file) => URL.createObjectURL(file)}
              minHeight={120}
              maxHeight={180}
            />
          </section>

          {/* 첨부파일 */}
          <section className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="shrink-0 text-sm">첨부파일</span>
                <Paperclip className="block size-4 overflow-visible text-[var(--color-gray-200)] shrink-0" />
              </div>
              <div className="relative flex-1">
                <input
                  id="fileInput"
                  type="file"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    const list = Array.from(e.target.files ?? []);
                    handleSelectFiles(list);
                    // 같은 파일을 다시 선택할 수 있도록 초기화
                    e.currentTarget.value = '';
                  }}
                />
                <input
                  type="text"
                  readOnly
                  value={
                    files.length === 0
                      ? ''
                      : files.length === 1
                      ? files[0].name
                      : `${files[0].name} 외 ${files.length - 1}개`
                  }
                  placeholder="파일을 선택하세요"
                  className="w-full rounded border border-[var(--color-gray-200)] px-3 py-2 pr-24 leading-none text-sm"
                  onClick={() => document.getElementById('fileInput')?.click()}
                />
                {files.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setFiles([]);
                      setFileTypes([]);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-[var(--color-primary)] px-3 py-1 text-sm leading-none transition hover:bg-primary-20"
                  >
                    파일 삭제
                  </button>
                ) : (
                  <label
                    htmlFor="fileInput"
                    className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded border border-[var(--color-primary)] px-3 py-1 text-sm leading-none transition hover:bg-primary-20"
                  >
                    파일 선택
                  </label>
                )}
              </div>
            </div>
          </section>

          {/* 파일 타입 지정 + 업로드 버튼 */}
          {files.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">업로드할 파일 타입</p>
                {files.map((file, idx) => (
                  <div key={`${file.name}-${file.size}-${idx}`} className="flex items-center gap-3 text-sm">
                    {/* 미리보기 */}
                    <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                      {previews[idx] ? (
                        <img
                          src={previews[idx]}
                          alt={file.name}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                      ) : (
                        <span className="text-[10px] text-gray-500 px-1 text-center leading-tight">
                          미리보기 없음
                        </span>
                      )}
                    </div>

                    {/* 파일명 */}
                    <span className="flex-1 truncate">{file.name}</span>

                    {/* 타입 선택 */}
                    <select
                      value={fileTypes[idx]}
                      onChange={(e) => handleChangeFileType(idx, e.target.value as UploadType)}
                      className="rounded border border-[var(--color-gray-200)] py-1.5 px-2"
                    >
                      <option value="MAIN">대표 이미지</option>
                      <option value="ADDITIONAL">추가 이미지</option>
                      <option value="THUMBNAIL">썸네일</option>
                      <option value="DOCUMENT">문서</option>
                    </select>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleUploadImages}
                  className="text-sm border border-[var(--color-primary)] rounded-md px-3 py-2 hover:bg-primary-20"
                >
                  업로드
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <hr />
        <div className="sticky bottom-0 z-10 bg-white px-6 py-4 flex justify-between gap-2">
          
          {/* 전체 초기화 버튼 */}
          <div>
            {mode === 'edit' && (
              <button
                onClick={resetAll}
                className="px-3 py-2 rounded-md border border-red-500 text-red-600 font-semibold text-sm cursor-pointer"
              >
                초기화
              </button>
            )}
          </div>

          {/* 우측: 취소/제출 */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-md border border-primary text-primary font-semibold text-sm cursor-pointer"
            >
              {mode === 'edit' ? '수정취소' : '작성취소'}
            </button>
            {mode === 'edit' ? (
              <button
                onClick={handleUpdate} disabled={submitting}
                className="px-3 py-2 rounded-md border border-primary bg-primary text-white font-semibold text-sm cursor-pointer"
              >
                수정하기
              </button>
            ) : (
              <button
                onClick={handleCreate} disabled={submitting}
                className="px-3 py-2 rounded-md border border-primary bg-primary text-white font-semibold text-sm cursor-pointer"
              >
                작성하기
              </button>
            )}
            </div>
          </div>
      </div>
    </div>
  );
}
