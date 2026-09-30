import {
  arrivalStatus,
  matchHires,
  splitArrivals,
  type HistoriaArrival,
  type HistoriaEmployee,
} from '@/lib/przyjecia-historia';

const arr = (id: string, date: string, count = 2): HistoriaArrival => ({
  id,
  department: 'DZIAŁ_A',
  jobTitle: 'Szlifierz',
  date,
  count,
});

const emp = (fullName: string, hireDate?: string): HistoriaEmployee => ({
  fullName,
  department: 'DZIAŁ_A',
  jobTitle: 'Szlifierz',
  hireDate,
});

describe('przyjecia-historia', () => {
  describe('splitArrivals', () => {
    it('dzieli na nadchodzące (>= dziś) i przeszłe, sortuje', () => {
      const { upcoming, past } = splitArrivals(
        [arr('1', '2026-10-05'), arr('2', '2026-09-20'), arr('3', '2026-09-30'), arr('4', '2026-10-01')],
        '2026-09-30'
      );
      expect(upcoming.map(a => a.id)).toEqual(['3', '4', '1']);
      expect(past.map(a => a.id)).toEqual(['2']);
    });

    it('uszkodzona data nie gubi wpisu', () => {
      const { upcoming, past } = splitArrivals([arr('1', '')], '2026-09-30');
      expect(upcoming.map(a => a.id)).toEqual(['1']);
      expect(past).toEqual([]);
    });
  });

  describe('matchHires', () => {
    const arrival = arr('1', '2026-09-10', 2);

    it('dopasowuje po dziale, stanowisku i oknie dat', () => {
      const matched = matchHires(arrival, [
        emp('Jan Kowalski', '2026-09-12'),
        emp('Ewa Nowak', '2026-09-05'),
        { ...emp('Obcy Dział', '2026-09-12'), department: 'DZIAŁ_B' },
      ]);
      expect(matched.map(m => m.fullName)).toEqual(['Ewa Nowak', 'Jan Kowalski']);
    });

    it('ignoruje inny dział/stanowisko i brak hireDate', () => {
      const matched = matchHires(
        arrival,
        [
          { ...emp('Inny Dział', '2026-09-12'), department: 'DZIAŁ_B' },
          { ...emp('Inne Stanowisko', '2026-09-12'), jobTitle: 'Spawacz' },
          emp('Bez Daty'),
        ]
      );
      expect(matched).toEqual([]);
    });

    it('szanuje granice okna [-7, +14]', () => {
      const matched = matchHires(arrival, [
        emp('Za Wcześnie', '2026-09-02'),
        emp('Dolna Granica', '2026-09-03'),
        emp('Górna Granica', '2026-09-24'),
        emp('Za Późno', '2026-09-25'),
      ]);
      expect(matched.map(m => m.fullName)).toEqual(['Dolna Granica', 'Górna Granica']);
    });
  });

  describe('arrivalStatus', () => {
    it('done / partial / missing', () => {
      expect(arrivalStatus(arr('1', '2026-09-10', 2), 2)).toBe('done');
      expect(arrivalStatus(arr('1', '2026-09-10', 3), 5)).toBe('done');
      expect(arrivalStatus(arr('1', '2026-09-10', 2), 1)).toBe('partial');
      expect(arrivalStatus(arr('1', '2026-09-10', 2), 0)).toBe('missing');
    });
  });
});
