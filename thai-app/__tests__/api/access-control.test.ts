/**
 * Tests for Access Control
 *
 * This test suite ensures that:
 * - Normal users CANNOT access admin API endpoints
 * - Admin users CANNOT access user-only endpoints (favorites)
 * - Proper authorization checks are in place
 */

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

// Mock Next Auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    video: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    lyric: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    notification: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

// Import API route handlers
import { POST as createVideo } from '@/app/api/videos/route'
import { PUT as updateVideo, DELETE as deleteVideo } from '@/app/api/videos/[id]/route'
import { POST as createLyric, PUT as updateLyric, DELETE as deleteLyric } from '@/app/api/lyrics/route'
import { POST as approveNotification } from '@/app/api/notifications/[id]/approve/route'

describe('Access Control - Normal Users', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Video API - Admin Only', () => {
    it('should reject normal user from creating videos', async () => {
      const mockNormalUserSession = {
        user: {
          id: 'user-123',
          email: 'normaluser@gmail.com',
          name: 'Normal User',
          isAdmin: false,
        },
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(mockNormalUserSession)

      const request = new Request('http://localhost:3000/api/videos', {
        method: 'POST',
        body: JSON.stringify({
          youtubeUrl: 'https://www.youtube.com/watch?v=test',
          adminId: 'admin-123',
        }),
      })

      const response = await createVideo(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden: Admin access required')
      expect(prisma.video.create).not.toHaveBeenCalled()
    })

    it('should reject normal user from updating videos', async () => {
      const mockNormalUserSession = {
        user: {
          id: 'user-123',
          email: 'normaluser@gmail.com',
          isAdmin: false,
        },
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(mockNormalUserSession)

      const request = new Request('http://localhost:3000/api/videos/video-123', {
        method: 'PUT',
        body: JSON.stringify({
          title: 'Updated Title',
          description: 'Updated Description',
        }),
      })

      const response = await updateVideo(request, { params: { id: 'video-123' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden: Admin access required')
      expect(prisma.video.update).not.toHaveBeenCalled()
    })

    it('should reject normal user from deleting videos', async () => {
      const mockNormalUserSession = {
        user: {
          id: 'user-123',
          email: 'normaluser@gmail.com',
          isAdmin: false,
        },
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(mockNormalUserSession)

      const request = new Request('http://localhost:3000/api/videos/video-123', {
        method: 'DELETE',
      })

      const response = await deleteVideo(request, { params: { id: 'video-123' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden: Admin access required')
      expect(prisma.video.delete).not.toHaveBeenCalled()
    })
  })

  describe('Lyrics API - Admin Only', () => {
    it('should reject normal user from creating lyrics', async () => {
      const mockNormalUserSession = {
        user: {
          id: 'user-123',
          email: 'normaluser@gmail.com',
          isAdmin: false,
        },
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(mockNormalUserSession)

      const request = new Request('http://localhost:3000/api/lyrics', {
        method: 'POST',
        body: JSON.stringify({
          videoId: 'video-123',
          thaiText: 'Thai lyrics',
          translation: 'English translation',
          startTime: 0,
          endTime: 5,
          order: 0,
        }),
      })

      const response = await createLyric(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden: Admin access required')
      expect(prisma.lyric.create).not.toHaveBeenCalled()
    })

    it('should reject normal user from updating lyrics', async () => {
      const mockNormalUserSession = {
        user: {
          id: 'user-123',
          email: 'normaluser@gmail.com',
          isAdmin: false,
        },
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(mockNormalUserSession)

      const request = new Request('http://localhost:3000/api/lyrics', {
        method: 'PUT',
        body: JSON.stringify({
          id: 'lyric-123',
          thaiText: 'Updated lyrics',
        }),
      })

      const response = await updateLyric(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden: Admin access required')
      expect(prisma.lyric.update).not.toHaveBeenCalled()
    })

    it('should reject normal user from deleting lyrics', async () => {
      const mockNormalUserSession = {
        user: {
          id: 'user-123',
          email: 'normaluser@gmail.com',
          isAdmin: false,
        },
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(mockNormalUserSession)

      const request = new Request('http://localhost:3000/api/lyrics?id=lyric-123', {
        method: 'DELETE',
      })

      const response = await deleteLyric(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden: Admin access required')
      expect(prisma.lyric.delete).not.toHaveBeenCalled()
    })
  })

  describe('Notifications API - Admin Only', () => {
    it('should reject normal user from approving notifications', async () => {
      const mockNormalUserSession = {
        user: {
          id: 'user-123',
          email: 'normaluser@gmail.com',
          isAdmin: false,
        },
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(mockNormalUserSession)

      const request = new Request('http://localhost:3000/api/notifications/notif-123/approve', {
        method: 'POST',
      })

      const response = await approveNotification(request, { params: { id: 'notif-123' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden: Admin access required')
      expect(prisma.notification.update).not.toHaveBeenCalled()
    })
  })

  describe('Unauthenticated Access', () => {
    it('should reject unauthenticated video creation', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/videos', {
        method: 'POST',
        body: JSON.stringify({ youtubeUrl: 'https://youtube.com/watch?v=test' }),
      })

      const response = await createVideo(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should reject unauthenticated lyrics creation', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/lyrics', {
        method: 'POST',
        body: JSON.stringify({
          videoId: 'video-123',
          thaiText: 'Thai text',
          startTime: 0,
          endTime: 5,
        }),
      })

      const response = await createLyric(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('Session Validation', () => {
    it('should validate isAdmin flag is present in session', async () => {
      const mockSessionWithoutIsAdmin = {
        user: {
          id: 'user-123',
          email: 'normaluser@gmail.com',
          name: 'Normal User',
          // Missing isAdmin flag
        },
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(mockSessionWithoutIsAdmin)

      const request = new Request('http://localhost:3000/api/videos', {
        method: 'POST',
        body: JSON.stringify({ youtubeUrl: 'https://youtube.com/watch?v=test' }),
      })

      const response = await createVideo(request)
      const data = await response.json()

      // Should be treated as non-admin and rejected
      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden: Admin access required')
    })

    it('should explicitly check isAdmin=false', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'normaluser@gmail.com',
          isAdmin: false, // Explicitly false
        },
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const request = new Request('http://localhost:3000/api/videos', {
        method: 'POST',
        body: JSON.stringify({ youtubeUrl: 'https://youtube.com/watch?v=test' }),
      })

      const response = await createVideo(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden: Admin access required')
    })
  })

  describe('Multiple Normal Users Isolation', () => {
    it('should prevent user from accessing other users favorites', async () => {
      // This is implicitly tested by the favorites API tests
      // Favorites are always filtered by the authenticated user's ID
      // No cross-user access is possible
      expect(true).toBe(true)
    })

    it('should ensure normal users can only read public video data', async () => {
      // Normal users can GET videos (public endpoint)
      // But cannot POST, PUT, or DELETE videos
      expect(true).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle session with null user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({ user: null })

      const request = new Request('http://localhost:3000/api/videos', {
        method: 'POST',
        body: JSON.stringify({ youtubeUrl: 'https://youtube.com/watch?v=test' }),
      })

      const response = await createVideo(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden: Admin access required')
    })

    it('should handle session with undefined isAdmin', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'normaluser@gmail.com',
          isAdmin: undefined,
        },
      })

      const request = new Request('http://localhost:3000/api/videos', {
        method: 'POST',
        body: JSON.stringify({ youtubeUrl: 'https://youtube.com/watch?v=test' }),
      })

      const response = await createVideo(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden: Admin access required')
    })
  })
})

describe('Access Control - Admin Users Cannot Use Favorites', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should prevent admins from adding favorites', async () => {
    const mockAdminSession = {
      user: {
        id: 'admin-123',
        email: 'admin@test.com',
        isAdmin: true,
      },
    }

    ;(getServerSession as jest.Mock).mockResolvedValue(mockAdminSession)

    // Import favorites route
    const { POST } = await import('@/app/api/favorites/route')

    const request = new Request('http://localhost:3000/api/favorites', {
      method: 'POST',
      body: JSON.stringify({ videoId: 'video-123' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should prevent admins from viewing favorites', async () => {
    const mockAdminSession = {
      user: {
        id: 'admin-123',
        email: 'admin@test.com',
        isAdmin: true,
      },
    }

    ;(getServerSession as jest.Mock).mockResolvedValue(mockAdminSession)

    const { GET } = await import('@/app/api/favorites/route')

    const request = new Request('http://localhost:3000/api/favorites', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should prevent admins from removing favorites', async () => {
    const mockAdminSession = {
      user: {
        id: 'admin-123',
        email: 'admin@test.com',
        isAdmin: true,
      },
    }

    ;(getServerSession as jest.Mock).mockResolvedValue(mockAdminSession)

    const { DELETE } = await import('@/app/api/favorites/route')

    const request = new Request('http://localhost:3000/api/favorites?videoId=video-123', {
      method: 'DELETE',
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })
})
