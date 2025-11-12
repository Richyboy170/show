'use client';

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Music, Mail, Lock } from "lucide-react";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    // Redirect to home page after successful Google sign-in
    await signIn("google", { callbackUrl: "/" });
  };

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password. Only admin can access.");
    } else {
      // Redirect to home page after successful sign-in
      router.push("/");
    }
  };

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
        {/* Logo and Title - Party style */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Music className="w-20 h-20 text-[#FF6B6B] animate-pulse" />
              {/* Decorative dots around icon */}
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#FFD166] rounded-full shadow-md"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-[#4ECDC4] rounded-full shadow-md"></div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'cursive' }}>
            Welcome! 🎉
          </h1>
          <p className="text-xl text-gray-700 italic">
            Sign in to manage your Thai lyrics collection
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <div className="w-2 h-2 bg-[#FFD166] rounded-full animate-bounce-1"></div>
            <div className="w-2 h-2 bg-[#FF6B6B] rounded-full animate-bounce-2"></div>
            <div className="w-2 h-2 bg-[#4ECDC4] rounded-full animate-bounce-3"></div>
            <div className="w-2 h-2 bg-[#FFA07A] rounded-full animate-bounce-4"></div>
            <div className="w-2 h-2 bg-[#95E1D3] rounded-full animate-bounce-5"></div>
          </div>
        </div>

        {/* Sign In Card - Polaroid style */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border-8 border-[#FFD166] transform hover:rotate-0 transition-all -rotate-1 relative">
          {/* Corner decorations - like paper lanterns */}
          <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#4ECDC4] rounded-full shadow-lg"></div>
          <div className="absolute -top-3 -right-3 w-6 h-6 bg-[#FF6B6B] rounded-full shadow-lg"></div>
          <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-[#FFA07A] rounded-full shadow-lg"></div>
          <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-[#95E1D3] rounded-full shadow-lg"></div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-4 border-[#4ECDC4] rounded-2xl hover:border-[#FF6B6B] hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6 bg-white transform hover:scale-105"
            suppressHydrationWarning
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="font-medium">Continue with Google</span>
          </button>

          {/* Divider - Party style */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-[#95E1D3]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-700 font-semibold" style={{ fontFamily: 'cursive' }}>Or sign in with password</span>
            </div>
          </div>

          {/* Password Sign In Form */}
          <form onSubmit={handleCredentialsSignIn} className="space-y-4">
            {error && (
              <div className="bg-[#FF6B6B]/10 border-4 border-[#FF6B6B] text-[#FF6B6B] px-4 py-3 rounded-2xl text-sm font-semibold">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-base font-bold text-gray-700 mb-2" style={{ fontFamily: 'cursive' }}>
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#4ECDC4]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-4 border-[#95E1D3] rounded-2xl focus:ring-2 focus:ring-[#FF6B6B] focus:border-[#FF6B6B] outline-none transition-all"
                  placeholder="admin@example.com"
                  required
                  suppressHydrationWarning
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-base font-bold text-gray-700 mb-2" style={{ fontFamily: 'cursive' }}>
                Admin Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#4ECDC4]" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-4 border-[#95E1D3] rounded-2xl focus:ring-2 focus:ring-[#FF6B6B] focus:border-[#FF6B6B] outline-none transition-all"
                  placeholder="••••••••"
                  required
                  suppressHydrationWarning
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white py-3 rounded-2xl font-bold hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              style={{ fontFamily: 'cursive' }}
              suppressHydrationWarning
            >
              {loading ? "Signing in..." : "Sign In 🎵"}
            </button>
          </form>
        </div>

        {/* Back to Home - Party style */}
        <div className="text-center mt-8">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-[#4ECDC4] to-[#95E1D3] text-white rounded-full font-bold hover:shadow-xl transform hover:scale-110 transition-all"
            style={{ fontFamily: 'cursive' }}
          >
            ← Back to Home 🏠
          </a>
        </div>
      </div>
    </div>
  );
}
