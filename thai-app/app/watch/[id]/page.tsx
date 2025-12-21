import { getVideoByYoutubeId, getLyricsByVideoId } from "@/lib/firestore";
import { redirect } from "next/navigation";
import VideoPlayer from "@/components/lyrics/VideoPlayer";

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const video = await getVideoByYoutubeId(resolvedParams.id);

  if (!video) {
    redirect("/");
  }

  // Get lyrics for the video
  const lyrics = await getLyricsByVideoId(video.id);

  // Format the video data to match expected structure
  const videoWithLyrics = {
    ...video,
    lyrics: lyrics.map(lyric => ({
      ...lyric,
      words: [] // Words would need a separate fetch if needed
    }))
  };

  return <VideoPlayer video={videoWithLyrics} />;
}
