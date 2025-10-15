'use client';

import { useEffect, useMemo, useState } from 'react';
import X from '@/assets/icon/x.svg';
import Paperclip from '@/assets/icon/paperclip2.svg';
import NoticeEditor from '@/components/editor/NoticeEditor';
import {
  createProduct,
  updateProduct,
  uploadDescriptionImages,
  uploadProductImages,
  deleteProductImage,
} from '@/services/products';
import { fetchCategoriesClient } from '@/lib/client/categories.client';
import type { Category } from '@/types/category';
import { fetchTagsClient } from '@/lib/client/tags.client';
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

// === 유틸 ===

// 서버 LocalDate(YYYY-MM-DD) 보내기
const dateOnly = (s?: string | null) => {
  if (!s) return null;
  const d = s.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
};
const isBlank = (v?: string | null) => !v || v.trim().length === 0;

const normalizeTagName = (s?: string) => (s ?? '').trim().toLowerCase();

// 파일 고유키
const fileKey = (f: File) => `${f.name}-${f.size}-${f.lastModified}`;

// 허용 타입만: MAIN | THUMBNAIL
type AllowedType = Extract<UploadType, 'MAIN' | 'THUMBNAIL'>;
const asAllowed = (t: UploadType | undefined): AllowedType =>
  t === 'MAIN' ? 'MAIN' : 'THUMBNAIL';

// 파일 타입 배열에서 MAIN 인덱스 찾기
const findMainIndex = (types: UploadType[]) => types.findIndex((t) => t === 'MAIN');

// 작성 직전 파일 타입 동기화 (비허용 타입은 THUMBNAIL로 강제)
function syncUploadedTypes(
  files: File[],
  fileTypes: UploadType[],
  uploaded: UploadedImageInfo[]
): UploadedImageInfo[] {
  const byName = new Map<string, AllowedType>();
  files.forEach((f, i) => byName.set(f.name, asAllowed(fileTypes[i])));

  return uploaded.map((u, i) => {
    const tByName = u.originalFileName ? byName.get(u.originalFileName) : undefined;
    if (tByName) return { ...u, type: tByName };
    const tByIndex = asAllowed(fileTypes[i]);
    return { ...u, type: tByIndex };
  });
}

// 폼 → 판매상태 계산
function computeSellingStatusFromPayload(p: ProductCreatePayload): 'BEFORE_SELLING' | 'SELLING' | 'SOLD_OUT' | 'END_OF_SALE' {
  const now = new Date();
  if (p.plannedSale) {
    const s = new Date(p.plannedSale.startAt);
    const e = p.plannedSale.endAt ? new Date(p.plannedSale.endAt) : undefined;
    if (!isNaN(s.getTime()) && now < s) return 'BEFORE_SELLING';
    if (e && !isNaN(e.getTime()) && now > e) return 'END_OF_SALE';
  }
  if ((p.stock ?? 0) <= 0) return 'SOLD_OUT';
  return 'SELLING';
}

// === DTO/API ===
type ArtistBizInfo = {
  businessName?: string;
  businessNumber?: string;
  ownerName?: string;
  asManager?: string;
  email?: string;
  businessAddress?: string;
  telecomSalesNumber?: string;
};
type ApiEnvelope<T> = { resultCode: string; msg: string; data: T | null };

