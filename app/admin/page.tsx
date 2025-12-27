import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getAdminByEmail,
  getVideos,
  getNotificationsByAdmin,
  getChannelMonitorByChannelId
} from "@/lib/firestore";
import { firestore, COLLECTIONS } from "@/lib/firebase";
import AdminDashboard from "@/components/admin/AdminDashboard";

// Force dynamic rendering - authentication required
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  // Redirect to sign-in if not authenticated
  if (!session) {
    redirect("/auth/signin");
  }

  // Redirect to home if not an admin
  if (!session.user?.isAdmin) {
    redirect("/");
  }

  // Fetch admin data
  const admin = await getAdminByEmail(session.user?.email!);

  if (!admin) {
    redirect("/");
  }

  // Fetch all videos (shared among all admins)
  const videos = await getVideos({
    orderBy: 'createdAt',
    orderDirection: 'desc',
    includeLyrics: true
  });

  // Fetch notifications for this admin
  const notifications = await getNotificationsByAdmin(admin.id, true);

  // Fetch first channel monitor (simple approach)
  const channelMonitors = await firestore.collection(COLLECTIONS.CHANNEL_MONITORS).limit(1).get();
  const channelMonitor = channelMonitors.empty ? null : {
    id: channelMonitors.docs[0].id,
    ...channelMonitors.docs[0].data()
  };

  return (
    <AdminDashboard
      admin={admin}
      videos={videos}
      notifications={notifications}
      channelMonitor={channelMonitor}
    />
  );
}
