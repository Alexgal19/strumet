import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  ALL_NAV_ITEMS, getPageTitle, getPrimaryItems, getVisibleSections,
  isNavItemActive,
} from '@/components/app-navigation';

const hrefsFor = (role: 'admin' | 'editor' | 'guest') =>
  getVisibleSections(role).flatMap((section) => section.items.map((item) => item.href));

describe('shared application navigation', () => {
  it('keeps every route unique and gives the guest only the public schedule', () => {
    const hrefs = ALL_NAV_ITEMS.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefsFor('guest')).toEqual(['/harmonogram']);
  });

  it('uses the same four primary destinations for signed-in roles', () => {
    const expected = ['/pulpit', '/aktywni', '/zwolnieni', '/odwiedzalnosc'];
    expect(getPrimaryItems('admin').map((item) => item.href)).toEqual(expected);
    expect(getPrimaryItems('editor').map((item) => item.href)).toEqual(expected);
    expect(getPrimaryItems('guest').map((item) => item.href)).toEqual(['/harmonogram']);
  });

  it('keeps the bottom bar within five slots (primary items + More)', () => {
    expect(getPrimaryItems('admin').length + 1).toBeLessThanOrEqual(5);
  });

  it('shows the System section to admins only', () => {
    const systemRoutes = ['/konfiguracja', '/szablony-email', '/historia-email', '/kolejnosc-nazwisk'];
    systemRoutes.forEach((route) => {
      expect(hrefsFor('admin')).toContain(route);
      expect(hrefsFor('editor')).not.toContain(route);
      expect(hrefsFor('guest')).not.toContain(route);
    });
    expect(hrefsFor('editor')).toContain('/statystyki');
  });

  it('matches route boundaries and labels nested routes', () => {
    expect(isNavItemActive('/wydawanie-odziezy-nowi', '/wydawanie-odziezy')).toBe(false);
    expect(isNavItemActive('/szablony-email/example', '/szablony-email')).toBe(true);
    expect(getPageTitle('/rekrutacja')).toBe('Rekrutacja');
    expect(getPageTitle('/harmonogram')).toBe('Obsada');
  });

  it('has a menu entry for every list page in src/app/(app)', () => {
    // Celowo poza menu: karta pracownika (/pracownicy/[id]) oraz katalog z samymi komponentami (employees).
    const hiddenOnPurpose = new Set(['pracownicy', 'employees']);
    const appDir = join(process.cwd(), 'src', 'app', '(app)');
    const pages = readdirSync(appDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !hiddenOnPurpose.has(entry.name))
      .filter((entry) => existsSync(join(appDir, entry.name, 'page.tsx')))
      .map((entry) => `/${entry.name}`);
    const navHrefs = new Set(ALL_NAV_ITEMS.map((item) => item.href));
    expect(pages.filter((page) => !navHrefs.has(page))).toEqual([]);
  });
});
