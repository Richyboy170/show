'use client';

import { Bell, Check, X, ExternalLink } from "lucide-react";
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
      <div className="text-center py-12">
        <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No notifications</p>
        <p className="text-gray-400 text-sm mt-2">
          You'll be notified when there are changes to the YouTube channel
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => {
        const metadata = notification.metadata ? JSON.parse(notification.metadata) : {};
        const isActionable = notification.type !== 'INFO';

        return (
          <div
            key={notification.id}
            className={`border rounded-lg p-4 ${
              notification.type === 'NEW_VIDEO'
                ? 'bg-green-50 border-green-200'
                : notification.type === 'VIDEO_UPDATED'
                ? 'bg-blue-50 border-blue-200'
                : notification.type === 'VIDEO_DELETED'
                ? 'bg-red-50 border-red-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {notification.title}
                </h3>
                <p className="text-sm text-gray-700 mb-2">
                  {notification.message}
                </p>
                {notification.youtubeId && (
                  <a
                    href={`https://www.youtube.com/watch?v=${notification.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    View on YouTube
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2">
                {isActionable ? (
                  <>
                    <button
                      onClick={() => handleApprove(notification.id)}
                      disabled={processing === notification.id}
                      className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      title="Approve change"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleReject(notification.id)}
                      disabled={processing === notification.id}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      title="Reject change"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    disabled={processing === notification.id}
                    className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                    title="Mark as read"
                  >
                    <Check className="w-5 h-5" />
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
