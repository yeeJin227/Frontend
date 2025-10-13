import ToastProvider from '@/components/ToastProvider';
import SocialRegistrationWatcher from '@/components/auth/SocialRegistrationWatcher';
import '../style/globals.css';
import QueryProvider from './providers/QueryProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <ToastProvider>
          <QueryProvider>
            <SocialRegistrationWatcher />
            {children}
          </QueryProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
