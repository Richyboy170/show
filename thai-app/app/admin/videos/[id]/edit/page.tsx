import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import VideoEditor from "@/components/admin/VideoEditor";

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
  const video = await prisma.video.findUnique({
    where: { id: resolvedParams.id },
    include: {
      lyrics: {
        orderBy: {
          startTime: 'asc'
        }
      }
    }
  });

  if (!video) {
    redirect("/admin");
  }

  return <VideoEditor video={video} />;
}
