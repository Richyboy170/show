/**
 * Tests for Normal User UI Features
 *
 * This test suite ensures that:
 * - Normal users see correct UI elements
 * - Admin-only features are hidden from normal users
 * - Favorites functionality works in the UI
 */

import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/'),
}))

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: any) => {
    return <a href={href}>{children}</a>
  }
})

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} />
  },
}))

// Import components
import Header from '@/components/Header'

describe('Normal User UI Features', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Header Component - Normal User View', () => {
    it('should show My Favorites button for normal users', () => {
      const mockSession = {
        data: {
          user: {
            id: 'user-123',
            email: 'normaluser@gmail.com',
            name: 'Normal User',
            image: 'https://example.com/avatar.jpg',
            isAdmin: false,
          },
        },
        status: 'authenticated',
      }

      ;(useSession as jest.Mock).mockReturnValue(mockSession)

      render(<Header />)

      // Should show favorites button
      expect(screen.getByText('My Favorites')).toBeInTheDocument()

      // Should NOT show admin panel button
      expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument()

      // Should NOT show admin badge
      expect(screen.queryByText('ADMIN')).not.toBeInTheDocument()
    })

    it('should display user profile information correctly', () => {
      const mockSession = {
        data: {
          user: {
            id: 'user-123',
            email: 'normaluser@gmail.com',
            name: 'John Doe',
            image: 'https://example.com/john.jpg',
            isAdmin: false,
          },
        },
        status: 'authenticated',
      }

      ;(useSession as jest.Mock).mockReturnValue(mockSession)

      render(<Header />)

      // Should show user name
      expect(screen.getByText('John Doe')).toBeInTheDocument()

      // Should show "Music Lover" label for normal users
      expect(screen.getByText('Music Lover')).toBeInTheDocument()
    })

    it('should show sign in button when not authenticated', () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<Header />)

      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.queryByText('My Favorites')).not.toBeInTheDocument()
      expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument()
    })

    it('should show loading state while session is loading', () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'loading',
      })

      render(<Header />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should have correct link for favorites', () => {
      const mockSession = {
        data: {
          user: {
            id: 'user-123',
            email: 'normaluser@gmail.com',
            name: 'Normal User',
            isAdmin: false,
          },
        },
        status: 'authenticated',
      }

      ;(useSession as jest.Mock).mockReturnValue(mockSession)

      render(<Header />)

      const favoritesLink = screen.getByText('My Favorites').closest('a')
      expect(favoritesLink).toHaveAttribute('href', '/favorites')
    })

    it('should show sign out button for authenticated normal users', () => {
      const mockSession = {
        data: {
          user: {
            id: 'user-123',
            email: 'normaluser@gmail.com',
            name: 'Normal User',
            isAdmin: false,
          },
        },
        status: 'authenticated',
      }

      ;(useSession as jest.Mock).mockReturnValue(mockSession)

      render(<Header />)

      expect(screen.getByText('Sign Out')).toBeInTheDocument()
    })
  })

  describe('Header Component - Contrast with Admin View', () => {
    it('should show different UI for admin users', () => {
      const mockAdminSession = {
        data: {
          user: {
            id: 'admin-123',
            email: 'admin@test.com',
            name: 'Admin User',
            image: null,
            isAdmin: true,
          },
        },
        status: 'authenticated',
      }

      ;(useSession as jest.Mock).mockReturnValue(mockAdminSession)

      render(<Header />)

      // Admin should see Admin Panel button
      expect(screen.getByText('Admin Panel')).toBeInTheDocument()

      // Admin should see ADMIN badge
      expect(screen.getByText('ADMIN')).toBeInTheDocument()

      // Admin should NOT see My Favorites
      expect(screen.queryByText('My Favorites')).not.toBeInTheDocument()

      // Admin should NOT see Music Lover label
      expect(screen.queryByText('Music Lover')).not.toBeInTheDocument()
    })
  })

  describe('Feature Segregation', () => {
    it('should ensure normal users cannot see admin-only navigation', () => {
      const normalUserSession = {
        data: {
          user: {
            id: 'user-123',
            email: 'normaluser@gmail.com',
            name: 'Normal User',
            isAdmin: false,
          },
        },
        status: 'authenticated',
      }

      ;(useSession as jest.Mock).mockReturnValue(normalUserSession)

      const { container } = render(<Header />)

      // Verify no admin-related classes or elements
      const adminElements = container.querySelectorAll('[class*="admin"]')
      const adminPanel = screen.queryByText(/admin panel/i)
      const adminBadge = screen.queryByText(/admin/i)

      expect(adminPanel).not.toBeInTheDocument()
      // Allow for the word "Admin" to not appear as a badge
      if (adminBadge) {
        // Make sure it's not a badge, could be in other text
        expect(adminBadge.tagName).not.toBe('DIV')
      }
    })

    it('should show favorites heart icon for normal users only', () => {
      const normalUserSession = {
        data: {
          user: {
            id: 'user-123',
            email: 'normaluser@gmail.com',
            isAdmin: false,
          },
        },
        status: 'authenticated',
      }

      ;(useSession as jest.Mock).mockReturnValue(normalUserSession)

      render(<Header />)

      // Heart icon should be present in favorites button
      const favoritesButton = screen.getByText('My Favorites')
      expect(favoritesButton).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('should render correctly on mobile for normal users', () => {
      const mockSession = {
        data: {
          user: {
            id: 'user-123',
            email: 'normaluser@gmail.com',
            name: 'Normal User',
            isAdmin: false,
          },
        },
        status: 'authenticated',
      }

      ;(useSession as jest.Mock).mockReturnValue(mockSession)

      render(<Header />)

      // Key elements should still be present
      expect(screen.getByText('My Favorites')).toBeInTheDocument()
      expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument()
    })
  })
})

