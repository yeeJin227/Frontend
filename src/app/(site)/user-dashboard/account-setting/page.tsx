'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Button from '@/components/Button';
import { useLogout } from '@/hooks/useLogout';
import { useRouter } from 'next/navigation';

// API 응답 데이터의 타입을 정의하면 더 안전하게 코드를 작성할 수 있습니다.
interface UserData {
  userId: number;
  email: string;
  name: string;
  profileImageUrl: string | null;
  phone: string | null;
  address: string | null;
  detailAddress: string | null;
  zipCode: string | null;
  role: string;
  grade: string;
  status: string;
  provider: string; // "KAKAO", "GOOGLE", "LOCAL"
  money: number;
  point: number;
  createdAt: string;
}
export default function AccountSetting() {
  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    phone: '',
    address: '',
    zipCode: '',
    password: '',
    passwordConfirm: '',
    passwordMatching: false,
    passwordChange: false,
  });

  // 프로필 이미지 URL을 별도 상태로 관리합니다.
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const API_BASE_URL = (
    process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'
  ).replace(/\/+$/, '');
  const { logout } = useLogout();
  const router = useRouter();

  // 컴포넌트가 마운트될 때 API를 호출하기 위해 useEffect 사용
  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        // API 요청
        const response = await fetch(`${API_BASE_URL}/api/users/me`, {
          method: 'GET',
          headers: {
            accept: 'application/json;charset=UTF-8',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('계정 정보를 불러오는데 실패했습니다.');
        }

        const result: { data: UserData } = await response.json();
        const userData = result.data;

        // API 응답 데이터로 formData 상태 업데이트
        setFormData((prev) => ({
          ...prev,
          nickname: userData.name,
          email: userData.email,
          phone: userData.phone || '',
          address: userData.address || '',
          zipCode: userData.zipCode || '',
        }));

        setProfileImageUrl(userData.profileImageUrl);
      } catch (error) {
        console.error('Error fetching account data:', error);
      }
    };

    fetchAccountData();
  }, [API_BASE_URL]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const uploadImage = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('files', file); // 파일 자체를 추가

      console.log('이미지 업로드 시작:', file.name);

      // types는 query parameter로 전달
      const response = await fetch(
        `${API_BASE_URL}/api/fundings/images?types=MAIN`,
        {
          method: 'POST',
          credentials: 'include',
          body: formData,
          // headers에 Content-Type을 명시하지 않음 (브라우저가 자동으로 설정)
        },
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(
          `이미지 업로드 실패: ${response.status} ${errorText || response.statusText}`,
        );
      }

      const result = await response.json();

      if (result.resultCode !== '200') {
        throw new Error(result.msg || '이미지 업로드 실패');
      }
    } catch (error) {
      console.error('이미지 업로드 에러:', error);
      if (error instanceof Error) {
        throw new Error(`이미지 업로드 중 오류: ${error.message}`);
      }
      throw new Error('이미지 업로드 중 알 수 없는 오류가 발생했습니다.');
    }
  };

  const handleSubmit = async () => {
    // 비밀번호 필드가 하나라도 채워져 있다면, 두 필드가 일치하는지 확인합니다.
    if (formData.password || formData.passwordConfirm) {
      if (formData.password !== formData.passwordConfirm) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
      }
    }

    try {
      if (imageFile) await uploadImage(imageFile);

      const requestBody =
        formData.password == '' && formData.passwordConfirm == ''
          ? {
              profileImageUrl: profileImageUrl,
              name: formData.nickname,
              phone: formData.phone,
              address: formData.address,
              detailAddress: '',
              zipCode: formData.zipCode,
              passwordChange: false,
            }
          : {
              profileImageUrl: profileImageUrl,
              name: formData.nickname,
              phone: formData.phone,
              address: formData.address,
              detailAddress: '',
              zipCode: formData.zipCode,
              password: formData.password,
              passwordConfirm: formData.passwordConfirm,
              passwordChange: true,
              passwordMatching: formData.password === formData.passwordConfirm,
            };

      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json;charset=UTF-8',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || '정보 수정에 실패했습니다.');
      }

      alert('정보가 성공적으로 수정되었습니다.');
      // 선택: 수정 후 비밀번호 필드를 비웁니다.
      setFormData((prev) => ({ ...prev, password: '', passwordConfirm: '' }));
    } catch (error) {
      console.error('Error updating account data:', error);
      alert((error as Error).message);
    }
  };

  const handleWithDraw = async () => {
    if (confirm('회원탈퇴를 진행하시겠습니까?')) {
      if (!confirm('정말로 회원탈퇴를 진행하시겠습니까?')) return;
    } else return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok)
        throw new Error(
          `회원 탈퇴 실패 : ${response.status} ${response.statusText}`,
        );
      if (response.status === 200) {
        console.log('회원탈퇴 완료');
        logout();
        router.push('/');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-12 min-h-screen mx-auto w-full max-w-1/3">
      <h1 className="text-3xl font-bold mb-8">계정 설정</h1>

      {/* 프로필 이미지 섹션 */}
      <div className="flex items-center gap-4 mb-12">
        <div className="w-40 h-40 rounded-full border-2 overflow-hidden relative">
          <Image
            src={profileImageUrl ?? '/defaultImages/defaultProfile.png'}
            alt="프로필"
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>
        <div className="flex ml-auto gap-3">
          <div className="px-4 py-2 text-base gap-2 bg-primary text-white hover:bg-primary/70 inline-flex items-center justify-center rounded-[10px] font-medium transition-colors focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed">
            <label>
              이미지 업로드
              <input
                type="file"
                accept="image/png, image/jpeg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (!file) return;

                  setImageFile(file);

                  const previewUrl = URL.createObjectURL(file);
                  setProfileImageUrl(previewUrl);

                  e.currentTarget.value = '';
                }}
              />
            </label>
          </div>
          <Button variant="outline" onClick={() => setProfileImageUrl(null)}>
            이미지 삭제
          </Button>
        </div>
      </div>

      {/* 폼 섹션 */}
      <div className=" space-y-6">
        {/* 닉네임 */}
        <div>
          <label className="block text-sm font-medium mb-2">닉네임</label>
          <input
            type="text"
            name="nickname"
            value={formData.nickname}
            onChange={handleChange}
            placeholder="닉네임을 입력해주세요."
            className="w-full px-4 py-3 border border-gray-300 rounded-md bg-primary-20 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* 이메일 */}
        <div>
          <label className="block text-sm font-medium mb-2">이메일</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            disabled
            onChange={handleChange}
            placeholder="이메일을 입력해주세요."
            className="w-full px-4 py-3 border border-gray-300 rounded-md bg-primary-20 text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* 전화번호 */}
        <div>
          <label className="block text-sm font-medium mb-2">전화번호</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="전화번호를 입력해주세요."
            className="w-full px-4 py-3 border border-gray-300 rounded-md bg-primary-20 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* 주소 */}
        <div>
          <label className="block text-sm font-medium mb-2">주소</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="주소를 입력해주세요."
            className="w-full px-4 py-3 border border-gray-300 rounded-md bg-primary-20 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* 비밀번호 */}
        <div>
          <label className="block text-sm font-medium mb-2">비밀번호</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="비밀번호를 입력해주세요."
            className="w-full px-4 py-3 border border-gray-300 rounded-md bg-primary-20 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* 비밀번호 확인 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            비밀번호 확인
          </label>
          <input
            type="password"
            name="passwordConfirm"
            value={formData.passwordConfirm}
            onChange={handleChange}
            placeholder="비밀번호를 한번 더 입력해주세요."
            className="w-full px-4 py-3 border border-gray-300 rounded-md bg-primary-20 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-3 pt-6">
          <Button onClick={handleWithDraw} variant="danger">
            회원 탈퇴
          </Button>
          <Button onClick={handleSubmit}>정보 수정하기</Button>
        </div>
      </div>
    </div>
  );
}
