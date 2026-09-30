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

  it('zwolnienia zwiększają braki chronologicznie', () => {
    expect(
      forecastShortage(16, 12, [{ date: '2026-10-15', count: 2 }, { date: '2026-11-02', count: 1 }], [])
    ).toEqual([
      { kind: 'now', date: '', shortage: 4 },
      { kind: 'date', date: '2026-10-15', shortage: 6 },
      { kind: 'date', date: '2026-11-02', shortage: 7 },
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
      forecastShortage(16, 12, [{ date: '2026-10-01', count: 2 }], [{ date: '2026-10-01', count: 2 }])
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
      { kind: 'date', date: '2026-10-01', shortage: 3 },
    ]);
  });

  it('pomija nieprawidłowe daty', () => {
    expect(
      forecastShortage(10, 8, [{ date: 'nie-data', count: 5 }, { date: '2026-13-01', count: 5 }], [])
    ).toEqual([{ kind: 'now', date: '', shortage: 2 }]);
  });
});