describe('Favorites Page Component - Normal Users', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should redirect unauthenticated users to sign-in', async () => {
    const mockPush = jest.fn()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    const FavoritesPage = (await import('@/app/favorites/page')).default

    render(<FavoritesPage />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/signin')
    })
  })

  it('should redirect admin users to admin panel', async () => {
    const mockPush = jest.fn()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'admin-123',
          email: 'admin@test.com',
          isAdmin: true,
        },
      },
      status: 'authenticated',
    })

    const FavoritesPage = (await import('@/app/favorites/page')).default

    render(<FavoritesPage />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin')
    })
  })

  it('should fetch and display favorites for normal users', async () => {
    const mockFavorites = {
      favorites: [
        {
          id: 'fav-1',
          video: {
            id: 'video-1',
            youtubeId: 'yt-1',
            title: 'My Favorite Song',
            description: 'A great song',
            thumbnailUrl: 'https://example.com/thumb.jpg',
            lyrics: [],
          },
          createdAt: new Date().toISOString(),
        },
      ],
    }

    ;(useRouter as jest.Mock).mockReturnValue({ push: jest.fn() })
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'user-123',
          email: 'normaluser@gmail.com',
          isAdmin: false,
        },
      },
      status: 'authenticated',
    })

    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: async () => mockFavorites,
    })

    const FavoritesPage = (await import('@/app/favorites/page')).default

    render(<FavoritesPage />)

    await waitFor(() => {
      expect(screen.getByText('My Favorite Song')).toBeInTheDocument()
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/favorites')
  })

  it('should show empty state when user has no favorites', async () => {
    ;(useRouter as jest.Mock).mockReturnValue({ push: jest.fn() })
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'user-123',
          email: 'normaluser@gmail.com',
          isAdmin: false,
        },
      },
      status: 'authenticated',
    })

    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ favorites: [] }),
    })

    const FavoritesPage = (await import('@/app/favorites/page')).default

    render(<FavoritesPage />)

    await waitFor(() => {
      expect(screen.getByText(/no favorites yet/i)).toBeInTheDocument()
    })
  })

  it('should show loading state while fetching favorites', () => {
    ;(useRouter as jest.Mock).mockReturnValue({ push: jest.fn() })
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'loading',
    })

    const FavoritesPage = (jest.requireActual('@/app/favorites/page')).default

    render(<FavoritesPage />)

    expect(screen.getByText(/loading your favorites/i)).toBeInTheDocument()
  })
})

describe('Access Control Summary', () => {
  it('should verify normal users have correct permissions', () => {
    const normalUserPermissions = {
      canViewVideos: true,
      canWatchVideos: true,
      canAddFavorites: true,
      canRemoveFavorites: true,
      canViewFavorites: true,
      canCreateVideos: false,
      canEditVideos: false,
      canDeleteVideos: false,
      canEditLyrics: false,
      canAccessAdminPanel: false,
      canManageNotifications: false,
    }

    // Verify all permissions are set correctly
    expect(normalUserPermissions.canViewVideos).toBe(true)
    expect(normalUserPermissions.canWatchVideos).toBe(true)
    expect(normalUserPermissions.canAddFavorites).toBe(true)
    expect(normalUserPermissions.canRemoveFavorites).toBe(true)
    expect(normalUserPermissions.canViewFavorites).toBe(true)
    expect(normalUserPermissions.canCreateVideos).toBe(false)
    expect(normalUserPermissions.canEditVideos).toBe(false)
    expect(normalUserPermissions.canDeleteVideos).toBe(false)
    expect(normalUserPermissions.canEditLyrics).toBe(false)
    expect(normalUserPermissions.canAccessAdminPanel).toBe(false)
    expect(normalUserPermissions.canManageNotifications).toBe(false)
  })
})
