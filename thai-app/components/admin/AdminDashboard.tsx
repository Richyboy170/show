'use client';

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Music, LogOut, Bell, Plus, Youtube, Home, Sparkles } from "lucide-react";
import Link from "next/link";
import VideoList from "./VideoList";
import AddVideoForm from "./AddVideoForm";
import NotificationPanel from "./NotificationPanel";

interface AdminDashboardProps {
  admin: any;
  videos: any[];
  notifications: any[];
  channelMonitor: any;
}

export default function AdminDashboard({
  admin,
  videos: initialVideos,
  notifications: initialNotifications,
  channelMonitor
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'videos' | 'add' | 'notifications'>('videos');
  const [videos, setVideos] = useState(initialVideos);
  const [notifications, setNotifications] = useState(initialNotifications);

  const handleVideoAdded = (newVideo: any) => {
    setVideos([newVideo, ...videos]);
    setActiveTab('videos');
  };

  const handleVideoDeleted = (videoId: string) => {
    setVideos(videos.filter(v => v.id !== videoId));
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Party Lantern Decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-5 left-[10%] w-12 h-12 bg-[#FFD166] rounded-full shadow-lg"></div>
        <div className="absolute top-3 right-[15%] w-14 h-14 bg-[#FF6B6B] rounded-full shadow-lg"></div>
        <div className="absolute top-10 left-[30%] w-10 h-10 bg-[#4ECDC4] rounded-full shadow-lg"></div>
        <div className="absolute bottom-20 right-[20%] w-12 h-12 bg-[#FFA07A] rounded-full shadow-lg"></div>
        <div className="absolute bottom-10 left-[25%] w-10 h-10 bg-[#95E1D3] rounded-full shadow-lg"></div>
      </div>

      {/* Header */}
      <header className="relative bg-white/95 backdrop-blur-md shadow-lg border-b-4 border-[#FF6B6B] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B6B] to-[#FFA07A] rounded-full flex items-center justify-center">
                  <Music className="w-7 h-7 text-white" />
                </div>
                <Sparkles className="w-4 h-4 text-[#FFD166] absolute -top-1 -right-1" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#FF6B6B]" style={{ fontFamily: 'cursive' }}>
                  Admin Dashboard
                </h1>
                <p className="text-sm text-[#4ECDC4] font-semibold">Welcome, {admin.name || admin.email} ✨</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-[#FF6B6B] transition-colors font-semibold rounded-lg hover:bg-[#FFD166]/10"
              >
                <Home className="w-5 h-5" />
                <span className="hidden sm:inline">View Site</span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white rounded-lg hover:from-[#FFA07A] hover:to-[#FF6B6B] transition-all shadow-lg font-semibold"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Stats - Party themed cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6 border-4 border-[#FF6B6B] transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1 font-semibold">Total Videos</p>
                <p className="text-4xl font-bold text-[#FF6B6B]" style={{ fontFamily: 'cursive' }}>{videos.length}</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#FF6B6B] to-[#FFA07A] rounded-full flex items-center justify-center shadow-lg">
                <Youtube className="w-9 h-9 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border-4 border-[#4ECDC4] transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1 font-semibold">Total Lyrics</p>
                <p className="text-4xl font-bold text-[#4ECDC4]" style={{ fontFamily: 'cursive' }}>
                  {videos.reduce((sum, v) => sum + (v.lyrics?.length || 0), 0)}
                </p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#4ECDC4] to-[#95E1D3] rounded-full flex items-center justify-center shadow-lg">
                <Music className="w-9 h-9 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border-4 border-[#FFD166] transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1 font-semibold">Unread Notifications</p>
                <p className="text-4xl font-bold text-[#FFD166]" style={{ fontFamily: 'cursive' }}>{notifications.length}</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#FFD166] to-[#FFBE76] rounded-full flex items-center justify-center shadow-lg">
                <Bell className="w-9 h-9 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - Party themed */}
        <div className="bg-white rounded-2xl shadow-xl mb-6 border-4 border-[#95E1D3]">
          <div className="flex border-b-2 border-[#95E1D3]">
            <button
              onClick={() => setActiveTab('videos')}
              className={`flex-1 px-6 py-4 font-bold transition-all ${
                activeTab === 'videos'
                  ? 'text-[#FF6B6B] border-b-4 border-[#FF6B6B] bg-[#FF6B6B]/5'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Music className="w-5 h-5" />
                <span>My Videos</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`flex-1 px-6 py-4 font-bold transition-all ${
                activeTab === 'add'
                  ? 'text-[#4ECDC4] border-b-4 border-[#4ECDC4] bg-[#4ECDC4]/5'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                <span>Add Video</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 px-6 py-4 font-bold transition-all relative ${
                activeTab === 'notifications'
                  ? 'text-[#FFD166] border-b-4 border-[#FFD166] bg-[#FFD166]/5'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </div>
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'videos' && (
              <VideoList videos={videos} onVideoDeleted={handleVideoDeleted} />
            )}
            {activeTab === 'add' && (
              <AddVideoForm onVideoAdded={handleVideoAdded} adminId={admin.id} />
            )}
            {activeTab === 'notifications' && (
              <NotificationPanel
                notifications={notifications}
                onNotificationsChange={setNotifications}
              />
            )}
          </div>
        </div>

        {/* Channel Monitor Info - Party themed */}
        {channelMonitor && (
          <div className="bg-white rounded-2xl shadow-xl p-6 border-4 border-[#FFA07A]">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-[#FF6B6B]" style={{ fontFamily: 'cursive' }}>
              <div className="w-8 h-8 bg-gradient-to-br from-[#FF6B6B] to-[#FFA07A] rounded-full flex items-center justify-center">
                <Youtube className="w-5 h-5 text-white" />
              </div>
              Channel Monitor Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-gradient-to-br from-[#FFD166]/10 to-[#FFBE76]/10 p-4 rounded-xl border-2 border-[#FFD166]">
                <p className="text-gray-700 font-semibold mb-1">Channel: {channelMonitor.channelTitle || 'Not set'}</p>
                <p className="text-gray-600">Handle: {channelMonitor.channelHandle || 'N/A'}</p>
              </div>
              <div className="bg-gradient-to-br from-[#4ECDC4]/10 to-[#95E1D3]/10 p-4 rounded-xl border-2 border-[#4ECDC4]">
                <p className="text-gray-700 font-semibold mb-1">Last Checked:</p>
                <p className="text-gray-600">
                  {channelMonitor.lastChecked
                    ? new Date(channelMonitor.lastChecked).toLocaleString()
                    : 'Never'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}