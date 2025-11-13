'use client';

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Music, Heart, ArrowLeft, Loader2 } from "lucide-react";
import Header from "@/components/Header";

interface Favorite {
  id: string;
  video: {
    id: string;
    youtubeId: string;
    title: string;
    description: string | null;
    thumbnailUrl: string | null;
    lyrics: any[];
  };
  createdAt: string;
}

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (session) {
      fetch('/api/favorites')
        .then(res => res.json())
        .then(data => {
          setFavorites(data.favorites || []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching favorites:', err);
          setLoading(false);
        });
    }
  }, [session, status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#FF6B6B] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your favorites...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Paper Lantern Decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-5 left-[10%] w-16 h-16 bg-[#FFD166] rounded-full opacity-80 shadow-lg"></div>
        <div className="absolute top-3 left-[25%] w-20 h-20 bg-[#FF6B6B] rounded-full opacity-75 shadow-lg"></div>
        <div className="absolute top-8 left-[45%] w-24 h-24 bg-[#4ECDC4] rounded-full opacity-70 shadow-xl"></div>
        <div className="absolute top-2 right-[30%] w-18 h-18 bg-[#FFA07A] rounded-full opacity-80 shadow-lg"></div>
        <div className="absolute top-6 right-[15%] w-20 h-20 bg-[#95E1D3] rounded-full opacity-75 shadow-lg"></div>
        <div className="absolute top-10 right-[5%] w-16 h-16 bg-[#FFBE76] rounded-full opacity-80 shadow-lg"></div>

        <div className="absolute top-[30%] left-[5%] w-14 h-14 bg-[#FF6B6B] rounded-full opacity-60 shadow-lg"></div>
        <div className="absolute top-[25%] right-[8%] w-12 h-12 bg-[#4ECDC4] rounded-full opacity-65 shadow-md"></div>
        <div className="absolute top-[45%] left-[15%] w-10 h-10 bg-[#FFD166] rounded-full opacity-70 shadow-md"></div>
        <div className="absolute top-[50%] right-[20%] w-14 h-14 bg-[#FFA07A] rounded-full opacity-65 shadow-lg"></div>

        <div className="absolute bottom-[15%] left-[20%] w-12 h-12 bg-[#95E1D3] rounded-full opacity-70 shadow-md"></div>
        <div className="absolute bottom-[20%] right-[25%] w-16 h-16 bg-[#FFBE76] rounded-full opacity-75 shadow-lg"></div>
        <div className="absolute bottom-[10%] left-[40%] w-14 h-14 bg-[#FF6B6B] rounded-full opacity-65 shadow-lg"></div>
      </div>

      <Header />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-700 hover:text-[#FF6B6B] transition-colors font-semibold rounded-lg px-3 py-2 hover:bg-[#FFD166]/10"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="text-center mb-16 relative">
          <div className="inline-block bg-white p-10 shadow-2xl rounded-3xl border-4 border-[#FF6B6B]">
            <div className="absolute -top-4 -left-4 w-8 h-8 bg-[#4ECDC4] rounded-full shadow-lg"></div>
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-[#FF6B6B] rounded-full shadow-lg"></div>
            <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-[#FFA07A] rounded-full shadow-lg"></div>
            <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-[#95E1D3] rounded-full shadow-lg"></div>

            <h2 className="text-6xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3" style={{ fontFamily: 'cursive' }}>
              My Favorite Songs
              <Heart className="w-12 h-12 text-[#FF6B6B] fill-[#FF6B6B] animate-pulse" />
            </h2>
            <p className="text-2xl text-gray-700 italic">
              Your personal collection ✨
            </p>
          </div>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-2xl p-12 border-4 border-[#FFD166]" style={{ transform: 'rotate(-0.5deg)' }}>
            <Heart className="w-24 h-24 text-[#4ECDC4] mx-auto mb-6" />
            <p className="text-gray-700 text-2xl font-bold mb-2" style={{ fontFamily: 'cursive' }}>
              No favorites yet! 💖
            </p>
            <p className="text-gray-500 mt-2 mb-6">Start adding songs to your favorites by clicking the heart icon</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white rounded-full hover:from-[#FFA07A] hover:to-[#FF6B6B] transition-all transform hover:scale-105 shadow-lg border-2 border-white font-semibold"
            >
              Browse Songs
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {favorites.map((favorite, index) => {
              const rotations = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', '-rotate-3', 'rotate-1'];
              const rotation = rotations[index % rotations.length];
              const colors = [
                'border-[#FF6B6B]',
                'border-[#4ECDC4]',
                'border-[#FFD166]',
                'border-[#FFA07A]',
                'border-[#95E1D3]',
                'border-[#FFBE76]'
              ];
              const borderColor = colors[index % colors.length];

              const stickerColors = [
                'from-[#FF6B6B] to-[#FFA07A]',
                'from-[#4ECDC4] to-[#95E1D3]',
                'from-[#FFD166] to-[#FFBE76]',
                'from-[#FFA07A] to-[#FF6B6B]',
                'from-[#95E1D3] to-[#4ECDC4]',
                'from-[#FFBE76] to-[#FFD166]'
              ];
              const stickerColor = stickerColors[index % stickerColors.length];

              return (
                <Link
                  key={favorite.id}
                  href={`/watch/${favorite.video.youtubeId}`}
                  className={`group bg-white p-5 shadow-2xl hover:shadow-3xl transition-all transform hover:scale-110 hover:rotate-0 hover:z-10 ${rotation} border-8 ${borderColor} relative`}
                >
                  <div
                    className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-24 h-8 bg-gradient-to-r from-[#FFD166]/70 via-white/50 to-[#FFD166]/70 border-t-2 border-b-2 border-[#FFD166]/40 shadow-md"
                    style={{ transform: 'translateX(-50%) rotate(-3deg)' }}
                  >
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(255,255,255,0.3)_2px,rgba(255,255,255,0.3)_4px)]"></div>
                  </div>

                  <div className="relative aspect-video bg-gray-50 mb-5 overflow-hidden rounded-lg shadow-inner">
                    {favorite.video.thumbnailUrl ? (
                      <Image
                        src={favorite.video.thumbnailUrl}
                        alt={favorite.video.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#95E1D3]/20 to-[#4ECDC4]/20">
                        <Music className="w-16 h-16 text-[#4ECDC4]" />
                      </div>
                    )}
                  </div>

                  <div className="bg-white pt-2 pb-4 px-2">
                    <h3 className="font-bold text-xl text-gray-800 mb-2 line-clamp-2 text-center leading-tight" style={{ fontFamily: 'cursive' }}>
                      {favorite.video.title}
                    </h3>

                    {favorite.video.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3 text-center italic">
                        {favorite.video.description}
                      </p>
                    )}

                    {favorite.video.lyrics.length > 0 && (
                      <div className="flex items-center justify-center gap-2 text-white text-sm bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] py-2 px-4 rounded-full shadow-md font-semibold">
                        <Music className="w-4 h-4" />
                        <span>Lyrics Available!</span>
                      </div>
                    )}
                  </div>

                  <div className={`absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br ${stickerColor} rounded-full shadow-xl flex items-center justify-center transform rotate-12 border-2 border-white`}>
                    <Heart className="w-5 h-5 text-white fill-white" />
                  </div>

                  <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-white rounded-full shadow-md border-3 border-gray-100"></div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <footer className="relative mt-20 py-10 bg-gradient-to-r from-white via-[#FFD166]/10 to-white border-t-4 border-[#4ECDC4] z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-700 flex items-center justify-center gap-2 text-xl mb-2" style={{ fontFamily: 'cursive' }}>
            Made with <Heart className="w-6 h-6 text-[#FF6B6B] fill-[#FF6B6B] animate-pulse" /> for Thai music lovers
          </p>
          <p className="text-sm text-gray-500">© 2025 Josie Tso&apos;s Collection</p>
          <div className="flex justify-center gap-3 mt-4">
            <div className="w-2 h-2 bg-[#FF6B6B] rounded-full"></div>
            <div className="w-2 h-2 bg-[#4ECDC4] rounded-full"></div>
            <div className="w-2 h-2 bg-[#FFD166] rounded-full"></div>
            <div className="w-2 h-2 bg-[#FFA07A] rounded-full"></div>
            <div className="w-2 h-2 bg-[#95E1D3] rounded-full"></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
