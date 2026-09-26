import { describe, expect, it } from 'vitest';
import {
  ALL_NAV_ITEMS, getPageTitle, getPrimaryItems, getVisibleSections,
  isNavItemActive,
} from '@/components/app-navigation';

describe('shared application navigation', () => {
  it('keeps every route unique and gives the guest only the public schedule', () => {
    const hrefs = ALL_NAV_ITEMS.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(getVisibleSections('guest').flatMap((section) => section.items.map((item) => item.href))).toEqual(['/harmonogram']);
  });

  it('uses the same four primary destinations for signed-in roles', () => {
    const expected = ['/pulpit', '/aktywni', '/zwolnieni', '/odwiedzalnosc'];
    expect(getPrimaryItems('admin').map((item) => item.href)).toEqual(expected);
    expect(getPrimaryItems('editor').map((item) => item.href)).toEqual(expected);
    expect(getPrimaryItems('guest').map((item) => item.href)).toEqual(['/harmonogram']);
  });

  it('matches route boundaries and labels nested routes', () => {
    expect(isNavItemActive('/wydawanie-odziezy-nowi', '/wydawanie-odziezy')).toBe(false);
    expect(isNavItemActive('/szablony-email/example', '/szablony-email')).toBe(true);
    expect(getPageTitle('/rekrutacja')).toBe('Rekrutacja');
    expect(getPageTitle('/harmonogram')).toBe('Harmonogram');
  });
});
