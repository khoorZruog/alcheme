import { describe, it, expect } from 'vitest';

// Test the pure catalogDocId function logic (hash determinism + case insensitivity)
// We replicate the algorithm here since importing the actual module requires firebase-admin

function catalogDocId(brand: string, productName: string, colorCode?: string): string {
  const { createHash } = require('crypto');
  const normalized = `${(brand || '').trim().toLowerCase()}::${(productName || '').trim().toLowerCase()}::${(colorCode || '').trim().toLowerCase()}`;
  return createHash('sha256').update(normalized).digest('hex').slice(0, 20);
}

describe('catalogDocId', () => {
  it('generates a 20-character hex string', () => {
    const id = catalogDocId('KATE', 'リップモンスター', '03');
    expect(id).toHaveLength(20);
    expect(id).toMatch(/^[0-9a-f]{20}$/);
  });

  it('is deterministic — same inputs produce same ID', () => {
    const a = catalogDocId('KATE', 'リップモンスター', '03');
    const b = catalogDocId('KATE', 'リップモンスター', '03');
    expect(a).toBe(b);
  });

  it('is case-insensitive for brand', () => {
    const upper = catalogDocId('KATE', 'リップモンスター', '03');
    const lower = catalogDocId('kate', 'リップモンスター', '03');
    const mixed = catalogDocId('Kate', 'リップモンスター', '03');
    expect(upper).toBe(lower);
    expect(upper).toBe(mixed);
  });

  it('is case-insensitive for product name', () => {
    const a = catalogDocId('DIOR', 'Addict Lip Maximizer');
    const b = catalogDocId('DIOR', 'addict lip maximizer');
    expect(a).toBe(b);
  });

  it('is case-insensitive for color code', () => {
    const a = catalogDocId('KATE', 'リップモンスター', 'M03');
    const b = catalogDocId('KATE', 'リップモンスター', 'm03');
    expect(a).toBe(b);
  });

  it('trims whitespace from all inputs', () => {
    const a = catalogDocId('KATE', 'リップモンスター', '03');
    const b = catalogDocId('  KATE  ', '  リップモンスター  ', '  03  ');
    expect(a).toBe(b);
  });

  it('handles missing color code (undefined)', () => {
    const a = catalogDocId('KATE', 'リップモンスター');
    const b = catalogDocId('KATE', 'リップモンスター', undefined);
    expect(a).toBe(b);
  });

  it('handles empty color code', () => {
    const a = catalogDocId('KATE', 'リップモンスター');
    const b = catalogDocId('KATE', 'リップモンスター', '');
    expect(a).toBe(b);
  });

  it('produces different IDs for different color codes', () => {
    const id03 = catalogDocId('KATE', 'リップモンスター', '03');
    const id05 = catalogDocId('KATE', 'リップモンスター', '05');
    expect(id03).not.toBe(id05);
  });

  it('produces different IDs for different brands', () => {
    const kate = catalogDocId('KATE', 'リップモンスター');
    const dior = catalogDocId('DIOR', 'リップモンスター');
    expect(kate).not.toBe(dior);
  });

  it('produces different IDs for different product names', () => {
    const lip = catalogDocId('KATE', 'リップモンスター');
    const eye = catalogDocId('KATE', 'アイシャドウ');
    expect(lip).not.toBe(eye);
  });

  it('handles empty brand gracefully', () => {
    const id = catalogDocId('', 'リップモンスター');
    expect(id).toHaveLength(20);
  });
});
