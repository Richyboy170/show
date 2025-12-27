'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: { [key: string]: string } = {
    Signin: 'Try signing in with a different account.',
    OAuthSignin: 'Try signing in with a different account.',
    OAuthCallback: 'Try signing in with a different account.',
    OAuthCreateAccount: 'Try signing in with a different account.',
    EmailCreateAccount: 'Try signing in with a different account.',
    Callback: 'Try signing in with a different account.',
    OAuthAccountNotLinked: 'To confirm your identity, sign in with the same account you used originally.',
    EmailSignin: 'Check your email address.',
    CredentialsSignin: 'Sign in failed. Check the details you provided are correct.',
    default: 'Unable to sign in. Please try again or contact support if the problem persists.',
  };

  const errorMessage = error ? errorMessages[error] || errorMessages.default : errorMessages.default;

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center p-4">
      {/* Paper Lantern Decorations - matching home page */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top lanterns */}
        <div className="absolute top-5 left-[10%] w-16 h-16 bg-[#FFD166] rounded-full opacity-80 shadow-lg animate-bounce-1"></div>
        <div className="absolute top-3 left-[25%] w-20 h-20 bg-[#FF6B6B] rounded-full opacity-75 shadow-lg animate-bounce-2"></div>
        <div className="absolute top-8 left-[45%] w-24 h-24 bg-[#4ECDC4] rounded-full opacity-70 shadow-xl animate-bounce-3"></div>
        <div className="absolute top-2 right-[30%] w-[4.5rem] h-[4.5rem] bg-[#FFA07A] rounded-full opacity-80 shadow-lg animate-bounce-4"></div>
        <div className="absolute top-6 right-[15%] w-20 h-20 bg-[#95E1D3] rounded-full opacity-75 shadow-lg animate-bounce-5"></div>
        <div className="absolute top-10 right-[5%] w-16 h-16 bg-[#FFBE76] rounded-full opacity-80 shadow-lg animate-bounce-1"></div>

        {/* Middle scattered lanterns */}
        <div className="absolute top-[30%] left-[5%] w-14 h-14 bg-[#FF6B6B] rounded-full opacity-60 shadow-lg animate-bounce-2"></div>
        <div className="absolute top-[25%] right-[8%] w-12 h-12 bg-[#4ECDC4] rounded-full opacity-65 shadow-md animate-bounce-3"></div>
        <div className="absolute top-[45%] left-[15%] w-10 h-10 bg-[#FFD166] rounded-full opacity-70 shadow-md animate-bounce-4"></div>
        <div className="absolute top-[50%] right-[20%] w-14 h-14 bg-[#FFA07A] rounded-full opacity-65 shadow-lg animate-bounce-5"></div>

        {/* Bottom lanterns */}
        <div className="absolute bottom-[15%] left-[20%] w-12 h-12 bg-[#95E1D3] rounded-full opacity-70 shadow-md animate-bounce-1"></div>
        <div className="absolute bottom-[20%] right-[25%] w-16 h-16 bg-[#FFBE76] rounded-full opacity-75 shadow-lg animate-bounce-2"></div>
        <div className="absolute bottom-[10%] left-[40%] w-14 h-14 bg-[#FF6B6B] rounded-full opacity-65 shadow-lg animate-bounce-3"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Error Card - Polaroid style */}
        <div className="bg-white rounded-3xl shadow-2xl p-10 border-8 border-[#FF6B6B] transform hover:rotate-0 transition-all -rotate-1 relative text-center">
          {/* Corner decorations */}
          <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#4ECDC4] rounded-full shadow-lg"></div>
          <div className="absolute -top-3 -right-3 w-6 h-6 bg-[#FFD166] rounded-full shadow-lg"></div>
          <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-[#FFA07A] rounded-full shadow-lg"></div>
          <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-[#95E1D3] rounded-full shadow-lg"></div>

          {/* Error icon with decoration */}
          <div className="relative inline-block mb-6">
            <AlertCircle className="w-20 h-20 text-[#FF6B6B] mx-auto" />
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#FFD166] rounded-full shadow-md"></div>
            <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-[#4ECDC4] rounded-full shadow-md"></div>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'cursive' }}>
            Oops! 😅
          </h1>
          <p className="text-lg text-gray-700 mb-8 italic">
            {errorMessage}
          </p>

          <div className="flex justify-center gap-2 mb-8">
            <div className="w-2 h-2 bg-[#FFD166] rounded-full animate-bounce-1"></div>
            <div className="w-2 h-2 bg-[#FF6B6B] rounded-full animate-bounce-2"></div>
            <div className="w-2 h-2 bg-[#4ECDC4] rounded-full animate-bounce-3"></div>
            <div className="w-2 h-2 bg-[#FFA07A] rounded-full animate-bounce-4"></div>
            <div className="w-2 h-2 bg-[#95E1D3] rounded-full animate-bounce-5"></div>
          </div>

          <div className="space-y-4">
            <Link
              href="/auth/signin"
              className="block w-full bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white py-3 rounded-2xl font-bold hover:shadow-xl transform hover:scale-105 transition-all text-lg"
              style={{ fontFamily: 'cursive' }}
            >
              Try Again 🔄
            </Link>
            <Link
              href="/"
              className="block w-full bg-gradient-to-r from-[#4ECDC4] to-[#95E1D3] text-white py-3 rounded-2xl font-bold hover:shadow-xl transform hover:scale-105 transition-all text-lg"
              style={{ fontFamily: 'cursive' }}
            >
              Back to Home 🏠
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FF6B6B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
