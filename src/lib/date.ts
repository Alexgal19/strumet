

import { format as formatFns, parseISO, isValid, parse } from 'date-fns';
import { pl } from 'date-fns/locale';

/**
 * Converts an Excel serial number to a JavaScript Date object.
 * @param serial The Excel serial number.
 * @returns A Date object.
 */
function excelSerialToDate(serial: number): Date {
  // Excel's epoch starts on 1900-01-01. JS's epoch is 1970-01-01.
  // Excel has a bug where it thinks 1900 was a leap year.
  const excelEpoch = new Date(1899, 11, 30);
  const excelEpochAsNumber = excelEpoch.getTime();
  const millisecondsInDay = 86400000;
  
  // Adjust for the leap year bug if the date is after Feb 28, 1900
  const days = serial - (serial > 60 ? 1 : 0);

  const date = new Date(excelEpochAsNumber + days * millisecondsInDay);
  
  // We need to account for the timezone offset, because creating a date from timestamp will be in UTC
  // but we want the date to be interpreted in the local timezone.
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() + tzOffset);
}


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
 * This function now reliably handles 'yyyy-MM-dd' strings, 'dd.MM.yyyy' strings,
 * and Excel's numeric date format.
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
    // This is likely an Excel date serial number.
    try {
        const date = excelSerialToDate(input);
        return isValid(date) ? date : null;
    } catch(e) {
        return null;
    }
  }

  if (typeof input === 'string') {
      let date: Date | null = null;
      
      // Try parsing as ISO 8601 string first (e.g., "2023-12-31T00:00:00.000Z")
      date = parseISO(input);
      if (isValid(date)) return date;

      // Try parsing 'yyyy-MM-dd'
      if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
          date = parse(input, 'yyyy-MM-dd', new Date());
          if(isValid(date)) return date;
      }
      
      // Try parsing 'dd.MM.yyyy'
      if (/^\d{2}\.\d{2}\.\d{4}$/.test(input)) {
          date = parse(input, 'dd.MM.yyyy', new Date());
          if(isValid(date)) return date;
      }

      // Add other common formats if needed
      
      return null;
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
