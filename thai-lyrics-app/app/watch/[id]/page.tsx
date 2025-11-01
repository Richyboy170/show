import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import VideoPlayer from "@/components/lyrics/VideoPlayer";

export default async function WatchPage({ params }: { params: { id: string } }) {
  const video = await prisma.video.findUnique({
    where: { youtubeId: params.id },
    include: {
      lyrics: {
        orderBy: {
          startTime: 'asc'
        }
      }
    }
  });

  if (!video) {
    redirect("/");
  }

  return <VideoPlayer video={video} />;
}
