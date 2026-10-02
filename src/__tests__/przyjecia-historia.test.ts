import {
  arrivalStatus,
  isPendingTermination,
  matchHires,
  matchTransfers,
  splitArrivals,
  type HistoriaArrival,
  type HistoriaEmployee,
  type TransferRecord,
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

  describe('isPendingTermination', () => {
    const TODAY = new Date(2026, 8, 30).getTime(); // 30.09.2026 00:00
    it('zwolniony z dzisiejszą datą już NIE zwalnia', () => {
      expect(isPendingTermination('zwolniony', '2026-09-30', '2026-09-30', TODAY)).toBe(false);
    });
    it('zwolniony z przyszłą datą już NIE zwalnia', () => {
      expect(isPendingTermination('zwolniony', '2026-10-05', undefined, TODAY)).toBe(false);
    });
    it('aktywny z dzisiejszą/przyszłą datą zwalnia', () => {
      expect(isPendingTermination('aktywny', '2026-09-30', undefined, TODAY)).toBe(true);
      expect(isPendingTermination('aktywny', undefined, '2026-10-05', TODAY)).toBe(true);
    });
    it('aktywny z przeszłą datą / bez daty nie zwalnia', () => {
      expect(isPendingTermination('aktywny', '2026-09-29', undefined, TODAY)).toBe(false);
      expect(isPendingTermination('aktywny', undefined, undefined, TODAY)).toBe(false);
      expect(isPendingTermination('aktywny', 'nie-data', undefined, TODAY)).toBe(false);
    });
  });

  describe('matchTransfers', () => {
    const arrival = arr('1', '2026-09-10', 2);
    const tr = (name: string, date: string, toDept = 'DZIAŁ_A', toJob = 'Szlifierz'): TransferRecord => ({
      employeeId: 'e1',
      fullName: name,
      fromDepartment: 'DZIAŁ_B',
      fromJobTitle: 'Inne',
      toDepartment: toDept,
      toJobTitle: toJob,
      date,
    });

    it('dopasowuje transfery w oknie dat', () => {
      const matched = matchTransfers(arrival, [
        tr('Jan Kowalski', '2026-09-11'),
        tr('Ewa Nowak', '2026-09-03'),
        tr('Inny Dział', '2026-09-12', 'DZIAŁ_C'),
      ]);
      expect(matched.map(m => m.fullName)).toEqual(['Ewa Nowak', 'Jan Kowalski']);
      expect(matched[1].fromDepartment).toBe('DZIAŁ_B');
    });

    it('poza oknem i uszkodzona data odpadają', () => {
      const matched = matchTransfers(arrival, [
        tr('Za Wcześnie', '2026-09-02'),
        tr('Za Późno', '2026-09-25'),
        tr('Zła Data', 'nie-data'),
      ]);
      expect(matched).toEqual([]);
    });
  });
});

import { allocateArrivals, arrivalWindowEnd } from '@/lib/przyjecia-historia';

describe('przyjecia-historia — status w oknie weryfikacji', () => {
  const a = arr('1', '2026-09-10', 2);

  it('okno +14 dni: brak dopasowań w trakcie okna = pending, po oknie = missing', () => {
    expect(arrivalWindowEnd(a)).toBe('2026-09-24');
    expect(arrivalStatus(a, 0, '2026-09-11')).toBe('pending');
    expect(arrivalStatus(a, 0, '2026-09-24')).toBe('pending');
    expect(arrivalStatus(a, 0, '2026-09-25')).toBe('missing');
  });

  it('dopasowania mają pierwszeństwo przed pending; bez todayYmd działa jak dawniej', () => {
    expect(arrivalStatus(a, 1, '2026-09-11')).toBe('partial');
    expect(arrivalStatus(a, 2, '2026-09-11')).toBe('done');
    expect(arrivalStatus(a, 0)).toBe('missing');
  });
});

describe('przyjecia-historia — allocateArrivals', () => {
  it('ta sama osoba liczy się tylko do jednego przyjęcia', () => {
    const arrivals = [arr('1', '2026-09-10', 1), arr('2', '2026-09-14', 1)];
    const employees = [emp('Jan', '2026-09-12')]; // w oknie obu przyjęć
    const res = allocateArrivals(arrivals, employees, []);
    const total = res.get('1')!.hired.length + res.get('2')!.hired.length;
    expect(total).toBe(1);
  });

  it('wybiera osobę najbliższą dacie i nie przekracza count', () => {
    const arrivals = [arr('1', '2026-09-10', 1)];
    const employees = [emp('Daleki', '2026-09-03'), emp('Bliski', '2026-09-10'), emp('Trzeci', '2026-09-12')];
    const res = allocateArrivals(arrivals, employees, []);
    expect(res.get('1')!.hired.map(h => h.fullName)).toEqual(['Bliski']);
  });

  it('nadwyżka z jednego przyjęcia trafia do kolejnego', () => {
    const arrivals = [arr('1', '2026-09-10', 1), arr('2', '2026-09-14', 1)];
    const employees = [emp('Jan', '2026-09-10'), emp('Ewa', '2026-09-11')];
    const res = allocateArrivals(arrivals, employees, []);
    expect(res.get('1')!.hired.map(h => h.fullName)).toEqual(['Jan']);
    expect(res.get('2')!.hired.map(h => h.fullName)).toEqual(['Ewa']);
  });

  it('transfer dopełnia do count i nie dubluje osoby już zatrudnionej', () => {
    const arrivals = [arr('1', '2026-09-10', 2)];
    const transfers: TransferRecord[] = [
      { employeeId: 'a', fullName: 'Jan', fromDepartment: 'X', fromJobTitle: 'Y', toDepartment: 'DZIAŁ_A', toJobTitle: 'Szlifierz', date: '2026-09-11' },
      { employeeId: 'b', fullName: 'Ola', fromDepartment: 'X', fromJobTitle: 'Y', toDepartment: 'DZIAŁ_A', toJobTitle: 'Szlifierz', date: '2026-09-12' },
    ];
    const res = allocateArrivals(arrivals, [emp('Jan', '2026-09-10')], transfers);
    expect(res.get('1')!.hired.map(h => h.fullName)).toEqual(['Jan']);
    expect(res.get('1')!.moved.map(m => m.fullName)).toEqual(['Ola']);
  });

  it('tezki z innych działów/stanowisk nie blokują się nawzajem', () => {
    const arrivals = [
      arr('1', '2026-09-10', 1),
      { ...arr('2', '2026-09-10', 1), department: 'DZIAŁ_B' },
    ];
    const employees = [
      emp('Jan Kowalski', '2026-09-10'),
      { ...emp('Jan Kowalski', '2026-09-10'), department: 'DZIAŁ_B' },
    ];
    const res = allocateArrivals(arrivals, employees, []);
    expect(res.get('1')!.hired).toHaveLength(1);
    expect(res.get('2')!.hired).toHaveLength(1);
  });
});
