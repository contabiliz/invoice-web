import { describe, it, expect } from 'vitest';
import { getSafeCallbackUrl } from '../utils';

describe('getSafeCallbackUrl', () => {
  it('returns /upload for null', () => {
    expect(getSafeCallbackUrl(null)).toBe('/upload');
  });

  it('returns /upload for empty string', () => {
    expect(getSafeCallbackUrl('')).toBe('/upload');
  });

  it('accepts relative path', () => {
    expect(getSafeCallbackUrl('/upload')).toBe('/upload');
  });

  it('accepts nested relative path', () => {
    expect(getSafeCallbackUrl('/batches/abc-123')).toBe('/batches/abc-123');
  });

  it('accepts path with query string', () => {
    expect(getSafeCallbackUrl('/batches?page=2')).toBe('/batches?page=2');
  });

  it('rejects absolute URL with external host', () => {
    expect(getSafeCallbackUrl('https://evil.com/phish')).toBe('/upload');
  });

  it('rejects protocol-relative URL', () => {
    expect(getSafeCallbackUrl('//evil.com/phish')).toBe('/upload');
  });

  it('rejects URL with different port (different origin)', () => {
    expect(getSafeCallbackUrl('http://localhost:8080/upload')).toBe('/upload');
  });
});
