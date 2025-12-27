/**
 * Tests for Favorites API Endpoints
 *
 * This test suite ensures that:
 * - Normal users can add/remove favorites
 * - Admins CANNOT use favorites functionality
 * - Proper authentication is required
 * - Data validation works correctly
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

// Mock Next Auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    favorite: {
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))

// Mock the API routes
import { POST as addFavorite, DELETE as removeFavorite, GET as getFavorites } from '@/app/api/favorites/route'
import { GET as checkFavorite } from '@/app/api/favorites/check/route'

describe('Favorites API - Normal User Access', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/favorites - Add Favorite', () => {
    it('should allow normal user to add a favorite', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'normaluser@gmail.com',
          name: 'Normal User',
          isAdmin: false,
        },
      }

      const mockUser = {
        id: 'user-123',
        email: 'normaluser@gmail.com',
        name: 'Normal User',
      }

      const mockFavorite = {
        id: 'fav-123',
        userId: 'user-123',
        videoId: 'video-456',
        createdAt: new Date(),
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.favorite.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.favorite.create as jest.Mock).mockResolvedValue(mockFavorite)

      const request = new Request('http://localhost:3000/api/favorites', {
        method: 'POST',
        body: JSON.stringify({ videoId: 'video-456' }),
      })

      const response = await addFavorite(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.favorite).toEqual(mockFavorite)
      expect(prisma.favorite.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          videoId: 'video-456',
        },
      })
    })

    it('should reject admin user from adding favorites', async () => {
      const mockAdminSession = {
        user: {
          id: 'admin-123',
          email: 'admin@test.com',
          name: 'Admin User',
          isAdmin: true,
        },
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(mockAdminSession)

      const request = new Request('http://localhost:3000/api/favorites', {
        method: 'POST',
        body: JSON.stringify({ videoId: 'video-456' }),
      })

      const response = await addFavorite(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(prisma.favorite.create).not.toHaveBeenCalled()
    })

    it('should reject unauthenticated requests', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/favorites', {
        method: 'POST',
        body: JSON.stringify({ videoId: 'video-456' }),
      })

      const response = await addFavorite(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should reject request without videoId', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'normaluser@gmail.com',
          isAdmin: false,
        },
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const request = new Request('http://localhost:3000/api/favorites', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await addFavorite(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Video ID is required')
    })

    it('should reject if video already favorited', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'normaluser@gmail.com',
          isAdmin: false,
        },
      }

      const mockUser = {
        id: 'user-123',
        email: 'normaluser@gmail.com',
      }

      const existingFavorite = {
        id: 'fav-123',
        userId: 'user-123',
        videoId: 'video-456',
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.favorite.findUnique as jest.Mock).mockResolvedValue(existingFavorite)

      const request = new Request('http://localhost:3000/api/favorites', {
        method: 'POST',
        body: JSON.stringify({ videoId: 'video-456' }),
      })

      const response = await addFavorite(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Already favorited')
      expect(prisma.favorite.create).not.toHaveBeenCalled()
    })

    it('should handle user not found error', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'normaluser@gmail.com',
          isAdmin: false,
        },
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/favorites', {
        method: 'POST',
        body: JSON.stringify({ videoId: 'video-456' }),
      })

      const response = await addFavorite(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('User not found')
    })
  })

  describe('DELETE /api/favorites - Remove Favorite', () => {
    it('should allow normal user to remove a favorite', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'normaluser@gmail.com',
          isAdmin: false,
        },
      }

      const mockUser = {
        id: 'user-123',
        email: 'normaluser@gmail.com',
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.favorite.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })

      const request = new Request('http://localhost:3000/api/favorites?videoId=video-456', {
        method: 'DELETE',
      })

      const response = await removeFavorite(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(prisma.favorite.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          videoId: 'video-456',
        },
      })
    })

    it('should reject admin user from removing favorites', async () => {
      const mockAdminSession = {
        user: {
          id: 'admin-123',
          email: 'admin@test.com',
          isAdmin: true,
        },
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(mockAdminSession)

      const request = new Request('http://localhost:3000/api/favorites?videoId=video-456', {
        method: 'DELETE',
      })

      const response = await removeFavorite(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(prisma.favorite.deleteMany).not.toHaveBeenCalled()
    })

    it('should require videoId parameter', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'normaluser@gmail.com',
          isAdmin: false,
        },
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const request = new Request('http://localhost:3000/api/favorites', {
        method: 'DELETE',
      })

      const response = await removeFavorite(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Video ID is required')
    })
  })

  describe('GET /api/favorites - Get All Favorites', () => {
    it('should return all favorites for normal user', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'normaluser@gmail.com',
          isAdmin: false,
        },
      }

      const mockUserWithFavorites = {
        id: 'user-123',
        email: 'normaluser@gmail.com',
        favorites: [
          {
            id: 'fav-1',
            video: {
              id: 'video-1',
              youtubeId: 'yt-1',
              title: 'Song 1',
              lyrics: [],
            },
          },
          {
            id: 'fav-2',
            video: {
              id: 'video-2',
              youtubeId: 'yt-2',
              title: 'Song 2',
              lyrics: [],
            },
          },
        ],
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUserWithFavorites)

      const request = new Request('http://localhost:3000/api/favorites', {
        method: 'GET',
      })

      const response = await getFavorites(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.favorites).toHaveLength(2)
      expect(data.favorites[0].video.title).toBe('Song 1')
    })

    it('should reject admin user from getting favorites', async () => {
      const mockAdminSession = {
        user: {
          id: 'admin-123',
          email: 'admin@test.com',
          isAdmin: true,
        },
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(mockAdminSession)

      const request = new Request('http://localhost:3000/api/favorites', {
        method: 'GET',
      })

      const response = await getFavorites(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return empty array for user with no favorites', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'normaluser@gmail.com',
          isAdmin: false,
        },
      }

      const mockUserWithoutFavorites = {
        id: 'user-123',
        email: 'normaluser@gmail.com',
        favorites: [],
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUserWithoutFavorites)

      const request = new Request('http://localhost:3000/api/favorites', {
        method: 'GET',
      })

      const response = await getFavorites(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.favorites).toEqual([])
    })
  })

  describe('GET /api/favorites/check - Check if Favorited', () => {
    it('should return true if video is favorited by user', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'normaluser@gmail.com',
          isAdmin: false,
        },
      }

      const mockUser = {
        id: 'user-123',
        email: 'normaluser@gmail.com',
      }

      const mockFavorite = {
        id: 'fav-123',
        userId: 'user-123',
        videoId: 'video-456',
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.favorite.findUnique as jest.Mock).mockResolvedValue(mockFavorite)

      const request = new Request('http://localhost:3000/api/favorites/check?videoId=video-456', {
        method: 'GET',
      })

      const response = await checkFavorite(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.isFavorited).toBe(true)
    })

    it('should return false if video is not favorited', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'normaluser@gmail.com',
          isAdmin: false,
        },
      }

      const mockUser = {
        id: 'user-123',
        email: 'normaluser@gmail.com',
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.favorite.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/favorites/check?videoId=video-456', {
        method: 'GET',
      })

      const response = await checkFavorite(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.isFavorited).toBe(false)
    })

    it('should return false for admin users', async () => {
      const mockAdminSession = {
        user: {
          id: 'admin-123',
          email: 'admin@test.com',
          isAdmin: true,
        },
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(mockAdminSession)

      const request = new Request('http://localhost:3000/api/favorites/check?videoId=video-456', {
        method: 'GET',
      })

      const response = await checkFavorite(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.isFavorited).toBe(false)
      expect(prisma.user.findUnique).not.toHaveBeenCalled()
    })

    it('should return false for unauthenticated users', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/favorites/check?videoId=video-456', {
        method: 'GET',
      })

      const response = await checkFavorite(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.isFavorited).toBe(false)
    })
  })
})
