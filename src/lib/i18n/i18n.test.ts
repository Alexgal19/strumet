import { describe, expect, it } from 'vitest';
import { translate, translatePlural } from './index';
import { MESSAGE_MODULES } from './messages';

describe('i18n', () => {
  it('has the same keys and placeholders in Polish and English', () => {
    for (const [name, mod] of Object.entries(MESSAGE_MODULES)) {
      const pl = mod.pl as Record<string, string>;
      const en = mod.en as Record<string, string>;
      expect(Object.keys(en).sort(), name).toEqual(Object.keys(pl).sort());
      for (const key of Object.keys(pl)) {
        const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
        expect(vars(en[key]), `${name}.${key}`).toEqual(vars(pl[key]));
        expect(en[key].trim(), `${name}.${key} is empty`).not.toBe('');
      }
    }
  });

  it('translates and fills variables', () => {
    expect(translate('pl', 'common.save')).toBe('Zapisz');
    expect(translate('en', 'common.save')).toBe('Save');
    expect(translate('en', 'employee.foundCount', { count: 3, total: 10 })).toBe('Found: 3 of 10');
  });

  it('picks Polish and English plural forms', () => {
    expect(translatePlural('pl', 'dashboard.people', 1)).toBe('1 osoba');
    expect(translatePlural('pl', 'dashboard.people', 3)).toBe('3 osoby');
    expect(translatePlural('pl', 'dashboard.people', 5)).toBe('5 osób');
    expect(translatePlural('pl', 'dashboard.people', 12)).toBe('12 osób');
    expect(translatePlural('pl', 'dashboard.people', 22)).toBe('22 osoby');
    expect(translatePlural('en', 'dashboard.people', 1)).toBe('1 person');
    expect(translatePlural('en', 'dashboard.people', 3)).toBe('3 people');
  });
});
