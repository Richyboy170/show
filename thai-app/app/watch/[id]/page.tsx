import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import VideoPlayer from "@/components/lyrics/VideoPlayer";

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const video = await prisma.video.findUnique({
    where: { youtubeId: resolvedParams.id },
    include: {
      lyrics: {
        orderBy: {
          startTime: 'asc'
        },
        include: {
          words: {
            orderBy: {
              order: 'asc'
            }
          }
        }
      }
    }
  });

  if (!video) {
    redirect("/");
  }

  return <VideoPlayer video={video} />;
}
