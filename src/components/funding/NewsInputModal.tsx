import React, { useState } from 'react';
import PaperClip from '@/assets/icon/paperclip.svg';
import Image from 'next/image';

interface NewsCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  fundingId: number;
}

const TITLE_MAX_LENGTH = 40;
const CONTENT_MAX_LENGTH = 300;

const NewsCreateModal: React.FC<NewsCreateModalProps> = ({
  isOpen,
  onClose,
  fundingId,
}) => {
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    // 이미지 타입 확인
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 제한 (예: 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    setImageFile(file);

    // 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;

    if (title.length > TITLE_MAX_LENGTH) {
      alert(`제목은 ${TITLE_MAX_LENGTH}자를 초과할 수 없습니다.`);
      return;
    }

    if (content.length > CONTENT_MAX_LENGTH) {
      alert(`내용은 ${CONTENT_MAX_LENGTH}자를 초과할 수 없습니다.`);
      return;
    }
    setIsSubmitting(true);

    try {
      let imageUrl = '';

      // ⭐ 1단계: 이미지가 있으면 먼저 업로드
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);

        const uploadResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/upload`, // 이미지 업로드 API
          {
            method: 'POST',
            body: formData,
            credentials: 'include',
          },
        );

        if (!uploadResponse.ok) {
          throw new Error('이미지 업로드 실패');
        }

        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.data.imageUrl; // 업로드된 이미지 URL
      }

      // ⭐ 2단계: 뉴스 생성 (JSON으로 전송)
      const newsData = {
        title,
        content,
        imageUrl, // 업로드된 URL 또는 빈 문자열
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/fundings/${fundingId}/news`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newsData),
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error('새 소식 등록 실패');
      }

      alert('새 소식이 등록되었습니다!');

      // Reset form
      setTitle('');
      setContent('');
      setImageFile(null);
      setPreviewUrl('');
      onClose();

      // 페이지 새로고침 또는 데이터 갱신
      window.location.reload();
    } catch (error) {
      console.error('새 소식 등록 실패:', error);
      alert('새 소식 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setTitle('');
    setContent('');
    setImageFile(null);
    setPreviewUrl('');
    onClose();
  };

  const removeImage = () => {
    setImageFile(null);
    setPreviewUrl('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[1100px] max-w-[1100px] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">새 소식 작성</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <p>X</p>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="새로운 업데이트를 알립니다."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
              disabled={isSubmitting}
            />
          </div>

          {/* Content Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              내용
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="안녕하세요 작가 OO입니다. 새로운 업데이트 관련 내용을 알려드리겠습니다."
              className="w-full h-80 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
              disabled={isSubmitting}
            />
          </div>

          {/* File Upload 
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium text-gray-700">
                첨부 이미지
              </label>
              <PaperClip />
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={!!imageFile || isSubmitting}
              />
              <label
                htmlFor="file-upload"
                className={`text-sm cursor-pointer hover:underline ${
                  imageFile || isSubmitting
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-blue-600 hover:text-blue-800'
                }`}
              >
                이미지를 선택하세요
              </label>
            </div>

            {previewUrl && (
              <div className="mt-4 relative inline-block">
                <div className="relative w-48 h-48 rounded-lg overflow-hidden border border-gray-300">
                  <Image
                    src={previewUrl}
                    alt="첨부 이미지"
                    fill
                    className="object-cover"
                  />
                </div>
                {!isSubmitting && (
                  <button
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                )}
                <p className="mt-2 text-xs text-gray-600">{imageFile?.name}</p>
              </div>
            )}
          </div>*/}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            작성취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim() || isSubmitting}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? '등록 중...' : '작성하기'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface NewsInputModalProps {
  fundingId: number;
}

const NewsInputModal: React.FC<NewsInputModalProps> = ({ fundingId }) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  return (
    <div>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        새 소식 작성하기
      </button>

      <NewsCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        fundingId={fundingId}
      />
    </div>
  );
};

export default NewsInputModal;
