import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.module?.rules?.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },

  // 외부 이미지 도메인 허용 (S3)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'morimori-files-bucket.s3.ap-northeast-2.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'i.namu.wiki', //펀딩 테스트용 데이터 이미지
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', //구글 프로필 이미지
      },
    ],
  },
};

export default nextConfig;
