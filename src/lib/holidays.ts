
import { add, set } from 'date-fns';

function getEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export function getPolishHolidays(year: number): Date[] {
  const easter = getEaster(year);
  
  const holidays = [
    // New Year
    new Date(year, 0, 1),
    // Epiphany
    new Date(year, 0, 6),
    // Easter Sunday
    easter,
    // Easter Monday
    add(easter, { days: 1 }),
    // Labour Day
    new Date(year, 4, 1),
    // Constitution Day
    new Date(year, 4, 3),
    // Pentecost Sunday
    add(easter, { days: 49 }),
    // Corpus Christi
    add(easter, { days: 60 }),
    // Assumption of Mary
    new Date(year, 7, 15),
    // All Saints' Day
    new Date(year, 10, 1),
    // Independence Day
    new Date(year, 10, 11),
    // Christmas Day
    new Date(year, 11, 25),
    // Second day of Christmas
    new Date(year, 11, 26),
  ];

  return holidays;
}
