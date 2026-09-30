import { getTodayYmd, validatePrzyjecie, MAX_COUNT } from '@/lib/przyjecia-validation';

const DEPTS = ['DZIAŁ_A', 'DZIAŁ_B'];
const JOBS = ['Spawacz MIG/MAG', 'Szlifierz'];
const TODAY = '2026-09-30';

describe('przyjecia-validation', () => {
  describe('getTodayYmd', () => {
    it('zwraca format yyyy-mm-dd', () => {
      expect(getTodayYmd('Europe/Warsaw', new Date('2026-09-30T10:00:00Z'))).toBe('2026-09-30');
    });
  });

  describe('validatePrzyjecie', () => {
    it('akceptuje poprawne dane (data = dziś)', () => {
      const res = validatePrzyjecie(
        { department: 'DZIAŁ_A', jobTitle: 'Szlifierz', date: TODAY, count: 2 },
        DEPTS,
        JOBS,
        TODAY
      );
      expect(res).toEqual({
        ok: true,
        value: { department: 'DZIAŁ_A', jobTitle: 'Szlifierz', date: TODAY, count: 2 },
      });
    });

    it('akceptuje datę przyszłą', () => {
      const res = validatePrzyjecie(
        { department: 'DZIAŁ_A', jobTitle: 'Szlifierz', date: '2026-10-01', count: 1 },
        DEPTS,
        JOBS,
        TODAY
      );
      expect(res.ok).toBe(true);
    });

    it('odrzuca datę z przeszłości', () => {
      const res = validatePrzyjecie(
        { department: 'DZIAŁ_A', jobTitle: 'Szlifierz', date: '2026-09-29', count: 1 },
        DEPTS,
        JOBS,
        TODAY
      );
      expect(res).toEqual({ ok: false, error: 'Data przyjęcia nie może być z przeszłości.' });
    });

    it('odrzuca niekalendarzową datę', () => {
      for (const bad of ['2026-13-01', '2026-02-30', '30.09.2026', '', 'abc']) {
        const res = validatePrzyjecie(
          { department: 'DZIAŁ_A', jobTitle: 'Szlifierz', date: bad, count: 1 },
          DEPTS,
          JOBS,
          TODAY
        );
        expect(res).toEqual({ ok: false, error: 'Nieprawidłowa data.' });
      }
    });

    it('odrzuca dział spoza listy', () => {
      const res = validatePrzyjecie(
        { department: 'NIEZNANY', jobTitle: 'Szlifierz', date: TODAY, count: 1 },
        DEPTS,
        JOBS,
        TODAY
      );
      expect(res).toEqual({ ok: false, error: 'Wybierz dział z listy.' });
    });

    it('odrzuca puste stanowisko i spoza listy', () => {
      expect(
        validatePrzyjecie({ department: 'DZIAŁ_A', jobTitle: '', date: TODAY, count: 1 }, DEPTS, JOBS, TODAY)
      ).toEqual({ ok: false, error: 'Wybierz stanowisko.' });
      expect(
        validatePrzyjecie({ department: 'DZIAŁ_A', jobTitle: 'Kosmonauta', date: TODAY, count: 1 }, DEPTS, JOBS, TODAY)
      ).toEqual({ ok: false, error: 'Wybierz stanowisko z listy.' });
    });

    it('odrzuca liczbę spoza 1..MAX', () => {
      for (const bad of [0, -1, MAX_COUNT + 1, 1.5, 'abc', '']) {
        const res = validatePrzyjecie(
          { department: 'DZIAŁ_A', jobTitle: 'Szlifierz', date: TODAY, count: bad },
          DEPTS,
          JOBS,
          TODAY
        );
        expect(res.ok).toBe(false);
      }
    });

    it('przyjmuje liczbę jako string', () => {
      const res = validatePrzyjecie(
        { department: 'DZIAŁ_A', jobTitle: 'Szlifierz', date: TODAY, count: '3' },
        DEPTS,
        JOBS,
        TODAY
      );
      expect(res).toEqual({
        ok: true,
        value: { department: 'DZIAŁ_A', jobTitle: 'Szlifierz', date: TODAY, count: 3 },
      });
    });

    it('ignoruje nadmiarowe pola (whitelist)', () => {
      const res = validatePrzyjecie(
        { department: 'DZIAŁ_A', jobTitle: 'Szlifierz', date: TODAY, count: 1, role: 'admin' } as never,
        DEPTS,
        JOBS,
        TODAY
      );
      expect(res).toEqual({
        ok: true,
        value: { department: 'DZIAŁ_A', jobTitle: 'Szlifierz', date: TODAY, count: 1 },
      });
    });
  });
});
