'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Music, Sparkles, Heart, User, LogOut } from "lucide-react";

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="relative bg-white/95 backdrop-blur-sm shadow-lg border-b-4 border-[#FF6B6B]" style={{ transform: 'rotate(-0.3deg)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" style={{ transform: 'rotate(0.3deg)' }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B6B] to-[#FFA07A] rounded-full flex items-center justify-center">
                <Music className="w-7 h-7 text-white" />
              </div>
              <Sparkles className="w-5 h-5 text-[#FFD166] absolute -top-1 -right-1" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#FF6B6B]" style={{ fontFamily: 'cursive' }}>
                Josie Tso&apos;s
              </h1>
              <p className="text-sm text-[#4ECDC4] italic font-semibold">Thai Music Celebration 🎉</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            {status === "loading" ? (
              <div className="px-5 py-2 bg-gray-200 rounded-full animate-pulse">
                Loading...
              </div>
            ) : session?.user ? (
              <>
                {/* User Profile */}
                <div className={`flex items-center gap-3 px-4 py-2 bg-white rounded-full shadow-md border-2 ${session.user.isAdmin ? 'border-[#FFD166]' : 'border-[#4ECDC4]'} relative`}>
                  {session.user.isAdmin && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-[#FFD166] to-[#FFBE76] text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg border-2 border-white animate-pulse">
                      ADMIN
                    </div>
                  )}
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <User className="w-8 h-8 text-[#4ECDC4]" />
                  )}
                  <div className="hidden sm:block">
                    <p className="text-sm font-semibold text-gray-800">{session.user.name}</p>
                    {!session.user.isAdmin && (
                      <p className="text-xs text-[#4ECDC4] font-medium">Music Lover</p>
                    )}
                  </div>
                </div>

                {/* Navigation Links - Only show favorites for non-admin users */}
                {!session.user.isAdmin && (
                  <Link
                    href="/favorites"
                    className="px-4 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white rounded-full hover:from-[#FFA07A] hover:to-[#FF6B6B] transition-all transform hover:scale-105 shadow-lg border-2 border-white font-semibold flex items-center gap-2"
                  >
                    <Heart className="w-4 h-4" />
                    My Favorites
                  </Link>
                )}

                {/* Admin Panel Link - Only visible to admins */}
                {session.user.isAdmin && (
                  <Link
                    href="/admin"
                    className="px-4 py-2 bg-gradient-to-r from-[#4ECDC4] to-[#95E1D3] text-white rounded-full hover:from-[#95E1D3] hover:to-[#4ECDC4] transition-all transform hover:scale-105 shadow-lg border-2 border-white font-semibold"
                  >
                    Admin Panel
                  </Link>
                )}

                {/* Sign Out */}
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-4 py-2 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => signIn('google')}
                className="px-5 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white rounded-full hover:from-[#FFA07A] hover:to-[#FF6B6B] transition-all transform hover:scale-105 shadow-lg border-2 border-white font-semibold"
                style={{ transform: 'rotate(1deg)' }}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
