import { render, screen } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'

jest.mock('next-auth/react')

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should show Sign In link when user is not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    render(<Header />)

    const signInLink = screen.getByText('Sign In')
    expect(signInLink).toBeInTheDocument()
    expect(signInLink).toHaveAttribute('href', '/auth/signin')
  })

  it('should show loading state while session is loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    })

    render(<Header />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should show admin user profile with Admin Panel link', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'admin-123',
          email: 'admin@test.com',
          name: 'Admin User',
          image: 'https://example.com/admin.jpg',
          isAdmin: true,
        },
        expires: '2025-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    render(<Header />)

    expect(screen.getByText('Admin User')).toBeInTheDocument()
    expect(screen.getByText('Admin Panel')).toBeInTheDocument()
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
    expect(screen.queryByText('My Favorites')).not.toBeInTheDocument()
  })

  it('should show regular user profile with Favorites link', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-123',
          email: 'user@test.com',
          name: 'Regular User',
          image: 'https://example.com/user.jpg',
          isAdmin: false,
        },
        expires: '2025-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    render(<Header />)

    expect(screen.getByText('Regular User')).toBeInTheDocument()
    expect(screen.getByText('My Favorites')).toBeInTheDocument()
    expect(screen.getByText('Music Lover')).toBeInTheDocument()
    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument()
    expect(screen.queryByText('ADMIN')).not.toBeInTheDocument()
  })

  it('should show Sign Out button for authenticated users', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-123',
          email: 'user@test.com',
          name: 'Test User',
          image: null,
          isAdmin: false,
        },
        expires: '2025-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    render(<Header />)

    expect(screen.getByText('Sign Out')).toBeInTheDocument()
  })

  it('should show logo and title', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    render(<Header />)

    expect(screen.getByText("Josie Tso's")).toBeInTheDocument()
    expect(screen.getByText('Thai Music Celebration 🎉')).toBeInTheDocument()
  })
})
