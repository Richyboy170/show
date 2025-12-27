'use client';

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Music, Sparkles, Heart, User, LogOut } from "lucide-react";

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="relative bg-white/95 backdrop-blur-sm shadow-lg border-b-4 border-[#FF6B6B]" style={{ transform: 'rotate(-0.3deg)' }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6" style={{ transform: 'rotate(0.3deg)' }}>
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#FF6B6B] to-[#FFA07A] rounded-full flex items-center justify-center">
                <Music className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFD166] absolute -top-1 -right-1" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#FF6B6B]" style={{ fontFamily: 'cursive' }}>
                Josie Tso&apos;s
              </h1>
              <p className="text-xs sm:text-sm text-[#4ECDC4] italic font-semibold">Thai Music Celebration 🎉</p>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 flex-wrap justify-end">
            {status === "loading" ? (
              <div className="px-3 sm:px-5 py-1.5 sm:py-2 bg-gray-200 rounded-full animate-pulse text-sm">
                Loading...
              </div>
            ) : session?.user ? (
              <>
                {/* User Profile */}
                <div className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2 bg-white rounded-full shadow-md border-2 ${session.user.isAdmin ? 'border-[#FFD166]' : 'border-[#4ECDC4]'} relative`}>
                  {session.user.isAdmin && (
                    <div className="absolute -top-1.5 sm:-top-2 -right-1.5 sm:-right-2 bg-gradient-to-r from-[#FFD166] to-[#FFBE76] text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full shadow-lg border-2 border-white animate-pulse">
                      ADMIN
                    </div>
                  )}
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      width={28}
                      height={28}
                      className="rounded-full w-7 h-7 sm:w-8 sm:h-8"
                    />
                  ) : (
                    <User className="w-7 h-7 sm:w-8 sm:h-8 text-[#4ECDC4]" />
                  )}
                  <div className="hidden md:block">
                    <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate max-w-[100px]">{session.user.name}</p>
                    {!session.user.isAdmin && (
                      <p className="text-[10px] sm:text-xs text-[#4ECDC4] font-medium">Music Lover</p>
                    )}
                  </div>
                </div>

                {/* Favorites Link - Available to all authenticated users */}
                <Link
                  href="/favorites"
                  className="px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white rounded-full hover:from-[#FFA07A] hover:to-[#FF6B6B] transition-all transform hover:scale-105 shadow-lg border-2 border-white font-semibold flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                >
                  <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">My Favorites</span>
                  <span className="sm:hidden">Faves</span>
                </Link>

                {/* Admin Panel Link - Only visible to admins */}
                {session.user.isAdmin && (
                  <Link
                    href="/admin"
                    className="px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-[#4ECDC4] to-[#95E1D3] text-white rounded-full hover:from-[#95E1D3] hover:to-[#4ECDC4] transition-all transform hover:scale-105 shadow-lg border-2 border-white font-semibold text-xs sm:text-sm whitespace-nowrap"
                  >
                    <span className="hidden lg:inline">Admin Panel</span>
                    <span className="lg:hidden">Admin</span>
                  </Link>
                )}

                {/* Sign Out */}
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-all transform hover:scale-105 shadow-lg flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                  suppressHydrationWarning
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden md:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="px-4 sm:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white rounded-full hover:from-[#FFA07A] hover:to-[#FF6B6B] transition-all transform hover:scale-105 shadow-lg border-2 border-white font-semibold inline-block text-sm sm:text-base"
                style={{ transform: 'rotate(1deg)' }}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
