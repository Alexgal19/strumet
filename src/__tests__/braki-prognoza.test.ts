import { forecastShortage } from '@/lib/braki-prognoza';

describe('braki-prognoza', () => {
  it('tylko wiersz teraz, gdy brak zdarzeń', () => {
    expect(forecastShortage(16, 12, [], [])).toEqual([
      { kind: 'now', date: '', shortage: 4 },
    ]);
  });

  it('komplet daje 0 i brak dalszych wierszy', () => {
    expect(forecastShortage(10, 12, [], [])).toEqual([
      { kind: 'now', date: '', shortage: 0 },
    ]);
  });

  it('zwolnienia zwiększają braki chronologicznie (od dnia po ostatnim dniu pracy)', () => {
    expect(
      forecastShortage(16, 12, [{ date: '2026-10-15', count: 2 }, { date: '2026-11-02', count: 1 }], [])
    ).toEqual([
      { kind: 'now', date: '', shortage: 4 },
      { kind: 'date', date: '2026-10-16', shortage: 6 },
      { kind: 'date', date: '2026-11-03', shortage: 7 },
    ]);
  });

  it('przyjęcia zmniejszają braki (nie poniżej 0)', () => {
    expect(
      forecastShortage(16, 12, [], [{ date: '2026-09-30', count: 1 }, { date: '2026-10-05', count: 10 }])
    ).toEqual([
      { kind: 'now', date: '', shortage: 4 },
      { kind: 'date', date: '2026-09-30', shortage: 3 },
      { kind: 'date', date: '2026-10-05', shortage: 0 },
    ]);
  });

  it('ten sam dzień sumuje się; brak zmiany = brak wiersza', () => {
    expect(
      forecastShortage(16, 12, [{ date: '2026-09-30', count: 2 }], [{ date: '2026-10-01', count: 2 }])
    ).toEqual([{ kind: 'now', date: '', shortage: 4 }]);
  });

  it('grupuje wiele wpisów tej samej daty', () => {
    expect(
      forecastShortage(
        10, 10,
        [{ date: '2026-10-01', count: 1 }, { date: '2026-10-01', count: 2 }],
        []
      )
    ).toEqual([
      { kind: 'now', date: '', shortage: 0 },
      { kind: 'date', date: '2026-10-02', shortage: 3 },
    ]);
  });

  it('zwolnienie w ostatnim dniu pracy nie zwiększa braków tego samego dnia', () => {
    expect(
      forecastShortage(10, 10, [{ date: '2026-10-31', count: 1 }], [], '2026-10-01')
    ).toEqual([
      { kind: 'now', date: '', shortage: 0 },
      { kind: 'date', date: '2026-11-01', shortage: 1 },
    ]);
  });

  it('pomija nieprawidłowe daty', () => {
    expect(
      forecastShortage(10, 8, [{ date: 'nie-data', count: 5 }, { date: '2026-13-01', count: 5 }], [])
    ).toEqual([{ kind: 'now', date: '', shortage: 2 }]);
  });
});

import { addDaysToYmd, shortageAt } from '@/lib/braki-prognoza';

describe('braki-prognoza — shortageAt / addDaysToYmd', () => {
  it('addDaysToYmd przechodzi przez granicę miesiąca i roku', () => {
    expect(addDaysToYmd('2026-10-28', 7)).toBe('2026-11-04');
    expect(addDaysToYmd('2026-12-30', 3)).toBe('2027-01-02');
  });

  it('shortageAt zwraca braki na wskazany dzień', () => {
    const rows = forecastShortage(
      10, 10,
      [{ date: '2026-10-09', count: 2 }], // brak od 10.10
      [{ date: '2026-10-20', count: 1 }]
    );
    expect(shortageAt(rows, '2026-10-05')).toBe(0);
    expect(shortageAt(rows, '2026-10-09')).toBe(0);
    expect(shortageAt(rows, '2026-10-10')).toBe(2);
    expect(shortageAt(rows, '2026-10-20')).toBe(1);
    expect(shortageAt(rows, '2026-12-01')).toBe(1);
  });
});
