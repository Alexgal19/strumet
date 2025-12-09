
'use client';

import { format as formatFns, parseISO, isValid } from 'date-fns';
import { pl } from 'date-fns/locale';

/**
 * Formats a date into a string.
 * @param input - The date to format (Date object, ISO string, or timestamp).
 * @param pattern - The date-fns format pattern. Defaults to 'yyyy-MM-dd'.
 * @returns The formatted date string, or an empty string if the input is invalid.
 */
export function formatDate(
  input: Date | string | number | null | undefined,
  pattern: string = 'yyyy-MM-dd'
): string {
  if (!input) return '';

  const date = parseMaybeDate(input);
  if (!date || !isValid(date)) return '';
  
  try {
    return formatFns(date, pattern, { locale: pl });
  } catch (e) {
    return '';
  }
}

/**
 * Formats a date and time into a string.
 * @param input - The date to format (Date object, ISO string, or timestamp).
 * @param pattern - The date-fns format pattern. Defaults to 'yyyy-MM-dd HH:mm'.
 * @returns The formatted date string, or an empty string if the input is invalid.
 */
export function formatDateTime(
  input: Date | string | number | null | undefined,
  pattern: string = 'yyyy-MM-dd HH:mm'
): string {
    const date = parseMaybeDate(input);
    if (!date || !isValid(date)) return '';

    try {
        return formatFns(date, pattern, { locale: pl });
    } catch (e) {
        return '';
    }
}

/**
 * Parses a value into a Date object or null if invalid.
 * This function now reliably handles 'yyyy-MM-dd' strings.
 * @param input - The value to parse.
 * @returns A Date object or null.
 */
export function parseMaybeDate(
  input: Date | string | number | null | undefined
): Date | null {
  if (!input) return null;
  if (input instanceof Date) {
    return isValid(input) ? input : null;
  }
  if (typeof input === 'number') {
      const date = new Date(input);
      return isValid(date) ? date : null;
  }
  if (typeof input === 'string') {
      // Handle 'YYYY-MM-DD' format by forcing local time zone interpretation
      if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
          const date = new Date(input + 'T00:00:00');
          return isValid(date) ? date : null;
      }
      // Handle 'DD.MM.YYYY' format
      const parts = input.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
      if (parts) {
          const [, day, month, year] = parts;
          // month is 0-indexed in JS Date
          const date = new Date(Number(year), Number(month) - 1, Number(day));
          return isValid(date) ? date : null;
      }
      // Fallback for other string formats (like full ISO strings)
      const date = parseISO(input);
      return isValid(date) ? date : null;
  }
  
  return null;
}


/**
 * Checks if a value is a valid Date object.
 * @param input - The value to check.
 * @returns True if the input is a valid Date.
 */
export function isValidDate(input: unknown): input is Date {
    return input instanceof Date && isValid(input);
}
