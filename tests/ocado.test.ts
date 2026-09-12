import { describe, expect, it } from 'vitest';
import { ocadoHref } from '@/lib/ocado';

describe('ocadoHref', () => {
  it('uses a stored product URL when one is set', () => {
    expect(ocadoHref('onions', 'https://www.ocado.com/products/foo-123')).toBe(
      'https://www.ocado.com/products/foo-123',
    );
  });

  it('treats blank and null as a name search', () => {
    expect(ocadoHref('onions', null)).toBe('https://www.ocado.com/search?q=onions');
    expect(ocadoHref('onions', '  ')).toBe('https://www.ocado.com/search?q=onions');
  });

  it('encodes the list display name, including the frozen suffix', () => {
    expect(ocadoHref('spinach (frozen)', null)).toBe(
      'https://www.ocado.com/search?q=spinach%20(frozen)',
    );
  });
});
