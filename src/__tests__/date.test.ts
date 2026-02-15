import { parseMaybeDate, formatDate, formatDateTime, isValidDate } from '@/lib/date';

describe('Date Utilities', () => {

  describe('parseMaybeDate', () => {
    it('should parse valid ISO 8601 strings', () => {
      const date = parseMaybeDate('2024-01-15T12:00:00.000Z');
      expect(date).toEqual(new Date('2024-01-15T12:00:00.000Z'));
    });

    it('should parse valid "yyyy-MM-dd" strings as UTC', () => {
      const date = parseMaybeDate('2024-02-20');
      // new Date('YYYY-MM-DD') is parsed as UTC midnight, so we create the expected date in UTC as well
      const expectedDate = new Date(Date.UTC(2024, 1, 20));
      expect(date).toEqual(expectedDate);
    });

    it('should parse valid "dd.MM.yyyy" strings', () => {
      const date = parseMaybeDate('25.03.2024');
      const expectedDate = new Date(2024, 2, 25);
      expect(date?.getFullYear()).toBe(expectedDate.getFullYear());
      expect(date?.getMonth()).toBe(expectedDate.getMonth());
      expect(date?.getDate()).toBe(expectedDate.getDate());
    });
    
    it('should parse Excel serial numbers correctly', () => {
      // 45321 in Excel is February 1, 2024
      const date = parseMaybeDate(45321);
      expect(date).toEqual(new Date(Date.UTC(2024, 1, 1)));
    });

    it('should handle the Excel 1900 leap year bug', () => {
      // Excel serials 1-59 are shifted by one day. We need to check for UTC dates.
      expect(parseMaybeDate(1)).toEqual(new Date(Date.UTC(1900, 0, 1))); // Jan 1, 1900
      expect(parseMaybeDate(59)).toEqual(new Date(Date.UTC(1900, 1, 28))); // Feb 28, 1900
      // Excel thinks 60 is Feb 29, 1900. Our function should correct this to March 1.
      expect(parseMaybeDate(60)).toEqual(new Date(Date.UTC(1900, 2, 1)));
    });

    it('should return null for invalid strings', () => {
      expect(parseMaybeDate('not a date')).toBeNull();
      expect(parseMaybeDate('2024/01/15')).toBeNull(); // Not a supported format
      expect(parseMaybeDate('32.13.2024')).toBeNull(); // Invalid date components
    });

    it('should return null for null or undefined input', () => {
      expect(parseMaybeDate(null)).toBeNull();
      expect(parseMaybeDate(undefined)).toBeNull();
    });

    it('should correctly handle a Date object as input', () => {
      const date = new Date();
      expect(parseMaybeDate(date)).toEqual(date);
    });
  });

  describe('formatDate', () => {
    it('should format a valid date string into "dd.MM.yyyy"', () => {
      expect(formatDate('2024-12-25')).toBe('25.12.2024');
    });

    it('should format a Date object into a custom pattern', () => {
      const date = new Date(2024, 11, 25);
      expect(formatDate(date, 'PPP')).toBe('25 grudnia 2024');
    });

    it('should return an empty string for invalid date inputs', () => {
      expect(formatDate('invalid-date')).toBe('');
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
    });
  });

  describe('formatDateTime', () => {
     it('should format a valid date-time string', () => {
      expect(formatDateTime('2024-07-26T14:30:00')).toBe('26.07.2024 14:30');
    });

    it('should return an empty string for invalid inputs', () => {
      expect(formatDateTime(null)).toBe('');
    });
  });

  describe('isValidDate', () => {
    it('should return true for a valid Date object', () => {
      expect(isValidDate(new Date())).toBe(true);
    });

    it('should return false for an invalid Date object', () => {
      expect(isValidDate(new Date('invalid'))).toBe(false);
    });

    it('should return false for non-Date objects', () => {
      expect(isValidDate('2024-01-01')).toBe(false);
      expect(isValidDate(12345)).toBe(false);
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate({})).toBe(false);
    });
  });
});
