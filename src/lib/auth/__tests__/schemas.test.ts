import { describe, it, expect } from 'vitest';
import { loginSchema, signupSchema } from '../schemas';

describe('loginSchema', () => {
  it('accepts valid email and password', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: '123456' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: '123456' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('validation.email_invalid');
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('validation.password_required');
  });
});

describe('signupSchema', () => {
  it('accepts valid signup data', () => {
    const result = signupSchema.safeParse({
      email: 'a@b.com',
      password: '12345678',
      confirmPassword: '12345678',
    });
    expect(result.success).toBe(true);
  });

  it('rejects password shorter than 8 chars', () => {
    const result = signupSchema.safeParse({
      email: 'a@b.com',
      password: '1234567',
      confirmPassword: '1234567',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('validation.password_too_short');
  });

  it('rejects mismatched passwords', () => {
    const result = signupSchema.safeParse({
      email: 'a@b.com',
      password: '12345678',
      confirmPassword: 'different',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('validation.passwords_mismatch');
    expect(result.error?.issues[0].path).toContain('confirmPassword');
  });

  it('rejects invalid email', () => {
    const result = signupSchema.safeParse({
      email: 'bad',
      password: '12345678',
      confirmPassword: '12345678',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('validation.email_invalid');
  });
});
