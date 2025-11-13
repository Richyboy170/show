/**
 * Tests for Normal User Authentication and Access Control
 *
 * This test suite ensures that normal (non-admin) users can:
 * - Sign in with Google OAuth
 * - Access public pages
 * - Use favorites functionality
 * - NOT access admin features
 */

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdminEmail } from '@/lib/admin-utils'

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    admin: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

// Mock admin utils
jest.mock('@/lib/admin-utils', () => ({
  isAdminEmail: jest.fn(),
  getAdminEmails: jest.fn(() => ['admin@test.com']),
}))

describe('Normal User Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Set up environment
    process.env.ADMIN_EMAILS = 'admin@test.com'
  })

  describe('Google OAuth Sign-In for Normal Users', () => {
    it('should create a regular user account for non-admin email', async () => {
      const mockUser = {
        id: 'user-456',
        email: 'normaluser@gmail.com',
        name: 'Normal User',
        image: 'https://example.com/avatar.jpg',
        googleId: 'google-abc123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Mock isAdminEmail to return false for normal user
      ;(isAdminEmail as jest.Mock).mockReturnValue(false)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.user.create as jest.Mock).mockResolvedValue(mockUser)

      const user = {
        id: 'temp-id',
        email: 'normaluser@gmail.com',
        name: 'Normal User',
        image: 'https://example.com/avatar.jpg',
      }

      const account = {
        provider: 'google',
        providerAccountId: 'google-abc123',
      }

      const result = await authOptions.callbacks!.signIn!({
        user,
        account,
        profile: undefined,
      } as any)

      expect(result).toBe(true)
      expect(isAdminEmail).toHaveBeenCalledWith('normaluser@gmail.com')
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'normaluser@gmail.com' },
      })
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'normaluser@gmail.com',
          name: 'Normal User',
          googleId: 'google-abc123',
          image: 'https://example.com/avatar.jpg',
        },
      })
      expect(user.id).toBe(mockUser.id)
    })

    it('should update existing user on subsequent sign-ins', async () => {
      const existingUser = {
        id: 'user-456',
        email: 'normaluser@gmail.com',
        name: 'Old Name',
        image: 'https://example.com/old-avatar.jpg',
        googleId: 'google-abc123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const updatedUser = {
        ...existingUser,
        name: 'Updated Name',
        image: 'https://example.com/new-avatar.jpg',
      }

      ;(isAdminEmail as jest.Mock).mockReturnValue(false)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser)
      ;(prisma.user.update as jest.Mock).mockResolvedValue(updatedUser)

      const user = {
        id: 'temp-id',
        email: 'normaluser@gmail.com',
        name: 'Updated Name',
        image: 'https://example.com/new-avatar.jpg',
      }

      const account = {
        provider: 'google',
        providerAccountId: 'google-abc123',
      }

      const result = await authOptions.callbacks!.signIn!({
        user,
        account,
        profile: undefined,
      } as any)

      expect(result).toBe(true)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: existingUser.id },
        data: {
          googleId: 'google-abc123',
          image: 'https://example.com/new-avatar.jpg',
          name: 'Updated Name',
        },
      })
    })

    it('should NOT create an admin account for normal user', async () => {
      ;(isAdminEmail as jest.Mock).mockReturnValue(false)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-789',
        email: 'normaluser@gmail.com',
        name: 'Normal User',
        googleId: 'google-xyz',
      })

      const user = {
        id: 'temp-id',
        email: 'normaluser@gmail.com',
        name: 'Normal User',
        image: null,
      }

      const account = {
        provider: 'google',
        providerAccountId: 'google-xyz',
      }

      await authOptions.callbacks!.signIn!({
        user,
        account,
        profile: undefined,
      } as any)

      // Verify admin methods were NEVER called
      expect(prisma.admin.findUnique).not.toHaveBeenCalled()
      expect(prisma.admin.create).not.toHaveBeenCalled()
      expect(prisma.admin.update).not.toHaveBeenCalled()
    })
  })

  describe('JWT Token for Normal Users', () => {
    it('should set isAdmin=false for normal user email', async () => {
      ;(isAdminEmail as jest.Mock).mockReturnValue(false)

      const token = {}
      const user = {
        id: 'user-123',
        email: 'normaluser@gmail.com',
        name: 'Normal User',
        image: 'https://example.com/avatar.jpg',
      }

      const result = await authOptions.callbacks!.jwt!({
        token,
        user,
        account: null,
        profile: undefined,
        trigger: undefined,
      } as any)

      expect(result.isAdmin).toBe(false)
      expect(result.email).toBe('normaluser@gmail.com')
      expect(result.sub).toBe('user-123')
      expect(result.name).toBe('Normal User')
    })

    it('should maintain isAdmin=false on token refresh', async () => {
      ;(isAdminEmail as jest.Mock).mockReturnValue(false)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        email: 'normaluser@gmail.com',
        name: 'Normal User',
        image: 'https://example.com/avatar.jpg',
      })

      const token = {
        sub: 'user-123',
        email: 'normaluser@gmail.com',
        name: 'Normal User',
        picture: 'https://example.com/avatar.jpg',
        isAdmin: false,
      }

      const result = await authOptions.callbacks!.jwt!({
        token,
        user: undefined,
        account: null,
        profile: undefined,
        trigger: 'update',
      } as any)

      expect(result.isAdmin).toBe(false)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'normaluser@gmail.com' },
      })
    })
  })

  describe('Session for Normal Users', () => {
    it('should create session with isAdmin=false', async () => {
      const session = {
        user: {},
        expires: '2025-12-31',
      }

      const token = {
        sub: 'user-123',
        email: 'normaluser@gmail.com',
        name: 'Normal User',
        picture: 'https://example.com/avatar.jpg',
        isAdmin: false,
      }

      const result = await authOptions.callbacks!.session!({
        session,
        token,
        user: undefined,
        newSession: undefined,
        trigger: undefined,
      } as any)

      expect(result.user.id).toBe('user-123')
      expect(result.user.email).toBe('normaluser@gmail.com')
      expect(result.user.name).toBe('Normal User')
      expect(result.user.image).toBe('https://example.com/avatar.jpg')
      expect(result.user.isAdmin).toBe(false)
    })

    it('should never have isAdmin=true for non-admin email', async () => {
      const session = {
        user: {},
        expires: '2025-12-31',
      }

      // Even if token somehow has isAdmin=true, session callback uses token value
      const token = {
        sub: 'user-123',
        email: 'normaluser@gmail.com',
        name: 'Normal User',
        picture: 'https://example.com/avatar.jpg',
        isAdmin: false, // This must be false for normal users
      }

      const result = await authOptions.callbacks!.session!({
        session,
        token,
        user: undefined,
        newSession: undefined,
        trigger: undefined,
      } as any)

      expect(result.user.isAdmin).toBe(false)
    })
  })

  describe('Credentials Provider for Normal Users', () => {
    it('should reject password login for non-admin email', async () => {
      ;(isAdminEmail as jest.Mock).mockReturnValue(false)

      const credentialsProvider: any = authOptions.providers.find(
        (p: any) => p.id === 'credentials'
      )

      const result = await credentialsProvider.authorize({
        email: 'normaluser@gmail.com',
        password: 'anypassword',
      })

      // Normal users cannot use password login - only admins can
      expect(result).toBeNull()
      // The function should return null for non-admin emails
    })

    it('should not query database for non-admin credentials', async () => {
      ;(isAdminEmail as jest.Mock).mockReturnValue(false)

      const credentialsProvider: any = authOptions.providers.find(
        (p: any) => p.id === 'credentials'
      )

      await credentialsProvider.authorize({
        email: 'normaluser@gmail.com',
        password: 'anypassword',
      })

      // Should reject before even checking database
      expect(prisma.admin.findUnique).not.toHaveBeenCalled()
      expect(prisma.user.findUnique).not.toHaveBeenCalled()
    })
  })

  describe('Email Validation', () => {
    it('should reject sign-in with no email', async () => {
      const user = {
        id: 'temp-id',
        email: null,
        name: 'No Email User',
      }

      const account = {
        provider: 'google',
        providerAccountId: 'google-123',
      }

      const result = await authOptions.callbacks!.signIn!({
        user,
        account,
        profile: undefined,
      } as any)

      expect(result).toBe(false)
    })

    it('should reject sign-in with undefined email', async () => {
      const user = {
        id: 'temp-id',
        email: undefined,
        name: 'No Email User',
      }

      const account = {
        provider: 'google',
        providerAccountId: 'google-123',
      }

      const result = await authOptions.callbacks!.signIn!({
        user,
        account,
        profile: undefined,
      } as any)

      expect(result).toBe(false)
    })
  })

  describe('Multiple Normal Users', () => {
    it('should handle multiple different normal users', async () => {
      const users = [
        {
          email: 'user1@gmail.com',
          name: 'User One',
          id: 'user-1',
          googleId: 'google-1',
        },
        {
          email: 'user2@gmail.com',
          name: 'User Two',
          id: 'user-2',
          googleId: 'google-2',
        },
        {
          email: 'user3@yahoo.com',
          name: 'User Three',
          id: 'user-3',
          googleId: 'google-3',
        },
      ]

      ;(isAdminEmail as jest.Mock).mockReturnValue(false)

      for (const mockUser of users) {
        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
        ;(prisma.user.create as jest.Mock).mockResolvedValue(mockUser)

        const user = {
          id: 'temp-id',
          email: mockUser.email,
          name: mockUser.name,
          image: null,
        }

        const account = {
          provider: 'google',
          providerAccountId: mockUser.googleId,
        }

        const result = await authOptions.callbacks!.signIn!({
          user,
          account,
          profile: undefined,
        } as any)

        expect(result).toBe(true)
        expect(user.id).toBe(mockUser.id)

        // Verify JWT sets isAdmin=false
        const token = {}
        const jwtResult = await authOptions.callbacks!.jwt!({
          token,
          user,
          account: null,
          profile: undefined,
          trigger: undefined,
        } as any)

        expect(jwtResult.isAdmin).toBe(false)
      }

      // Verify all were created as regular users
      expect(prisma.user.create).toHaveBeenCalledTimes(3)
      expect(prisma.admin.create).not.toHaveBeenCalled()
    })
  })
})
