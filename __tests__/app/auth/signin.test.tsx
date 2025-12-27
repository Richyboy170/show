import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { signIn } from 'next-auth/react'
import SignIn from '@/app/auth/signin/page'

jest.mock('next-auth/react')

const mockSignIn = signIn as jest.MockedFunction<typeof signIn>

describe('SignIn Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render sign-in page with all elements', () => {
    render(<SignIn />)

    // Check for main heading and description
    expect(screen.getByText('Welcome! 🎉')).toBeInTheDocument()
    expect(screen.getByText('Sign in to manage your Thai lyrics collection')).toBeInTheDocument()

    // Check for Google sign-in button
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()

    // Check for divider
    expect(screen.getByText('Or sign in with password')).toBeInTheDocument()

    // Check for email and password inputs
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Admin Password')).toBeInTheDocument()

    // Check for submit button
    expect(screen.getByText('Sign In 🎵')).toBeInTheDocument()

    // Check for back to home link
    expect(screen.getByText('← Back to Home 🏠')).toBeInTheDocument()
  })

  it('should call signIn with google provider when Google button is clicked', async () => {
    mockSignIn.mockResolvedValue(undefined as any)

    render(<SignIn />)

    const googleButton = screen.getByText('Continue with Google')
    fireEvent.click(googleButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/' })
    })
  })

  it('should handle credentials sign-in form submission', async () => {
    mockSignIn.mockResolvedValue({
      error: null,
      status: 200,
      ok: true,
      url: '/',
    } as any)

    render(<SignIn />)

    // Fill in the form
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Admin Password')
    const submitButton = screen.getByText('Sign In 🎵')

    fireEvent.change(emailInput, { target: { value: 'admin@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'testpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'admin@test.com',
        password: 'testpassword',
        redirect: false,
      })
    })
  })

  it('should show error message on failed sign-in', async () => {
    mockSignIn.mockResolvedValue({
      error: 'CredentialsSignin',
      status: 401,
      ok: false,
      url: null,
    } as any)

    render(<SignIn />)

    // Fill in the form
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Admin Password')
    const submitButton = screen.getByText('Sign In 🎵')

    fireEvent.change(emailInput, { target: { value: 'wrong@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password. Only admin can access.')).toBeInTheDocument()
    })
  })

  it('should disable buttons while loading', async () => {
    mockSignIn.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(undefined as any), 1000))
    )

    render(<SignIn />)

    const googleButton = screen.getByText('Continue with Google')
    fireEvent.click(googleButton)

    // Check if button is disabled
    expect(googleButton.closest('button')).toBeDisabled()

    const submitButton = screen.getByText('Signing in...')
    expect(submitButton.closest('button')).toBeDisabled()
  })

  it('should have proper form validation', () => {
    render(<SignIn />)

    const emailInput = screen.getByLabelText('Email') as HTMLInputElement
    const passwordInput = screen.getByLabelText('Admin Password') as HTMLInputElement

    expect(emailInput.type).toBe('email')
    expect(emailInput.required).toBe(true)
    expect(passwordInput.type).toBe('password')
    expect(passwordInput.required).toBe(true)
  })

  it('should have link to home page', () => {
    render(<SignIn />)

    const homeLink = screen.getByText('← Back to Home 🏠')
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('should show decorative lanterns', () => {
    const { container } = render(<SignIn />)

    // Check for decorative elements (lanterns)
    const decorativeElements = container.querySelectorAll('.rounded-full.bg-\\[')
    expect(decorativeElements.length).toBeGreaterThan(0)
  })
})
