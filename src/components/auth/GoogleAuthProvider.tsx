/**
 * Google OAuth Provider
 * Google 인증 Provider 래퍼 컴포넌트
 */

import { GoogleOAuthProvider } from '@react-oauth/google';
import type { ReactNode } from 'react';

interface GoogleAuthProviderProps {
  children: ReactNode;
}

// Google OAuth Client ID (환경 변수에서 가져옴)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export function GoogleAuthProviderWrapper({ children }: GoogleAuthProviderProps) {
  if (!GOOGLE_CLIENT_ID) {
    console.warn('VITE_GOOGLE_CLIENT_ID is not set. Authentication will not work.');
    // 개발 환경에서는 인증 없이 진행 가능
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
}
