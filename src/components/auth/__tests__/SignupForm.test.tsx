import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SignupForm } from '../SignupForm';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const mockSignUp = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { signUp: mockSignUp } } as unknown as SupabaseClient),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const signUpSuccess = () =>
  mockSignUp.mockResolvedValue({ data: { user: { id: 'uuid' } }, error: null });

const signUpError = (message: string, status = 422) =>
  mockSignUp.mockResolvedValue({
    data: { user: null },
    error: { message, status, name: 'AuthApiError' },
  });

const fillAndSubmit = async (
  email = 'novo@b.com',
  password = '12345678',
  confirm = '12345678',
) => {
  await userEvent.type(screen.getByLabelText(/fields\.email/i), email);
  await userEvent.type(screen.getByLabelText(/fields\.password_signup/i), password);
  await userEvent.type(screen.getByLabelText(/fields\.confirm_password/i), confirm);
  await userEvent.click(screen.getByRole('button', { name: /signup\.cta/i }));
};

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => vi.clearAllMocks());

describe('SignupForm', () => {
  it('T-FUNC-06: redirects to /login?registered=true on success', async () => {
    signUpSuccess();
    render(<SignupForm />);
    await fillAndSubmit();
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/login?registered=true'),
    );
  });

  it('T-FUNC-07: shows error key for duplicate email', async () => {
    signUpError('User already registered');
    render(<SignupForm />);
    await fillAndSubmit();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'errors.email_already_registered',
      );
    });
  });

  it('T-FUNC-08: mismatched passwords show Zod error, no API call', async () => {
    render(<SignupForm />);
    await fillAndSubmit('novo@b.com', '12345678', 'diferente');
    expect(screen.getByText('validation.passwords_mismatch')).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('shows Zod error for short password', async () => {
    render(<SignupForm />);
    await fillAndSubmit('a@b.com', '1234567', '1234567');
    expect(screen.getByText('validation.password_too_short')).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('T-SEC-01: never shows raw Supabase error message', async () => {
    const rawMessage = 'User already registered';
    signUpError(rawMessage);
    render(<SignupForm />);
    await fillAndSubmit();
    await waitFor(() => screen.getByRole('alert'));
    expect(screen.queryByText(rawMessage)).not.toBeInTheDocument();
  });

  it('button disabled and aria-busy during loading', async () => {
    mockSignUp.mockReturnValue(new Promise(() => {}));
    render(<SignupForm />);
    await fillAndSubmit();
    const btn = screen.getByRole('button', { name: /signup\.cta/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });

  it('error banner clears when user edits email', async () => {
    signUpError('User already registered');
    render(<SignupForm />);
    await fillAndSubmit();
    await screen.findByRole('alert');

    await userEvent.clear(screen.getByLabelText(/fields\.email/i));
    await userEvent.type(screen.getByLabelText(/fields\.email/i), 'outro@b.com');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
