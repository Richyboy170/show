import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getNotificationById,
  updateNotification,
  getAdminByEmail,
  createVideo
} from "@/lib/firestore";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (!session.user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const resolvedParams = await params;
    const notification = await getNotificationById(resolvedParams.id);

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    // Handle the approval based on notification type
    if (notification.type === 'NEW_VIDEO' && notification.youtubeId) {
      // Auto-add the video if admin approves
      const { fetchVideoDetails, parseDuration } = await import('@/lib/youtube');
      const videoDetails = await fetchVideoDetails(notification.youtubeId);

      if (videoDetails) {
        // Get current admin to track who approved it (optional)
        const admin = await getAdminByEmail(session.user?.email!);

        // Create video shared among all admins
        await createVideo({
          youtubeId: notification.youtubeId,
          title: videoDetails.title,
          description: videoDetails.description,
          thumbnailUrl: videoDetails.thumbnailUrl,
          publishedAt: new Date(videoDetails.publishedAt),
          duration: parseDuration(videoDetails.duration),
          channelTitle: videoDetails.channelTitle,
          adminId: admin?.id // Optional: track who approved it
        });
      }
    }

    // Mark notification as approved and read
    await updateNotification(resolvedParams.id, {
      isApproved: true,
      isRead: true
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error approving notification:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
