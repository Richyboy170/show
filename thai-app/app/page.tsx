import { getVideos } from "@/lib/firestore";
import Link from "next/link";
import Image from "next/image";
import { Music, Heart } from "lucide-react";
import Header from "@/components/Header";
import ExpandableDescription from "@/components/ExpandableDescription";

export default async function Home() {
  const videos = await getVideos({
    orderBy: 'publishedAt',
    orderDirection: 'desc',
    includeLyrics: true
  });

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Paper Lantern Decorations - inspired by the photo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top lanterns */}
        <div className="absolute top-5 left-[10%] w-16 h-16 bg-[#FFD166] rounded-full opacity-80 shadow-lg"></div>
        <div className="absolute top-3 left-[25%] w-20 h-20 bg-[#FF6B6B] rounded-full opacity-75 shadow-lg"></div>
        <div className="absolute top-8 left-[45%] w-24 h-24 bg-[#4ECDC4] rounded-full opacity-70 shadow-xl"></div>
        <div className="absolute top-2 right-[30%] w-[4.5rem] h-[4.5rem] bg-[#FFA07A] rounded-full opacity-80 shadow-lg"></div>
        <div className="absolute top-6 right-[15%] w-20 h-20 bg-[#95E1D3] rounded-full opacity-75 shadow-lg"></div>
        <div className="absolute top-10 right-[5%] w-16 h-16 bg-[#FFBE76] rounded-full opacity-80 shadow-lg"></div>

        {/* Middle scattered lanterns */}
        <div className="absolute top-[30%] left-[5%] w-14 h-14 bg-[#FF6B6B] rounded-full opacity-60 shadow-lg"></div>
        <div className="absolute top-[25%] right-[8%] w-12 h-12 bg-[#4ECDC4] rounded-full opacity-65 shadow-md"></div>
        <div className="absolute top-[45%] left-[15%] w-10 h-10 bg-[#FFD166] rounded-full opacity-70 shadow-md"></div>
        <div className="absolute top-[50%] right-[20%] w-14 h-14 bg-[#FFA07A] rounded-full opacity-65 shadow-lg"></div>

        {/* Bottom lanterns */}
        <div className="absolute bottom-[15%] left-[20%] w-12 h-12 bg-[#95E1D3] rounded-full opacity-70 shadow-md"></div>
        <div className="absolute bottom-[20%] right-[25%] w-16 h-16 bg-[#FFBE76] rounded-full opacity-75 shadow-lg"></div>
        <div className="absolute bottom-[10%] left-[40%] w-14 h-14 bg-[#FF6B6B] rounded-full opacity-65 shadow-lg"></div>
      </div>

      {/* Header with user authentication */}
      <Header />

      {/* Hero Section - Party header with teddy bear theme */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 relative z-10">
        <div className="text-center mb-8 sm:mb-16 relative">
          <div className="inline-block bg-white p-6 sm:p-10 shadow-2xl rounded-2xl sm:rounded-3xl border-4 border-[#FFD166]" style={{ transform: 'rotate(-0.5deg)' }}>
            {/* Corner decorations - like paper lanterns */}
            <div className="absolute -top-3 -left-3 w-6 h-6 sm:-top-4 sm:-left-4 sm:w-8 sm:h-8 bg-[#4ECDC4] rounded-full shadow-lg"></div>
            <div className="absolute -top-3 -right-3 w-6 h-6 sm:-top-4 sm:-right-4 sm:w-8 sm:h-8 bg-[#FF6B6B] rounded-full shadow-lg"></div>
            <div className="absolute -bottom-3 -left-3 w-6 h-6 sm:-bottom-4 sm:-left-4 sm:w-8 sm:h-8 bg-[#FFA07A] rounded-full shadow-lg"></div>
            <div className="absolute -bottom-3 -right-3 w-6 h-6 sm:-bottom-4 sm:-right-4 sm:w-8 sm:h-8 bg-[#95E1D3] rounded-full shadow-lg"></div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-3 sm:mb-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3" style={{ fontFamily: 'cursive' }}>
              <span>Featured Songs</span>
              <Heart className="w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 text-[#FF6B6B] fill-[#FF6B6B] animate-pulse" />
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 italic mb-2 sm:mb-3 px-2">
              Lovingly translated by Josie ✨
            </p>
            <div className="flex justify-center gap-2 sm:gap-3 mt-4 sm:mt-5">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#FFD166] rounded-full animate-bounce-1"></div>
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#FF6B6B] rounded-full animate-bounce-2"></div>
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#4ECDC4] rounded-full animate-bounce-3"></div>
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#FFA07A] rounded-full animate-bounce-4"></div>
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#95E1D3] rounded-full animate-bounce-5"></div>
            </div>
          </div>
        </div>

        {/* Videos Grid - Polaroid/Party Scrapbook style */}
        {videos.length === 0 ? (
          <div className="text-center py-12 sm:py-20 bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-12 border-4 border-[#FFD166]" style={{ transform: 'rotate(-0.5deg)' }}>
            <Music className="w-16 h-16 sm:w-24 sm:h-24 text-[#4ECDC4] mx-auto mb-4 sm:mb-6" />
            <p className="text-gray-700 text-xl sm:text-2xl font-bold mb-2" style={{ fontFamily: 'cursive' }}>
              Party is ready! 🎉
            </p>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">Add your first song to start the celebration</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
            {videos.map((video: any, index: number) => {
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

              // Sticker colors matching lanterns
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
                  key={video.id}
                  href={`/watch/${video.youtubeId}`}
                  className={`group bg-white p-4 sm:p-5 shadow-2xl hover:shadow-party-hover transition-all transform hover:scale-105 sm:hover:scale-110 hover:rotate-0 hover:z-10 ${rotation} border-4 sm:border-8 ${borderColor} relative`}
                >
                  {/* Washi tape effect - colorful */}
                  <div
                    className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 w-20 h-6 sm:w-24 sm:h-8 bg-gradient-to-r from-[#FFD166]/70 via-white/50 to-[#FFD166]/70 border-t-2 border-b-2 border-[#FFD166]/40 shadow-md"
                    style={{ transform: 'translateX(-50%) rotate(-3deg)' }}
                  >
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(255,255,255,0.3)_2px,rgba(255,255,255,0.3)_4px)]"></div>
                  </div>

                  <div className="relative aspect-video bg-gray-50 mb-4 sm:mb-5 overflow-hidden rounded-lg shadow-inner">
                    {video.thumbnailUrl ? (
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#95E1D3]/20 to-[#4ECDC4]/20">
                        <Music className="w-16 h-16 text-[#4ECDC4]" />
                      </div>
                    )}
                  </div>

                  {/* Polaroid caption area */}
                  <div className="bg-white pt-2 pb-3 sm:pb-4 px-2">
                    <h3 className="font-bold text-lg sm:text-xl text-gray-800 mb-2 line-clamp-2 text-center leading-tight" style={{ fontFamily: 'cursive' }}>
                      {video.title}
                    </h3>

                    {video.description && (
                      <ExpandableDescription
                        description={video.description}
                        maxLines={2}
                        className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 text-center italic"
                      />
                    )}

                    {video.lyrics && video.lyrics.length > 0 && (
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-white text-xs sm:text-sm bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] py-1.5 sm:py-2 px-3 sm:px-4 rounded-full shadow-md font-semibold">
                        <Music className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Lyrics Available!</span>
                      </div>
                    )}
                  </div>

                  {/* Decorative corner sticker - matching lantern colors */}
                  <div className={`absolute -top-2 sm:-top-3 -right-2 sm:-right-3 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br ${stickerColor} rounded-full shadow-xl flex items-center justify-center transform rotate-12 border-2 border-white`}>
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white" />
                  </div>

                  {/* Additional cute dot decoration */}
                  <div className="absolute -bottom-1.5 sm:-bottom-2 -left-1.5 sm:-left-2 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-md border-2 sm:border-[3px] border-gray-100"></div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer - Party style */}
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