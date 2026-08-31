import { describe, it, expect } from 'vitest';
import { normalizeForSearch, excelLikeMatch, commandExcelFilter } from '@/lib/search';

describe('normalizeForSearch', () => {
  it('lowercases text', () => {
    expect(normalizeForSearch('Kowalski')).toBe('kowalski');
  });

  it('strips Polish diacritics', () => {
    expect(normalizeForSearch('Grażyna Ćwiękała')).toBe('grazyna cwiekala');
    expect(normalizeForSearch('Łódź')).toBe('lodz');
    expect(normalizeForSearch('Żółć ĘŚŃÓĄ')).toBe('zolc esnoa');
  });

  it('handles null, undefined and non-strings', () => {
    expect(normalizeForSearch(null)).toBe('');
    expect(normalizeForSearch(undefined)).toBe('');
    expect(normalizeForSearch(123)).toBe('123');
  });
});

describe('excelLikeMatch', () => {
  const fields = ['Jan Kowalski', 'Produkcja', 'Spawacz'];

  it('matches single word anywhere in any field', () => {
    expect(excelLikeMatch('kowal', fields)).toBe(true);
    expect(excelLikeMatch('produkcja', fields)).toBe(true);
  });

  it('requires every word to match (AND between words)', () => {
    expect(excelLikeMatch('jan kowal', fields)).toBe(true);
    expect(excelLikeMatch('kowal spawacz', fields)).toBe(true);
    expect(excelLikeMatch('jan nowak', fields)).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(excelLikeMatch('JAN KOWALSKI', fields)).toBe(true);
  });

  it('ignores Polish diacritics in query and data', () => {
    expect(excelLikeMatch('grażyna', ['Grażyna Ćwiękała'])).toBe(true);
    expect(excelLikeMatch('grazyna cwiekala', ['Grażyna Ćwiękała'])).toBe(true);
    expect(excelLikeMatch('lodz', ['Łódź'])).toBe(true);
    expect(excelLikeMatch('wroclaw', ['Wrocław'])).toBe(true);
  });

  it('matches when words are spread across different fields', () => {
    expect(excelLikeMatch('kowalski produkcja', fields)).toBe(true);
  });

  it('returns true for empty query', () => {
    expect(excelLikeMatch('', fields)).toBe(true);
    expect(excelLikeMatch('   ', fields)).toBe(true);
  });

  it('handles empty/missing field values', () => {
    expect(excelLikeMatch('kowal', [null, undefined, 'Jan Kowalski'])).toBe(true);
    expect(excelLikeMatch('kowal', [null, undefined])).toBe(false);
  });
});

describe('commandExcelFilter', () => {
  it('returns 1 for match, 0 for no match', () => {
    expect(commandExcelFilter('Jan Kowalski', 'kowal')).toBe(1);
    expect(commandExcelFilter('Jan Kowalski', 'nowak')).toBe(0);
  });

  it('ignores diacritics', () => {
    expect(commandExcelFilter('Grażyna Ćwiękała', 'grazyna')).toBe(1);
  });

  it('shows everything for empty search', () => {
    expect(commandExcelFilter('Jan Kowalski', '')).toBe(1);
  });
});
