import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // Fetch admin data
  const admin = await prisma.admin.findUnique({
    where: { email: session.user?.email! },
    include: {
      videos: {
        include: {
          lyrics: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      },
      notifications: {
        where: {
          isRead: false
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  if (!admin) {
    redirect("/auth/signin");
  }

  // Fetch channel monitor data
  const channelMonitor = await prisma.channelMonitor.findFirst();

  return (
    <AdminDashboard
      admin={admin}
      videos={admin.videos}
      notifications={admin.notifications}
      channelMonitor={channelMonitor}
    />
  );
}
