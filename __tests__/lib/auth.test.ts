import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    admin: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}))

describe('Auth Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.ADMIN_EMAIL = 'admin@test.com'
    process.env.ADMIN_PASSWORD = 'testpassword'
  })

  describe('Google OAuth Provider', () => {
    it('should have correct client configuration', () => {
      const googleProvider = authOptions.providers.find(
        (p: any) => p.id === 'google'
      )
      expect(googleProvider).toBeDefined()
      expect(googleProvider?.options?.clientId).toBe(process.env.GOOGLE_CLIENT_ID)
    })

    it('should use select_account prompt', () => {
      const googleProvider: any = authOptions.providers.find(
        (p: any) => p.id === 'google'
      )
      expect(googleProvider?.options?.authorization?.params?.prompt).toBe('select_account')
    })
  })

  describe('signIn Callback', () => {
    it('should create admin user on first Google sign-in with admin email', async () => {
      const mockAdmin = {
        id: 'admin-123',
        email: 'admin@test.com',
        name: 'Admin User',
        image: 'https://example.com/image.jpg',
        googleId: 'google-123',
      };

      (prisma.admin.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.admin.create as jest.Mock).mockResolvedValue(mockAdmin);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password')

      const user = {
        id: 'temp-id',
        email: 'admin@test.com',
        name: 'Admin User',
        image: 'https://example.com/image.jpg',
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

      expect(result).toBe(true)
      expect(prisma.admin.findUnique).toHaveBeenCalledWith({
        where: { email: 'admin@test.com' },
      })
      expect(prisma.admin.create).toHaveBeenCalled()
      expect(user.id).toBe(mockAdmin.id)
    })

    it('should create regular user on first Google sign-in with non-admin email', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@test.com',
        name: 'Regular User',
        image: 'https://example.com/image.jpg',
        googleId: 'google-456',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser)

      const user = {
        id: 'temp-id',
        email: 'user@test.com',
        name: 'Regular User',
        image: 'https://example.com/image.jpg',
      }

      const account = {
        provider: 'google',
        providerAccountId: 'google-456',
      }

      const result = await authOptions.callbacks!.signIn!({
        user,
        account,
        profile: undefined,
      } as any)

      expect(result).toBe(true)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'user@test.com' },
      })
      expect(prisma.user.create).toHaveBeenCalled()
      expect(user.id).toBe(mockUser.id)
    })

    it('should update existing admin on subsequent sign-ins', async () => {
      const existingAdmin = {
        id: 'admin-123',
        email: 'admin@test.com',
        name: 'Old Name',
        image: 'https://example.com/old-image.jpg',
        googleId: 'google-123',
      };

      (prisma.admin.findUnique as jest.Mock).mockResolvedValue(existingAdmin);
      (prisma.admin.update as jest.Mock).mockResolvedValue({
        ...existingAdmin,
        name: 'New Name',
        image: 'https://example.com/new-image.jpg',
      })

      const user = {
        id: 'temp-id',
        email: 'admin@test.com',
        name: 'New Name',
        image: 'https://example.com/new-image.jpg',
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

      expect(result).toBe(true)
      expect(prisma.admin.update).toHaveBeenCalled()
    })

    it('should return false if no email provided', async () => {
      const user = {
        id: 'temp-id',
        email: null,
        name: 'Test User',
      }

      const account = {
        provider: 'google',
        providerAccountId: 'google-789',
      }

      const result = await authOptions.callbacks!.signIn!({
        user,
        account,
        profile: undefined,
      } as any)

      expect(result).toBe(false)
    })
  })

  describe('JWT Callback', () => {
    it('should set isAdmin=true for admin email', async () => {
      const token = {}
      const user = {
        id: 'admin-123',
        email: 'admin@test.com',
        name: 'Admin User',
        image: 'https://example.com/image.jpg',
      }

      const result = await authOptions.callbacks!.jwt!({
        token,
        user,
        account: null,
        profile: undefined,
        trigger: undefined,
      } as any)

      expect(result.isAdmin).toBe(true)
      expect(result.email).toBe('admin@test.com')
    })

    it('should set isAdmin=false for non-admin email', async () => {
      const token = {}
      const user = {
        id: 'user-123',
        email: 'user@test.com',
        name: 'Regular User',
        image: 'https://example.com/image.jpg',
      }

      const result = await authOptions.callbacks!.jwt!({
        token,
        user,
        account: null,
        profile: undefined,
        trigger: undefined,
      } as any)

      expect(result.isAdmin).toBe(false)
      expect(result.email).toBe('user@test.com')
    })
  })

  describe('Session Callback', () => {
    it('should populate session with token data', async () => {
      const session = {
        user: {},
        expires: '2025-12-31',
      }

      const token = {
        sub: 'user-123',
        email: 'user@test.com',
        name: 'Test User',
        picture: 'https://example.com/image.jpg',
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
      expect(result.user.email).toBe('user@test.com')
      expect(result.user.name).toBe('Test User')
      expect(result.user.isAdmin).toBe(false)
    })
  })

  describe('Credentials Provider', () => {
    it('should authenticate admin with correct credentials', async () => {
      const mockAdmin = {
        id: 'admin-123',
        email: 'admin@test.com',
        name: 'Admin',
        password: 'hashed_password',
        image: null,
      };

      (prisma.admin.findUnique as jest.Mock).mockResolvedValue(mockAdmin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true)

      const credentialsProvider: any = authOptions.providers.find(
        (p: any) => p.id === 'credentials'
      )

      const result = await credentialsProvider.authorize({
        email: 'admin@test.com',
        password: 'testpassword',
      })

      expect(result).toEqual({
        id: 'admin-123',
        email: 'admin@test.com',
        name: 'Admin',
        image: null,
      })
    })

    it('should reject authentication with wrong password', async () => {
      const mockAdmin = {
        id: 'admin-123',
        email: 'admin@test.com',
        name: 'Admin',
        password: 'hashed_password',
        image: null,
      };

      (prisma.admin.findUnique as jest.Mock).mockResolvedValue(mockAdmin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false)

      const credentialsProvider: any = authOptions.providers.find(
        (p: any) => p.id === 'credentials'
      )

      const result = await credentialsProvider.authorize({
        email: 'admin@test.com',
        password: 'wrongpassword',
      })

      expect(result).toBeNull()
    })

    it('should reject authentication for non-admin email', async () => {
      const credentialsProvider: any = authOptions.providers.find(
        (p: any) => p.id === 'credentials'
      )

      const result = await credentialsProvider.authorize({
        email: 'user@test.com',
        password: 'somepassword',
      })

      expect(result).toBeNull()
    })
  })
})
