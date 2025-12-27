import axios from 'axios';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  duration: string;
  channelTitle: string;
}

export interface ChannelData {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  customUrl?: string;
}

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Convert ISO 8601 duration to seconds
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Fetch video details from YouTube API
 */
export async function fetchVideoDetails(videoId: string): Promise<YouTubeVideo | null> {
  try {
    console.log('[YouTube API] Fetching details for video:', videoId);

    const response = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
      params: {
        part: 'snippet,contentDetails',
        id: videoId,
        key: process.env.YOUTUBE_API_KEY
      }
    });

    console.log('[YouTube API] Response status:', response.status);

    if (!response.data.items || response.data.items.length === 0) {
      console.warn('[YouTube API] No video found with ID:', videoId);
      return null;
    }

    const video = response.data.items[0];
    console.log('[YouTube API] Successfully fetched video:', {
      id: video.id,
      title: video.snippet.title,
      channelTitle: video.snippet.channelTitle
    });

    return {
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnailUrl: video.snippet.thumbnails.high.url,
      publishedAt: video.snippet.publishedAt,
      duration: video.contentDetails.duration,
      channelTitle: video.snippet.channelTitle
    };
  } catch (error: any) {
    console.error('[YouTube API] Error fetching video details:', {
      videoId,
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    // Log specific YouTube API errors
    if (error.response?.data?.error) {
      const ytError = error.response.data.error;
      console.error('[YouTube API] YouTube API Error:', {
        code: ytError.code,
        message: ytError.message,
        errors: ytError.errors
      });
    }

    return null;
  }
}

/**
 * Fetch channel details
 */
export async function fetchChannelDetails(channelId: string): Promise<ChannelData | null> {
  try {
    const response = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
      params: {
        part: 'snippet,brandingSettings',
        id: channelId,
        key: process.env.YOUTUBE_API_KEY
      }
    });

    if (!response.data.items || response.data.items.length === 0) {
      return null;
    }

    const channel = response.data.items[0];
    return {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      thumbnailUrl: channel.snippet.thumbnails.high.url,
      customUrl: channel.snippet.customUrl
    };
  } catch (error) {
    console.error('Error fetching channel details:', error);
    return null;
  }
}

/**
 * Fetch latest videos from a channel
 */
export async function fetchLatestVideos(channelId: string, maxResults: number = 10): Promise<YouTubeVideo[]> {
  try {
    const response = await axios.get(`${YOUTUBE_API_BASE}/search`, {
      params: {
        part: 'snippet',
        channelId: channelId,
        maxResults: maxResults,
        order: 'date',
        type: 'video',
        key: process.env.YOUTUBE_API_KEY
      }
    });

    if (!response.data.items || response.data.items.length === 0) {
      return [];
    }

    // Fetch full details for each video
    const videoIds = response.data.items.map((item: any) => item.id.videoId).join(',');
    const detailsResponse = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
      params: {
        part: 'snippet,contentDetails',
        id: videoIds,
        key: process.env.YOUTUBE_API_KEY
      }
    });

    return detailsResponse.data.items.map((video: any) => ({
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnailUrl: video.snippet.thumbnails.high.url,
      publishedAt: video.snippet.publishedAt,
      duration: video.contentDetails.duration,
      channelTitle: video.snippet.channelTitle
    }));
  } catch (error) {
    console.error('Error fetching latest videos:', error);
    return [];
  }
}

/**
 * Check for new videos on a channel
 */
export async function checkForNewVideos(channelId: string, lastVideoId: string | null): Promise<YouTubeVideo[]> {
  const latestVideos = await fetchLatestVideos(channelId, 5);

  if (!lastVideoId) {
    return latestVideos;
  }

  const newVideos: YouTubeVideo[] = [];
  for (const video of latestVideos) {
    if (video.id === lastVideoId) {
      break;
    }
    newVideos.push(video);
  }

  return newVideos;
}
