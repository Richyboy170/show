import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getVideoById, getLyricsByVideoId } from "@/lib/firestore";
import VideoEditor from "@/components/admin/VideoEditor";

// Force dynamic rendering - authentication required
export const dynamic = 'force-dynamic';

export default async function EditVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  // Redirect to sign-in if not authenticated
  if (!session) {
    redirect("/auth/signin");
  }

  // Redirect to home if not an admin
  if (!session.user?.isAdmin) {
    redirect("/");
  }

  const resolvedParams = await params;
  const video = await getVideoById(resolvedParams.id);

  if (!video) {
    redirect("/admin");
  }

  // Get lyrics for the video
  const lyrics = await getLyricsByVideoId(resolvedParams.id);

  const videoWithLyrics = {
    ...video,
    lyrics
  };

  return <VideoEditor video={videoWithLyrics} />;
}
