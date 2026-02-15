import { format as formatFns, parseISO, isValid, parse } from 'date-fns';
import { pl } from 'date-fns/locale';

/**
 * Converts an Excel serial number to a JavaScript Date object, correctly handling the 1900 leap year bug.
 * @param serial The Excel serial number.
 * @returns A Date object in UTC.
 */
function excelSerialToDate(serial: number): Date {
  // The number of days between 1900-01-01 and 1970-01-01 is 25567.
  // Excel's date is 1-based, so we subtract 1 from the serial.
  // This gives (serial - 1) - 25567 = serial - 25568 days relative to JS epoch.
  // This calculation inherently corrects the 1900 leap year bug because JS Date
  // correctly knows 1900 was not a leap year.
  const excelEpochDiff = 25568;
  const daysSinceEpoch = serial - excelEpochDiff;
  const jsTimestamp = daysSinceEpoch * 86400 * 1000;
  return new Date(jsTimestamp);
}


/**
 * Parses a value from various formats (ISO, dd.MM.yyyy, yyyy-MM-dd, Excel number) into a Date object.
 * Returns null if the input is invalid or cannot be parsed.
 * @param input The value to parse.
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
    try {
      const date = excelSerialToDate(input);
      return isValid(date) ? date : null;
    } catch (e) {
      return null; // Invalid serial number
    }
  }

  if (typeof input === 'string') {
    const trimmedInput = input.trim();
    let date: Date;
    
    // 1. Try parsing as ISO 8601 string first (most reliable)
    date = parseISO(trimmedInput);
    if (isValid(date)) return date;

    // 2. Try parsing 'dd.MM.yyyy'
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(trimmedInput)) {
        date = parse(trimmedInput, 'dd.MM.yyyy', new Date());
        if (isValid(date)) return date;
    }

    // 3. Try parsing 'yyyy-MM-dd' (common DB format)
    // This is important for UTC dates without timezones from inputs.
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedInput)) {
        const [year, month, day] = trimmedInput.split('-').map(Number);
        date = new Date(Date.UTC(year, month - 1, day));
        if(isValid(date)) return date;
    }
    
    // If it's a number-like string, try treating it as an Excel serial
    if (!isNaN(Number(trimmedInput))) {
        try {
            const dateFromNum = excelSerialToDate(Number(trimmedInput));
            if (isValid(dateFromNum)) return dateFromNum;
        } catch {}
    }
  }
  
  return null; // Return null if no format matches
}

/**
 * Formats a date into a user-friendly string (dd.MM.yyyy by default).
 * @param input - The date to format (accepts various types).
 * @param pattern - The date-fns format pattern.
 * @returns The formatted date string, or an empty string if invalid.
 */
export function formatDate(
  input: Date | string | number | null | undefined,
  pattern: string = 'dd.MM.yyyy'
): string {
  const date = parseMaybeDate(input);
  if (!date) return '';
  try {
    return formatFns(date, pattern, { locale: pl });
  } catch (e) {
    return '';
  }
}

/**
 * Formats a date and time into a user-friendly string.
 * @param input - The date to format.
 * @param pattern - The date-fns format pattern.
 * @returns The formatted string, or an empty string if invalid.
 */
export function formatDateTime(
  input: Date | string | number | null | undefined,
  pattern: string = 'dd.MM.yyyy HH:mm'
): string {
    const date = parseMaybeDate(input);
    if (!date) return '';
    try {
        return formatFns(date, pattern, { locale: pl });
    } catch (e) {
        return '';
    }
}

/**
 * Checks if a value is a valid Date object.
 * @param input - The value to check.
 * @returns True if the input is a valid Date.
 */
export function isValidDate(input: unknown): input is Date {
    return input instanceof Date && isValid(input);
}
