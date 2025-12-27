'use client';

import { Bell, Check, X, ExternalLink, Sparkles } from "lucide-react";
import axios from "axios";
import { useState } from "react";

interface NotificationPanelProps {
  notifications: any[];
  onNotificationsChange: (notifications: any[]) => void;
}

export default function NotificationPanel({
  notifications,
  onNotificationsChange
}: NotificationPanelProps) {
  const [processing, setProcessing] = useState<string | null>(null);

  const handleApprove = async (notificationId: string) => {
    setProcessing(notificationId);
    try {
      await axios.post(`/api/notifications/${notificationId}/approve`);
      onNotificationsChange(
        notifications.filter(n => n.id !== notificationId)
      );
    } catch (error) {
      console.error('Error approving notification:', error);
      alert('Failed to approve change');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (notificationId: string) => {
    setProcessing(notificationId);
    try {
      await axios.post(`/api/notifications/${notificationId}/reject`);
      onNotificationsChange(
        notifications.filter(n => n.id !== notificationId)
      );
    } catch (error) {
      console.error('Error rejecting notification:', error);
      alert('Failed to reject change');
    } finally {
      setProcessing(null);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    setProcessing(notificationId);
    try {
      await axios.post(`/api/notifications/${notificationId}/read`);
      onNotificationsChange(
        notifications.filter(n => n.id !== notificationId)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    } finally {
      setProcessing(null);
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="relative inline-block mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-[#FFD166] to-[#FFBE76] rounded-full flex items-center justify-center shadow-xl">
            <Bell className="w-12 h-12 text-white" />
          </div>
          <Sparkles className="w-6 h-6 text-[#4ECDC4] absolute -top-2 -right-2 animate-pulse" />
        </div>
        <p className="text-gray-600 text-xl font-bold mb-2" style={{ fontFamily: 'cursive' }}>
          All caught up! 🎉
        </p>
        <p className="text-gray-500 text-sm">
          You'll be notified when there are changes to the YouTube channel
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notifications.map((notification, index) => {
        const metadata = notification.metadata ? JSON.parse(notification.metadata) : {};
        const isActionable = notification.type !== 'INFO';
        
        // Assign colors based on type
        const typeColors = {
          'NEW_VIDEO': {
            bg: 'from-[#4ECDC4]/10 to-[#95E1D3]/10',
            border: 'border-[#4ECDC4]',
            text: 'text-[#4ECDC4]'
          },
          'VIDEO_UPDATED': {
            bg: 'from-[#FFD166]/10 to-[#FFBE76]/10',
            border: 'border-[#FFD166]',
            text: 'text-[#FFD166]'
          },
          'VIDEO_DELETED': {
            bg: 'from-[#FF6B6B]/10 to-[#FFA07A]/10',
            border: 'border-[#FF6B6B]',
            text: 'text-[#FF6B6B]'
          },
          'INFO': {
            bg: 'from-[#95E1D3]/10 to-[#4ECDC4]/10',
            border: 'border-[#95E1D3]',
            text: 'text-[#4ECDC4]'
          }
        };

        const colors = typeColors[notification.type as keyof typeof typeColors] || typeColors['INFO'];

        return (
          <div
            key={notification.id}
            className={`border-4 ${colors.border} rounded-2xl p-6 bg-gradient-to-br ${colors.bg} shadow-xl transform hover:scale-[1.02] transition-all`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className={`font-bold text-lg ${colors.text}`} style={{ fontFamily: 'cursive' }}>
                    {notification.title}
                  </h3>
                  {notification.type === 'NEW_VIDEO' && (
                    <span className="bg-gradient-to-r from-[#4ECDC4] to-[#95E1D3] text-white text-xs px-3 py-1 rounded-full font-bold">
                      NEW
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 mb-3 font-semibold">
                  {notification.message}
                </p>
                {notification.youtubeId && (
                  <a
                    href={`https://www.youtube.com/watch?v=${notification.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white px-4 py-2 rounded-full hover:from-[#FFA07A] hover:to-[#FF6B6B] transition-all shadow-md font-semibold"
                  >
                    View on YouTube
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <p className="text-xs text-gray-500 mt-3 font-semibold">
                  📅 {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2">
                {isActionable ? (
                  <>
                    <button
                      onClick={() => handleApprove(notification.id)}
                      disabled={processing === notification.id}
                      className="p-3 bg-gradient-to-br from-[#4ECDC4] to-[#95E1D3] text-white rounded-xl hover:from-[#95E1D3] hover:to-[#4ECDC4] transition-all disabled:opacity-50 shadow-lg transform hover:scale-110"
                      title="Approve change"
                    >
                      <Check className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => handleReject(notification.id)}
                      disabled={processing === notification.id}
                      className="p-3 bg-gradient-to-br from-[#FF6B6B] to-[#FFA07A] text-white rounded-xl hover:from-[#FFA07A] hover:to-[#FF6B6B] transition-all disabled:opacity-50 shadow-lg transform hover:scale-110"
                      title="Reject change"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    disabled={processing === notification.id}
                    className="p-3 bg-gradient-to-br from-[#FFD166] to-[#FFBE76] text-white rounded-xl hover:from-[#FFBE76] hover:to-[#FFD166] transition-all disabled:opacity-50 shadow-lg transform hover:scale-110"
                    title="Mark as read"
                  >
                    <Check className="w-6 h-6" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}