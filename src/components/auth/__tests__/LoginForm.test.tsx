import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SupabaseClient } from '@supabase/supabase-js';
import { LoginForm } from '../LoginForm';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockGet = vi.fn().mockReturnValue(null);

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => ({ get: mockGet }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const mockSignIn = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { signInWithPassword: mockSignIn } } as unknown as SupabaseClient),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const signInSuccess = () =>
  mockSignIn.mockResolvedValue({ data: { session: {} }, error: null });

const signInError = (message: string, status = 400) =>
  mockSignIn.mockResolvedValue({
    data: { session: null },
    error: { message, status, name: 'AuthApiError' },
  });

const fillAndSubmit = async (email = 'a@b.com', password = '123456') => {
  await userEvent.type(screen.getByLabelText(/fields\.email/i), email);
  await userEvent.type(screen.getByLabelText(/fields\.password/i), password);
  await userEvent.click(screen.getByRole('button', { name: /login\.cta/i }));
};

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockGet.mockReturnValue(null);
});

describe('LoginForm', () => {
  it('T-FUNC-01: redirects to /upload on successful login', async () => {
    signInSuccess();
    render(<LoginForm />);
    await fillAndSubmit();
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/upload'));
  });

  it('T-FUNC-01b: uses callbackUrl when present', async () => {
    signInSuccess();
    mockGet.mockReturnValue('/batches/abc');
    render(<LoginForm />);
    await fillAndSubmit();
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/batches/abc'));
  });

  it('T-FUNC-01c: ignores external callbackUrl (open redirect protection)', async () => {
    signInSuccess();
    mockGet.mockReturnValue('https://evil.com');
    render(<LoginForm />);
    await fillAndSubmit();
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/upload'));
  });

  it('T-FUNC-02: shows error key for invalid credentials', async () => {
    signInError('Invalid login credentials');
    render(<LoginForm />);
    await fillAndSubmit();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('errors.invalid_credentials');
    });
  });

  it('T-SEC-01: never shows raw Supabase error message', async () => {
    const rawMessage = 'Invalid login credentials';
    signInError(rawMessage);
    render(<LoginForm />);
    await fillAndSubmit();
    await waitFor(() => screen.getByRole('alert'));
    expect(screen.queryByText(rawMessage)).not.toBeInTheDocument();
  });

  it('T-FUNC-03: error banner clears when user edits email', async () => {
    signInError('Invalid login credentials');
    render(<LoginForm />);
    await fillAndSubmit();
    await screen.findByRole('alert');

    await userEvent.clear(screen.getByLabelText(/fields\.email/i));
    await userEvent.type(screen.getByLabelText(/fields\.email/i), 'new@b.com');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('T-FUNC-04: Zod inline error for invalid email — no banner', async () => {
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText(/fields\.email/i), 'bad-email');
    await userEvent.click(screen.getByRole('button', { name: /login\.cta/i }));
    expect(screen.getByText('validation.email_invalid')).toBeInTheDocument();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('T-FUNC-05: button is disabled and aria-busy during loading', async () => {
    mockSignIn.mockReturnValue(new Promise(() => {})); // never resolves
    render(<LoginForm />);
    await fillAndSubmit();
    const btn = screen.getByRole('button', { name: /login\.cta/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });

  it('T-SEC-02: password field type is password by default', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/fields\.password/i)).toHaveAttribute('type', 'password');
  });

  it('T-SEC-03: toggle changes type to text', async () => {
    render(<LoginForm />);
    await userEvent.click(screen.getByRole('button', { name: /mostrar senha/i }));
    expect(screen.getByLabelText(/fields\.password/i)).toHaveAttribute('type', 'text');
  });

  it('shows registered toast when showRegisteredToast=true', () => {
    render(<LoginForm showRegisteredToast />);
    expect(screen.getByText('toast.account_created')).toBeInTheDocument();
  });
});
