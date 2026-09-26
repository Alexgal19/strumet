import { describe, expect, it } from 'vitest';
import { fastAbsenceIntent, resolveSingleDay } from './fast-intent';

const saturday = new Date('2026-09-26T12:00:00Z');
describe('local voice fast dates', () => {
  it('resolves this Friday in the current Warsaw week with or without accents', () => {
    expect(resolveSingleDay('ten piątek', '2026-09-26')).toBe('2026-09-25');
    expect(fastAbsenceIntent('kto z pracowników był nieobecny w ten piątek', saturday)?.date).toBe('2026-09-25');
    expect(fastAbsenceIntent('kto z pracownikow byl nieobecny w ten piatek', saturday)?.date).toBe('2026-09-25');
  });
  it('uses Monday-Sunday weeks for past and future weekday references', () => {
    expect(resolveSingleDay('zeszły piątek', '2026-09-26')).toBe('2026-09-18');
    expect(resolveSingleDay('przyszły poniedziałek', '2026-09-26')).toBe('2026-09-28');
    expect(resolveSingleDay('ten poniedziałek', '2026-09-27')).toBe('2026-09-21');
  });
  it('accepts valid ISO and Polish calendar dates', () => {
    expect(fastAbsenceIntent('Kto był nieobecny 25.09.2026?', saturday)?.date).toBe('2026-09-25');
    expect(fastAbsenceIntent('Ilu było nieobecnych 2026-09-25?', saturday)?.answerMode).toBe('count');
    expect(resolveSingleDay('31.02.2026', '2026-09-26')).toBeNull();
  });
  it('leaves ambiguous, ranged and modifying questions to the model', () => {
    expect(fastAbsenceIntent('Kto był nieobecny w piątek?', saturday)).toBeNull();
    expect(fastAbsenceIntent('Kto był nieobecny od 2026-09-25 do 2026-09-26?', saturday)).toBeNull();
    expect(fastAbsenceIntent('Usuń nieobecnych w ten piątek', saturday)).toBeNull();
    expect(fastAbsenceIntent('Kto był nieobecny wczoraj i dziś?', saturday)).toBeNull();
  });
});
