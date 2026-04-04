import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ptBr = JSON.parse(
  fs.readFileSync(path.resolve('messages/pt-BR.json'), 'utf-8'),
) as Record<string, unknown>;

const en = JSON.parse(
  fs.readFileSync(path.resolve('messages/en.json'), 'utf-8'),
) as Record<string, unknown>;

function getKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      keys.push(...getKeys(v as Record<string, unknown>, key));
    } else {
      keys.push(key);
    }
  }
  return keys;
}

// T-I18N-07
describe('translation file integrity', () => {
  it('T-I18N-07: en.json has all keys from pt-BR.json', () => {
    const ptKeys = getKeys(ptBr);
    const enKeys = getKeys(en);
    const missing = ptKeys.filter((k) => !enKeys.includes(k));
    expect(missing).toEqual([]);
  });

  it('T-I18N-07: pt-BR.json has all keys from en.json (no extra)', () => {
    const ptKeys = getKeys(ptBr);
    const enKeys = getKeys(en);
    const extra = enKeys.filter((k) => !ptKeys.includes(k));
    expect(extra).toEqual([]);
  });

  // T-I18N-08
  it('T-I18N-08: has layout namespace in pt-BR', () => {
    const layout = ptBr.layout as Record<string, unknown>;
    expect(layout).toBeDefined();
    expect((layout.brand as Record<string, unknown>).title).toBeDefined();
    expect((layout.nav as Record<string, unknown>).upload).toBeDefined();
  });

  it('T-I18N-08: has layout namespace in en', () => {
    const layout = en.layout as Record<string, unknown>;
    expect(layout).toBeDefined();
    expect((layout.brand as Record<string, unknown>).title).toBeDefined();
    expect((layout.nav as Record<string, unknown>).upload).toBeDefined();
  });

  // T-I18N-09
  function findEmptyValues(obj: Record<string, unknown>, prefix = ''): string[] {
    const empties: string[] = [];
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        empties.push(...findEmptyValues(v as Record<string, unknown>, key));
      } else if (v === '') {
        empties.push(key);
      }
    }
    return empties;
  }

  it('T-I18N-09: no empty string values in pt-BR', () => {
    const empties = findEmptyValues(ptBr);
    expect(empties).toEqual([]);
  });

  it('T-I18N-09: no empty string values in en', () => {
    const empties = findEmptyValues(en);
    expect(empties).toEqual([]);
  });
});
