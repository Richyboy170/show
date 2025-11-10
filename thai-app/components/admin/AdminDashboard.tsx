'use client';

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Music, LogOut, Bell, Plus, Youtube, Home } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Music className="w-8 h-8 text-pink-600" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600">Welcome, {admin.name || admin.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-pink-600 transition-colors"
              >
                <Home className="w-5 h-5" />
                <span className="hidden sm:inline">View Site</span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Videos</p>
                <p className="text-3xl font-bold text-gray-900">{videos.length}</p>
              </div>
              <Youtube className="w-12 h-12 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Lyrics</p>
                <p className="text-3xl font-bold text-gray-900">
                  {videos.reduce((sum, v) => sum + (v.lyrics?.length || 0), 0)}
                </p>
              </div>
              <Music className="w-12 h-12 text-pink-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Unread Notifications</p>
                <p className="text-3xl font-bold text-gray-900">{notifications.length}</p>
              </div>
              <Bell className="w-12 h-12 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('videos')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'videos'
                  ? 'text-pink-600 border-b-2 border-pink-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Music className="w-5 h-5" />
                <span>My Videos</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'add'
                  ? 'text-pink-600 border-b-2 border-pink-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                <span>Add Video</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 px-6 py-4 font-medium transition-colors relative ${
                activeTab === 'notifications'
                  ? 'text-pink-600 border-b-2 border-pink-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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

        {/* Channel Monitor Info */}
        {channelMonitor && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-500" />
              Channel Monitor Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Channel: {channelMonitor.channelTitle || 'Not set'}</p>
                <p className="text-gray-600">Handle: {channelMonitor.channelHandle || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">
                  Last Checked: {channelMonitor.lastChecked
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