async function fetchArtistBusinessInfo(): Promise<ArtistBizInfo | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/artist/business-info`, {
      method: 'GET',
      headers: { accept: 'application/json;charset=UTF-8' },
      credentials: 'include',
    });
    const json: ApiEnvelope<ArtistBizInfo> | undefined = await res.json().catch(() => undefined);

    if (!res.ok) {
      alert(json?.msg ?? '사업자 정보 조회 실패');
      return null;
    }
    return json?.data ?? null;
  } catch {
    alert('사업자 정보 조회 중 오류가 발생했습니다.');
    return null;
  }
}

function toProductCreateDto(
  payload: ProductCreatePayload,
  opts: { uploadedImages: UploadedImageInfo[]; tagDict: TagDict; isRestock?: boolean }
): ProductCreateDto {
  const categoryId = Number(payload.category2 || payload.category1);
  const deliveryType = payload.shipping.type === 'CONDITIONAL' ? 'CONDITIONAL_FREE' : payload.shipping.type;
  const sellingStatus = computeSellingStatusFromPayload(payload);

  // 이름 → ID 매핑
  const tagIds = (payload.tags ?? [])
    .map((name) => opts.tagDict[normalizeTagName(name)])
    .filter((id): id is number => Number.isInteger(id));

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
    conditionalFreeAmount: deliveryType === 'CONDITIONAL_FREE' ? (payload.shipping.freeThreshold ?? 0) : null,

    stock: payload.stock,
    description: payload.description,

    sellingStatus,
    displayStatus: 'DISPLAYING',

    minQuantity: payload.minQty,
    maxQuantity: payload.maxQty,

    isPlanned: !!payload.plannedSale,
    isRestock: !!opts.isRestock,

    sellingStartDate: payload.plannedSale ? dateOnly(payload.plannedSale.startAt) : null,
    sellingEndDate: payload.plannedSale ? dateOnly(payload.plannedSale.endAt) : null,

    tags: tagIds,

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
      type: asAllowed(img.type), // 안전: 비허용 타입이 와도 강제 캐스팅
      s3Key: img.s3Key,
      originalFileName: img.originalFileName,
    })),

    certification: payload.certification ?? false,
    origin: payload.origin,
    material: payload.material,
    size: payload.size,
  };
}

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (args: { productUuid: string; payload: ProductCreatePayload }) => void;
  mode?: 'create' | 'edit';
  productUuid?: string;
  initialPayload?: ProductCreatePayload;
  onUpdated?: (args: { productUuid: string; payload: ProductCreatePayload }) => void;
  onDeleted?: (args: { productUuid: string }) => void;
  productId?: string;
  onSaveSnapshot?: (productId: string, payload: ProductCreatePayload) => void;
  initialBrand?: string;
  initialBizInfo?: {
    businessName?: string;
    businessNumber?: string;
    ownerName?: string;
    asManager?: string;
    email?: string;
    businessAddress?: string;
    telecomSalesNumber?: string;
  }
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
  productId,
  onSaveSnapshot,
  initialBrand = '모리모리',
  initialBizInfo,
}: Props) {
  // === 상태들 ===
  const [brand, setBrand] = useState(initialBrand);
  const [title, setTitle] = useState('');
  const [modelName, setModelName] = useState('');
  const [category1, setCategory1] = useState('');
  const [category2, setCategory2] = useState('');

  // 카테고리/태그
  const [catTree, setCatTree] = useState<Category[]>([]);
  const [catsLoading, setCatsLoading] = useState(false);
  const [catsErr, setCatsErr] = useState<string | null>(null);
  const [tagsRemote, setTagsRemote] = useState<RemoteTag[]>([]);
  const [tagsError, setTagsError] = useState<string | null>(null);
  const [tagsLoading, setTagsLoading] = useState(false);

  // 상세
  const [size, setSize] = useState('');
  const [material, setMaterial] = useState('');
  const [origin, setOrigin] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [discountRate, setDiscountRate] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [minQty, setMinQty] = useState<number>(1);
  const [maxQty, setMaxQty] = useState<number>(0);

  const [bundleShipping, setBundleShipping] = useState<boolean>(true);
  const [shippingType, setShippingType] = useState<ShippingTypeUI>('FREE');
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [freeThreshold, setFreeThreshold] = useState<number>(0);
  const [jejuExtraFee, setJejuExtraFee] = useState<number>(0);

  const [isPlanned, setIsPlanned] = useState<boolean>(false);
  const [saleStart, setSaleStart] = useState<string>('');
  const [saleEnd, setSaleEnd] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [isRestock, setIsRestock] = useState<boolean>(false);

  const [useOptions, setUseOptions] = useState<boolean>(false);
  const [options, setOptions] = useState<ProductOptionUI[]>([]);
  const [addons, setAddons] = useState<ProductAddonUI[]>([]);

  const addOption = () => setOptions((p) => [...p, { id: crypto.randomUUID(), name: '' }]);
  const removeOption = (idx: number) => setOptions((p) => p.filter((_, i) => i !== idx));
  const updateOption = (idx: number, patch: Partial<ProductOptionUI>) =>
    setOptions((p) => p.map((o, i) => (i === idx ? { ...o, ...patch } : o)));
  const addAddon = () => setAddons((p) => [...p, { id: crypto.randomUUID(), name: '' }]);
  const removeAddon = (idx: number) => setAddons((p) => p.filter((_, i) => i !== idx));
  const updateAddon = (idx: number, patch: Partial<ProductAddonUI>) =>
    setAddons((p) => p.map((o, i) => (i === idx ? { ...o, ...patch } : o)));

  const [lawCertRequired, setLawCertRequired] = useState<boolean>(false);

  // 7개 사업자 정보
  const [bizInfo, setBizInfo] = useState({
    businessName: initialBizInfo?.businessName ?? '',
    businessNumber: initialBizInfo?.businessNumber ?? '',
    ownerName: initialBizInfo?.ownerName ?? '',
    asManager: initialBizInfo?.asManager ?? '',
    email: initialBizInfo?.email ?? '',
    businessAddress: initialBizInfo?.businessAddress ?? '',
    telecomSalesNumber: initialBizInfo?.telecomSalesNumber ?? '',
  });
  const [bizLoading, setBizLoading] = useState(false);

  const [editorValue, setEditorValue] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [fileTypes, setFileTypes] = useState<UploadType[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImageInfo[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [editorFullscreen, setEditorFullscreen] = useState(false);

  // 업로드 진행 상태
  const [uploadingMap, setUploadingMap] = useState<Record<string, 'idle' | 'uploading' | 'done' | 'error'>>({});
  // 파일 → s3Key 매핑
  const [fileS3Map, setFileS3Map] = useState<Record<string, string | null>>({});

  // ESC로 닫기
  useEffect(() => {
    if (!editorFullscreen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setEditorFullscreen(false); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [editorFullscreen]);

  // 모달 열릴 때 태그/카테고리 로드
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

  useEffect(() => {
    if (!open) return;

    if (mode === 'create') {
      // 초기화
      setBrand(initialBrand ?? '모리모리');
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
      setIsRestock(false);
      setUseOptions(false);
      setOptions([]);
      setAddons([]);
      setLawCertRequired(false);
      setBizInfo({
        businessName: initialBizInfo?.businessName ?? '',
        businessNumber: initialBizInfo?.businessNumber ?? '',
        ownerName: initialBizInfo?.ownerName ?? '',
        asManager: initialBizInfo?.asManager ?? '',
        email: initialBizInfo?.email ?? '',
        businessAddress: initialBizInfo?.businessAddress ?? '',
        telecomSalesNumber: initialBizInfo?.telecomSalesNumber ?? '',
      });
      setEditorValue('');

      setFiles([]);
      setPreviews([]);
      setUploadedImages([]);
      setUploadingMap({});
      setFileS3Map({});
      setFileTypes([]);
      return;
    }

    if (mode === 'edit' && initialPayload) {
      hydrateFromPayload(initialPayload);
    }
  }, [open, mode, initialPayload, initialBrand, initialBizInfo]);

  const subOptions = useMemo(() => {
    const root = catTree.find((c) => String(c.id) === category1);
    return root?.subCategories ?? [];
  }, [catTree, category1]);

  // 태그명 키를 정규화해서 저장
  const tagDict = useMemo(() => {
    const dict: TagDict = {};
    const normalize = (s?: string) => (s ?? '').trim().toLowerCase();
    tagsRemote.forEach((t) => {
      if (t?.tagName) dict[normalize(t.tagName)] = t.id;
    });
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

    setBundleShipping(!!payload.bundleShipping);
    setShippingType(payload.shipping?.type ?? 'FREE');
    setShippingFee(payload.shipping?.type === 'FREE' ? 0 : (payload.shipping?.fee ?? 0));
    setFreeThreshold(payload.shipping?.type === 'CONDITIONAL' ? (payload.shipping?.freeThreshold ?? 0) : 0);
    setJejuExtraFee(payload.shipping?.jejuExtraFee ?? 0);

    const planned = !!payload.plannedSale;
    setIsPlanned(planned);
    setSaleStart(planned ? (payload.plannedSale?.startAt ?? '') : '');
    setSaleEnd(planned ? (payload.plannedSale?.endAt ?? '') : '');

    setIsRestock(false);

    setTags(payload.tags ?? []);
    const usingOptions = (payload.options?.length ?? 0) > 0 || (payload.addons?.length ?? 0) > 0;
    setUseOptions(usingOptions);
    setOptions(payload.options ?? []);
    setAddons(payload.addons ?? []);

    setBizInfo((prev) => ({
      businessName: payload.bizInfo?.businessName ?? prev.businessName ?? '',
      businessNumber: payload.bizInfo?.bizNumber ?? prev.businessNumber ?? '',
      ownerName: payload.bizInfo?.ceoName ?? prev.ownerName ?? '',
      asManager: prev.asManager ?? '',
      email: prev.email ?? '',
      businessAddress: prev.businessAddress ?? '',
      telecomSalesNumber: prev.telecomSalesNumber ?? '',
    }));

    setEditorValue(payload.description ?? '');
  }

  // === 파일 선택 → 자동 업로드 ===
  const handleSelectFiles = async (incoming: File[]) => {
    if (incoming.length === 0) return;

    // 중복 제거
    const dedup = incoming.filter(
      (nf) => !files.some((ef) => fileKey(ef) === fileKey(nf))
    );
    if (dedup.length === 0) return;

    // UI 표시용 파일/타입 상태 갱신
    const nextFiles = [...files, ...dedup];
    setFiles(nextFiles);

    // 타입 기본값: 첫 파일만 MAIN, 나머지는 THUMBNAIL
    const defaultsForNew: AllowedType[] = dedup.map((_, i) =>
      files.length === 0 && i === 0 ? 'MAIN' : 'THUMBNAIL'
    );

    // 기존에 이미 MAIN이 있었다면 새로 들어온 것들은 모두 THUMBNAIL
    const alreadyMainIdx = findMainIndex(fileTypes);
    if (alreadyMainIdx >= 0) {
      for (let i = 0; i < defaultsForNew.length; i++) defaultsForNew[i] = 'THUMBNAIL';
    }

    setFileTypes((prev) => [...prev, ...defaultsForNew]);

    // 업로드 상태: 신규 파일만 uploading 마킹
    setUploadingMap((prev) => {
      const next = { ...prev };
      dedup.forEach((f) => (next[fileKey(f)] = 'uploading'));
      return next;
    });

    // 신규로 선택한 파일만 업로드
    try {
  const uploaded = await uploadProductImages(dedup, defaultsForNew);

  // ✅ 기존 타입과 겹치는 이미지는 교체 (누적 X)
  setUploadedImages((prev) => {
    const next = [...prev];

    for (const newImg of uploaded) {
      // 같은 타입이 이미 있으면 교체
      const existingIndex = next.findIndex((img) => img.type === newImg.type);
      if (existingIndex !== -1) {
        next[existingIndex] = newImg;
      } else {
        next.push(newImg);
      }
    }

    return next;
  });

  // 파일 → s3Key 매핑 저장
  setFileS3Map((prev) => {
    const next = { ...prev };
    dedup.forEach((f, i) => {
      const key = fileKey(f);
      const s3Key = uploaded[i]?.s3Key ?? null;
      next[key] = s3Key;
    });
    return next;
  });

  // 상태 완료 처리
  setUploadingMap((prev) => {
    const next = { ...prev };
    dedup.forEach((f) => (next[fileKey(f)] = 'done'));
    return next;
  });
} catch (e: unknown) {
  const msg = e instanceof Error ? e.message : '이미지 업로드 실패';
  alert(msg);

  setUploadingMap((prev) => {
    const next = { ...prev };
    dedup.forEach((f) => (next[fileKey(f)] = 'error'));
    return next;
  });
}
  };

  // 타입 변경 (항상 MAIN 1개 유지)
  const handleChangeFileType = (index: number, newType: UploadType) => {
    const allowed = asAllowed(newType);
    setFileTypes((prev) => {
      const updated = [...prev];

      if (allowed === 'MAIN') {
        const oldMain = findMainIndex(updated);
        if (oldMain >= 0 && oldMain !== index) updated[oldMain] = 'THUMBNAIL';
        updated[index] = 'MAIN';
        return updated;
      }

      // allowed === 'THUMBNAIL'
      const isTurningOffLastMain = updated[index] === 'MAIN';
      updated[index] = 'THUMBNAIL';

      if (isTurningOffLastMain) {
        // 다른 파일 중 첫 번째를 MAIN으로 승격 (없으면 그대로 두고, 저장 시 검증)
        const otherIdx = updated.findIndex((_, i) => i !== index);
        if (otherIdx >= 0) updated[otherIdx] = 'MAIN';
      }

      return updated;
    });
  };

  // (에디터) 설명 이미지 업로드
  const handleUploadDescImage = async (fileOrFiles: File | File[] | FileList): Promise<string> => {
    const files: File[] = Array.isArray(fileOrFiles)
      ? fileOrFiles
      : fileOrFiles instanceof FileList
      ? Array.from(fileOrFiles)
      : [fileOrFiles];

    let urls: string[] = [];
    try {
      urls = await uploadDescriptionImages(files);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '설명 이미지 업로드에 실패했습니다.';
      alert(msg);
      throw e;
    }

    if (!urls.length) throw new Error('설명 이미지 URL을 받지 못했습니다.');

    setEditorValue((prev) => {
      const imgs = urls.map((u) => `<p><img src="${u}" alt="" /></p>`).join('');
      return (prev ?? '') + imgs;
    });

    return urls[0];
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
    certification: lawCertRequired,
    description: editorValue,
  });

  // 저장 전 검증(백엔드 규칙 + 이미지 타입 규칙)
  function validateAgainstBackendRules(
    p: ProductCreatePayload,
    ctx: {
      uploadedImages: UploadedImageInfo[];
      shippingType: ShippingTypeUI;
      usingOptions: boolean;
      bundleShippingAvailable: boolean;
      isRestock: boolean;
      isPlanned: boolean;
    }
  ) {
    const errs: string[] = [];

    // 필수 텍스트
    if (isBlank(p.title)) errs.push('상품명은 필수입니다.');
    if (isBlank(p.brand)) errs.push('브랜드명은 필수입니다.');
    if (isBlank(p.modelName)) errs.push('품명/모델명은 필수입니다.');
    const hasCategory = !!p.category2 || !!p.category1;
    if (!hasCategory) errs.push('카테고리를 선택해주세요.');
    if (isBlank(p.size)) errs.push('사이즈는 필수입니다.');
    if (isBlank(p.material)) errs.push('재질은 필수입니다.');
    if (isBlank(p.origin)) errs.push('제조국은 필수입니다.');

    // 가격/재고/할인
    if (p.price == null || p.price < 1) errs.push('정가는 최소 1 이상이어야 합니다.');
    if (p.discountRate == null || p.discountRate < 0 || p.discountRate > 100)
      errs.push('할인율은 0 이상 100 이하이어야 합니다.');
    if (p.stock == null || p.stock < 1) errs.push('재고는 최소 1 이상이어야 합니다.');

    // 구매수량
    if (p.minQty == null || p.minQty < 1) errs.push('최소 구매 수량은 1 이상이어야 합니다.');
    if (p.maxQty == null || p.maxQty < 1) errs.push('최대 구매 수량은 1 이상이어야 합니다.');
    if (p.minQty != null && p.maxQty != null && p.maxQty < p.minQty)
      errs.push('최대 구매 수량은 최소 구매 수량 이상이어야 합니다.');

    // 배송
    if (!p.shipping?.type) {
      errs.push('배송비 유형은 필수입니다.');
    } else {
      switch (ctx.shippingType) {
        case 'FREE':
          if (p.shipping.jejuExtraFee == null || p.shipping.jejuExtraFee < 0) {
            errs.push('무료배송 시 제주 추가배송비를 입력해주세요 (0 이상).');
          }
          break;
        case 'PAID':
          if (p.shipping.fee == null || p.shipping.fee <= 0) {
            errs.push('유료배송 시 배송비를 입력해주세요 (1원 이상).');
          }
          if (p.shipping.jejuExtraFee == null || p.shipping.jejuExtraFee < 0) {
            errs.push('유료배송 시 제주 추가배송비를 입력해주세요 (0 이상).');
          }
          break;
        case 'CONDITIONAL':
          if (p.shipping.fee == null || p.shipping.fee < 0) {
            errs.push('조건부 무료배송 시 기본 배송비를 입력해주세요 (0 이상).');
          }
          if (p.shipping.freeThreshold == null || p.shipping.freeThreshold <= 0) {
            errs.push('조건부 무료배송 기준 금액을 입력해주세요.');
          }
          if (p.shipping.jejuExtraFee == null || p.shipping.jejuExtraFee < 0) {
            errs.push('조건부 무료배송 시 제주 추가배송비를 입력해주세요 (0 이상).');
          }
          break;
        default:
          errs.push('배송비 유형은 필수입니다.');
      }
    }

    // 판매 설정
    if (typeof ctx.isPlanned !== 'boolean') errs.push('기획상품 여부는 필수입니다.');
    if (typeof ctx.isRestock !== 'boolean') errs.push('재입고 여부는 필수입니다.');
    if (p.plannedSale) {
      if (isBlank(p.plannedSale.startAt)) errs.push('기획상품의 판매 시작일을 입력해주세요.');
      if (p.plannedSale.endAt && p.plannedSale.startAt && new Date(p.plannedSale.endAt) < new Date(p.plannedSale.startAt)) {
        errs.push('판매 종료일은 시작일 이후여야 합니다.');
      }
    }

    // 태그/이미지
    if (!p.tags || p.tags.length < 1) errs.push('스타일 태그는 최소 1개 이상 선택해주세요.');
    const upImgs = ctx.uploadedImages ?? [];
    if (upImgs.length < 1) errs.push('이미지는 최소 1개 이상 업로드해야 합니다.');
    const types = upImgs.map((u) => asAllowed(u.type));
    const mainCount = types.filter((t) => t === 'MAIN').length;
    if (mainCount !== 1) errs.push('대표 이미지(MAIN)는 정확히 1개여야 합니다.');

    // KC 인증 여부
    if (p.certification == null) errs.push('KC 인증 여부는 필수입니다.');

    // 옵션/추가상품 사용 시
    if (ctx.usingOptions) {
      (p.options ?? []).forEach((o, i) => {
        if (isBlank(o.name)) errs.push(`옵션 #${i + 1}: 옵션명은 필수입니다.`);
        if (o.stock == null || o.stock < 1) errs.push(`옵션 #${i + 1}: 재고는 1 이상이어야 합니다.`);
        if (o.extraPrice == null || o.extraPrice < 0) errs.push(`옵션 #${i + 1}: 추가금은 0 이상이어야 합니다.`);
      });
      (p.addons ?? []).forEach((a, i) => {
        if (isBlank(a.name)) errs.push(`추가상품 #${i + 1}: 이름은 필수입니다.`);
        if (a.stock == null || a.stock < 1) errs.push(`추가상품 #${i + 1}: 재고는 1 이상이어야 합니다.`);
        if (a.extraPrice == null || a.extraPrice < 0) errs.push(`추가상품 #${i + 1}: 가격은 0 이상이어야 합니다.`);
      });
    }

    // 본문
    if (isBlank(p.description)) errs.push('상품 상세 설명은 필수입니다.');

    return errs;
  }

  // 개별 삭제
  const removeOneFile = async (idx: number) => {
    const target = files[idx];
    const key = fileKey(target);
    const status = uploadingMap[key] ?? 'idle';

    if (status === 'uploading') {
      alert('이 파일은 업로드 중이에요. 잠시 후 다시 시도해주세요.');
      return;
    }

    // s3Key 탐색
    const s3Key =
      fileS3Map[key] ??
      uploadedImages.find((u) => u.originalFileName === target.name)?.s3Key ??
      null;

    if (status === 'done' && s3Key) {
      try {
        await deleteProductImage(s3Key);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'S3 파일 삭제에 실패했습니다.';
        alert(msg);
        return;
      }
    }

    // 로컬 상태 제거
    const nextFiles = files.filter((_, i) => i !== idx);
    const nextTypes = fileTypes.filter((_, i) => i !== idx);
    const nextPreviews = previews.filter((_, i) => i !== idx);

    // 대표 이미지가 삭제되어 버렸다면, 남아있는 첫 항목을 MAIN으로 지정
    if (nextTypes.length > 0 && findMainIndex(nextTypes) < 0) {
      nextTypes[0] = 'MAIN';
    }

    setFiles(nextFiles);
    setFileTypes(nextTypes);
    setPreviews(nextPreviews);

    setUploadingMap((prev) => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });

    setFileS3Map((prev) => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });

    if (s3Key) {
      setUploadedImages((prev) => prev.filter((u) => u.s3Key !== s3Key));
    } else {
      setUploadedImages((prev) => prev.filter((u) => u.originalFileName !== target.name));
    }
  };

  // 생성
  const handleCreate = async () => {
    const payload = buildPayload();

    // 타입 동기화
    const syncedImages = syncUploadedTypes(files, fileTypes, uploadedImages);

    // 규칙 검증
    const errs = validateAgainstBackendRules(payload, {
      uploadedImages: syncedImages,
      shippingType,
      usingOptions: useOptions,
      bundleShippingAvailable: bundleShipping,
      isRestock,
      isPlanned,
    });
    if (errs.length) {
      alert(errs[0]);
      return;
    }

    const dto = toProductCreateDto(payload, { uploadedImages: syncedImages, tagDict, isRestock });

    try {
      setSubmitting(true);
      const newUuid = await createProduct(dto);
      onCreated?.({ productUuid: newUuid, payload });
      alert(`상품 등록 성공: ${newUuid}`);
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '등록 중 오류가 발생했습니다.';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // 수정
  const handleUpdate = async () => {
    const payload = buildPayload();
    if (!productUuid) {
      alert('이 상품의 productUuid를 찾지 못해 수정할 수 없습니다.');
      return;
    }

    // 타입 동기화
    const syncedImages = syncUploadedTypes(files, fileTypes, uploadedImages);

    // 규칙 검증
    const errs = validateAgainstBackendRules(payload, {
      uploadedImages: syncedImages,
      shippingType,
      usingOptions: useOptions,
      bundleShippingAvailable: bundleShipping,
      isRestock,
      isPlanned,
    });
    if (errs.length) {
      alert(errs[0]);
      return;
    }

    const dto = toProductCreateDto(payload, { uploadedImages: syncedImages, tagDict, isRestock });

    try {
      setSubmitting(true);
      const updatedUuid = await updateProduct(productUuid, dto);
      onUpdated?.({ productUuid: updatedUuid, payload });
      alert('상품이 수정되었습니다.');
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '수정 중 오류가 발생했습니다.';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // 닫기 전에 스냅샷 저장
  const handleCloseWithSave = () => {
    if (mode === 'edit' && productId && onSaveSnapshot) {
      onSaveSnapshot(productId, buildPayload());
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50" onClick={handleCloseWithSave}>
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
              onClick={handleCloseWithSave}
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
                  placeholder="예) 모리모리 스티커팩"
                  className="flex-1 rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                />
              </label>

              <label className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-sm">품명/모델명</span>
                <input
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="예) ABC-123"
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
                    {!category1 ? '하위 카테고리' : subOptions.length ? '하위 카테고리' : '하위 카테고리 없음'}
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
                  placeholder="예) 12x30x5cm"
                  className="flex-1 rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                />
              </label>
              <label className="flex items-center gap-3">
                <span className="w-28 text-sm">재질</span>
                <input
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="예) 면 100%"
                  className="flex-1 rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                />
              </label>
              <label className="flex items-center gap-3">
                <span className="w-28 text-sm">제조국</span>
                <input
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="예) 대한민국"
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
                  min={1}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value) || 1)}
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
                  min={1}
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value) || 1)}
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
                  min={1}
                  value={maxQty}
                  onChange={(e) => setMaxQty(Number(e.target.value) || 1)}
                  placeholder="최소 1 이상"
                  className="flex-1 rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                />
              </label>
            </div>
            <p className="inline-block text-xs text-gray-500 bg-primary-20 p-1">
              * 판매가 (≥1원), 재고 (≥1개), 최소/최대 구매 수량 (≥1개), 할인율 (0~100%)
            </p>
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
            <p className="inline-block text-xs text-gray-500 bg-primary-20 p-1">
              * 배송비 유형 (필수), 기본/추가 배송비 (≥0원), 조건부 무료 시 기준금액 필요합니다.
            </p>
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

              {/* 재입고 여부 */}
              <label className="flex items-center gap-3">
                <span className="w-32 text-sm">재입고 상품</span>
                <input
                  type="checkbox"
                  checked={isRestock}
                  onChange={(e) => setIsRestock(e.target.checked)}
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
                      {tagsRemote.map((t: RemoteTag) => {
                        const label = (t.tagName ?? '').trim();
                        if (!label) return null;
                        const checked = tags.includes(label);
                        return (
                          <label key={t.id} className="inline-flex items-center gap-2 text-sm border border-gray-200 rounded px-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                setTags((prev) => (e.target.checked ? [...prev, label] : prev.filter((x) => x !== label)))
                              }
                            />
                            <span className="py-2">{label}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                <p className="inline-block text-xs text-gray-500 bg-primary-20 p-1 my-2">
                  * 스타일 태그는 최소 1개 이상 선택해주세요.
                </p>
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
                        placeholder="옵션명"
                        value={opt.name}
                        onChange={(e) => updateOption(idx, { name: e.target.value })}
                        className="rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        min={1}
                        placeholder="재고"
                        value={opt.stock ?? 0}
                        onChange={(e) => updateOption(idx, { stock: Number(e.target.value) || 0 })}
                        className="rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        min={0}
                        placeholder="추가금(원)"
                        value={opt.extraPrice ?? 0}
                        onChange={(e) => updateOption(idx, { extraPrice: Number(e.target.value) || 0 })}
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
                        min={1}
                        placeholder="재고"
                        value={ad.stock ?? 0}
                        onChange={(e) => updateAddon(idx, { stock: Number(e.target.value) || 0 })}
                        className="rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        min={0}
                        placeholder="가격(원)"
                        value={ad.extraPrice ?? 0}
                        onChange={(e) => updateAddon(idx, { extraPrice: Number(e.target.value) || 0 })}
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
                    onClick={addAddon}
                    className="text-sm border rounded px-3 py-2 hover:bg-black/5"
                  >
                    추가상품 추가
                  </button>
                </div>
              </>
            )}
            <p className="inline-block text-xs text-gray-500 bg-primary-20 p-1">
              * 옵션/추가상품 사용 시 각 항목 이름 필수, 재고 (≥ 1개), 금액 (≥ 0원)
            </p>
          </section>

          <hr />

          {/* 인증 / 사업자 정보 */}
          <section className="space-y-4">
            <h3 className="text-base font-semibold">인증 / 사업자 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-3">
                <span className="w-40 text-sm">법적 인증/허가 필요(KC)</span>
                <input
                  type="checkbox"
                  checked={lawCertRequired}
                  onChange={(e) => setLawCertRequired(e.target.checked)}
                />
              </label>

              {/* 사업자 정보 7개 필드 + API 불러오기 */}
              <div className="md:col-span-3">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-40 text-sm">사업자 정보</span>
                  <button
                    type="button"
                    onClick={async () => {
                      setBizLoading(true);
                      const data = await fetchArtistBusinessInfo();
                      setBizLoading(false);
                      if (!data) return;
                      setBizInfo((prev) => ({
                        businessName: data.businessName ?? prev.businessName,
                        businessNumber: data.businessNumber ?? prev.businessNumber,
                        ownerName: data.ownerName ?? prev.ownerName,
                        asManager: data.asManager ?? prev.asManager,
                        email: data.email ?? prev.email,
                        businessAddress: data.businessAddress ?? prev.businessAddress,
                        telecomSalesNumber: data.telecomSalesNumber ?? prev.telecomSalesNumber,
                      }));
                    }}
                    className="shrink-0 text-sm border rounded px-3 py-2 hover:bg-black/5 disabled:opacity-60"
                    disabled={bizLoading}
                  >
                    {bizLoading ? '불러오는 중…' : '불러오기'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={bizInfo.businessName}
                    onChange={(e) => setBizInfo({ ...bizInfo, businessName: e.target.value })}
                    placeholder="제조자"
                    className="rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                  />
                  <input
                    value={bizInfo.businessNumber}
                    onChange={(e) => setBizInfo({ ...bizInfo, businessNumber: e.target.value })}
                    placeholder="사업자 등록 번호 (예: 123-45-67890)"
                    className="rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                  />
                  <input
                    value={bizInfo.ownerName}
                    onChange={(e) => setBizInfo({ ...bizInfo, ownerName: e.target.value })}
                    placeholder="대표자명"
                    className="rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                  />
                  <input
                    value={bizInfo.asManager}
                    onChange={(e) => setBizInfo({ ...bizInfo, asManager: e.target.value })}
                    placeholder="A/S 책임자 / 전화번호"
                    className="rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                  />
                  <input
                    type="email"
                    value={bizInfo.email}
                    onChange={(e) => setBizInfo({ ...bizInfo, email: e.target.value })}
                    placeholder="전자우편주소"
                    className="rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                  />
                  <input
                    value={bizInfo.businessAddress}
                    onChange={(e) => setBizInfo({ ...bizInfo, businessAddress: e.target.value })}
                    placeholder="사업장 소재지"
                    className="rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm"
                  />
                  <input
                    value={bizInfo.telecomSalesNumber}
                    onChange={(e) => setBizInfo({ ...bizInfo, telecomSalesNumber: e.target.value })}
                    placeholder="통신 판매업 신고 번호"
                    className="rounded border border-[var(--color-gray-200)] px-3 py-2 text-sm md:col-span-2"
                  />
                </div>
                <p className="inline-block text-xs text-gray-500 bg-primary-20 p-1 mt-2">
                  * 작가 프로필의 사업자 정보(제조자, 사업자등록번호, 대표자명, A/S 책임자/전화번호, 이메일, 사업장 소재지, 통신판매업 신고번호)를 불러와 편집할 수 있습니다.
                </p>
              </div>
            </div>
          </section>

          <hr />

          {/* 내용(에디터) */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">상품 설명</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-xs border rounded px-2 py-1 hover:bg-black/5"
                  onClick={() => setEditorFullscreen(true)}
                >
                  상품 설명 크게 보기
                </button>
              </div>
            </div>

            {/* 작은 뷰(기본) - 더블클릭으로도 확대 */}
            <div onDoubleClick={() => setEditorFullscreen(true)}>
              <NoticeEditor
                value={editorValue}
                onChange={setEditorValue}
                onUploadImage={handleUploadDescImage}
                minHeight={180}
                maxHeight={240}
              />
            </div>

            <p className="inline-block text-xs text-gray-500 bg-primary-20 p-1">
              * 상품 상세 설명은 필수입니다. (더블클릭 또는 ‘상품 설명 크게 보기’로 확대)
            </p>
          </section>

          {/* 상품 설명 크게 보기 에디터 */}
          {editorFullscreen && (
            <div
              className="fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center"
              onClick={() => setEditorFullscreen(false)}
            >
              <div
                className="bg-white rounded-xl shadow-2xl w-[min(1200px,95vw)] h-[85vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* 상단 바 */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <div className="text-sm font-semibold">상품 설명</div>
                  <div className="flex items-center gap-2">
                    <button
                      className="cursor-pointer rounded transition hover:bg-black/5 p-2"
                      onClick={() => setEditorFullscreen(false)}
                      aria-label="닫기"
                    >
                      <X width={16} height={16} />
                    </button>
                  </div>
                </div>

                {/* 큰 에디터 */}
                <div className="flex-1 overflow-hidden p-4">
                  <NoticeEditor
                    value={editorValue}
                    onChange={setEditorValue}
                    onUploadImage={handleUploadDescImage}
                    minHeight={typeof window !== 'undefined' ? Math.max(480, Math.floor(window.innerHeight * 0.6)) : 480}
                    maxHeight={typeof window !== 'undefined' ? Math.floor(window.innerHeight * 0.8) : 700}
                  />
                </div>

                {/* 하단 바 */}
                <div className="px-4 py-3 border-t border-gray-200 flex justify-end">
                  <button
                    type="button"
                    className="text-sm border rounded px-3 py-2 hover:bg-black/5"
                    onClick={() => setEditorFullscreen(false)}
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          )}

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
                <label
                  htmlFor="fileInput"
                  className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded border border-[var(--color-primary)] px-3 py-1 text-sm leading-none transition hover:bg-primary-20"
                >
                  파일 선택
                </label>
              </div>
            </div>
          </section>

          {/* 파일 타입 지정 + 개별 삭제 */}
          {files.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">업로드할 파일 타입</p>
                {files.map((file, idx) => {
                  const key = fileKey(file);
                  const status = uploadingMap[key] ?? 'idle';

                  return (
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
                          <span className="text-[10px] text-gray-500 px-1 text-center leading-tight">미리보기 없음</span>
                        )}
                      </div>

                      {/* 파일명 */}
                      <span className="flex-1 truncate">{file.name}</span>

                      {/* 상태 표시 */}
                      <span
                        className={
                          'px-2 py-1 rounded text-xs ' +
                          (status === 'uploading'
                            ? 'bg-yellow-100 text-yellow-800'
                            : status === 'done'
                            ? 'bg-green-100 text-green-800'
                            : status === 'error'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700')
                        }
                      >
                        {status === 'uploading' && '업로드 중…'}
                        {status === 'done' && '완료'}
                        {status === 'error' && '실패'}
                        {status === 'idle' && '대기'}
                      </span>

                      {/* 타입 선택 — MAIN/THUMBNAIL만 */}
                      <select
                        value={asAllowed(fileTypes[idx])}
                        onChange={(e) => handleChangeFileType(idx, e.target.value as AllowedType)}
                        className="rounded border border-[var(--color-gray-200)] py-1.5 px-2"
                        disabled={status === 'uploading'}
                        title={status === 'uploading' ? '업로드 중에는 변경할 수 없어요' : undefined}
                      >
                        <option value="MAIN">대표 이미지</option>
                        <option value="THUMBNAIL">썸네일</option>
                      </select>

                      {/* 개별 삭제 */}
                      <button
                        type="button"
                        onClick={() => removeOneFile(idx)}
                        disabled={status === 'uploading'}
                        className="ml-1 rounded border px-2 py-1 hover:bg-black/5 disabled:opacity-60"
                        title={status === 'uploading' ? '업로드 중에는 삭제할 수 없어요' : '이 파일 삭제'}
                      >
                        삭제
                      </button>
                    </div>
                  );
                })}
              </div>

              <p className="inline-block text-xs text-gray-500 bg-primary-20 p-1 my-2">
                * 파일을 선택하면 자동으로 업로드됩니다. (대표 이미지 1개, 나머지 썸네일)
              </p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <hr />
        <div className="sticky bottom-0 z-10 bg-white px-6 py-4 flex justify-between gap-2">
          <div className="flex ml-auto gap-2">
            <button
              onClick={handleCloseWithSave}
              className="px-3 py-2 rounded-md border border-primary text-primary font-semibold text-sm cursor-pointer"
            >
              {mode === 'edit' ? '수정취소' : '작성취소'}
            </button>
            {mode === 'edit' ? (
              <button
                onClick={handleUpdate}
                className="px-3 py-2 rounded-md border border-primary bg-primary text-white font-semibold text-sm cursor-pointer"
                disabled={submitting}
              >
                {submitting ? '수정중…' : '수정하기'}
              </button>
            ) : (
              <button
                onClick={handleCreate}
                className="px-3 py-2 rounded-md border border-primary bg-primary text-white font-semibold text-sm cursor-pointer"
                disabled={submitting}
              >
                {submitting ? '작성중…' : '작성하기'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
