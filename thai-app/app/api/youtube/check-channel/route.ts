import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getChannelMonitorByChannelId,
  createChannelMonitor,
  updateChannelMonitor,
  getAdminByEmail,
  createNotification
} from "@/lib/firestore";
import { checkForNewVideos, fetchChannelDetails } from "@/lib/youtube";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (!session.user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    if (!channelId) {
      return NextResponse.json({ error: "YouTube channel ID not configured" }, { status: 500 });
    }

    // Get or create channel monitor
    let channelMonitor = await getChannelMonitorByChannelId(channelId);

    if (!channelMonitor) {
      const channelDetails = await fetchChannelDetails(channelId);
      channelMonitor = await createChannelMonitor({
        channelId,
        channelTitle: channelDetails?.title,
        channelHandle: channelDetails?.customUrl
      });
    }

    // Check for new videos
    const newVideos = await checkForNewVideos(channelId, channelMonitor.lastVideoId);

    // Get admin
    const admin = await getAdminByEmail(session.user?.email!);

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Create notifications for new videos
    for (const video of newVideos) {
      await createNotification({
        adminId: admin.id,
        type: 'NEW_VIDEO',
        title: 'New Video Detected',
        message: `A new video "${video.title}" has been published on the channel.`,
        youtubeId: video.id,
        isRead: false,
        metadata: JSON.stringify({
          title: video.title,
          description: video.description,
          thumbnailUrl: video.thumbnailUrl,
          publishedAt: video.publishedAt
        })
      });
    }

    // Update channel monitor
    if (newVideos.length > 0) {
      await updateChannelMonitor(channelMonitor.id, {
        lastVideoId: newVideos[0].id,
        lastVideoPublishedAt: new Date(newVideos[0].publishedAt),
        lastChecked: new Date()
      });
    } else {
      await updateChannelMonitor(channelMonitor.id, {
        lastChecked: new Date()
      });
    }

    return NextResponse.json({
      success: true,
      newVideosCount: newVideos.length,
      newVideos
    });
  } catch (error) {
    console.error('Error checking channel:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
