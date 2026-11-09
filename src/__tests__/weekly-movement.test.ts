import { lastWeekRange, leaveDateYmd, summarizeLastWeek } from '@/lib/weekly-movement';

const NOW = new Date(2026, 10, 9); // poniedziałek 2026-11-09 → zeszły tydzień 02.11–08.11

describe('weekly-movement', () => {
  it('lastWeekRange: poprzedni tydzień pon–niedz', () => {
    expect(lastWeekRange(NOW)).toEqual({ fromYmd: '2026-11-02', toYmd: '2026-11-08' });
    expect(lastWeekRange(new Date(2026, 10, 15))).toEqual({ fromYmd: '2026-11-02', toYmd: '2026-11-08' }); // niedziela
  });

  it('leaveDateYmd: faktyczna data, a planowana tylko gdy osoba już odeszła', () => {
    expect(leaveDateYmd({ terminationDate: '2026-11-03', plannedTerminationDate: '2026-11-01' }, '2026-11-09')).toBe('2026-11-03');
    expect(leaveDateYmd({ status: 'aktywny', plannedTerminationDate: '2026-11-05' }, '2026-11-09')).toBe('2026-11-05');
    expect(leaveDateYmd({ status: 'aktywny', plannedTerminationDate: '2026-11-20' }, '2026-11-09')).toBeNull();
    expect(leaveDateYmd({ status: 'zwolniony', plannedTerminationDate: '2026-11-04' }, '2026-11-09')).toBe('2026-11-04');
  });

  it('liczy zatrudnionych i odchodzących w zeszłym tygodniu z podziałem na działy i stanowiska', () => {
    const employees = [
      { department: 'Spawalnia', jobTitle: 'Spawacz', hireDate: '2026-11-03', status: 'aktywny' },
      { department: 'Spawalnia', jobTitle: 'Spawacz', hireDate: '2026-11-08', status: 'aktywny' },
      { department: 'Spawalnia', jobTitle: 'Szlifierz', hireDate: '2026-11-01', status: 'aktywny' }, // przed okresem
      { department: 'Lakiernia', jobTitle: 'Lakiernik', hireDate: '2025-01-01', status: 'zwolniony', terminationDate: '2026-11-04' },
      { department: 'Lakiernia', jobTitle: 'Wózkowy', hireDate: '2025-01-01', status: 'aktywny', plannedTerminationDate: '2026-11-06' },
      { department: 'Lakiernia', jobTitle: 'Wózkowy', hireDate: '2025-01-01', status: 'aktywny', plannedTerminationDate: '2026-11-12' }, // jeszcze pracuje
    ];
    const r = summarizeLastWeek(employees, undefined, NOW);
    expect(r.hired.total).toBe(2);
    expect(r.hired.groups).toEqual([{ department: 'Spawalnia', total: 2, jobs: [{ jobTitle: 'Spawacz', count: 2 }] }]);
    expect(r.left.total).toBe(2);
    expect(r.left.groups).toEqual([
      { department: 'Lakiernia', total: 2, jobs: [{ jobTitle: 'Lakiernik', count: 1 }, { jobTitle: 'Wózkowy', count: 1 }] },
    ]);
  });

  it('zatrudnionych liczy z listy hires, gdy jest (obejmuje też zwolnionych bez daty)', () => {
    const hires = [{ department: 'CNC', jobTitle: 'Operator', hireDate: '2026-11-05' }];
    const r = summarizeLastWeek([], hires, NOW);
    expect(r.hired.total).toBe(1);
    expect(r.left.total).toBe(0);
  });
});

import { dayRange, summarizeRange, weekRange } from '@/lib/weekly-movement';

describe('weekly-movement — dzień i dowolny tydzień', () => {
  it('dayRange: dziś, wczoraj i dalej wstecz', () => {
    expect(dayRange(NOW, 0)).toEqual({ fromYmd: '2026-11-09', toYmd: '2026-11-09' });
    expect(dayRange(NOW, 1)).toEqual({ fromYmd: '2026-11-08', toYmd: '2026-11-08' });
    expect(dayRange(NOW, 9)).toEqual({ fromYmd: '2026-10-31', toYmd: '2026-10-31' });
  });

  it('weekRange: ten tydzień i dwa tygodnie temu', () => {
    expect(weekRange(NOW, 0)).toEqual({ fromYmd: '2026-11-09', toYmd: '2026-11-15' });
    expect(weekRange(NOW, 2)).toEqual({ fromYmd: '2026-10-26', toYmd: '2026-11-01' });
  });

  it('summarizeRange dla jednego dnia (wczoraj)', () => {
    const employees = [
      { department: 'CNC', jobTitle: 'Operator', hireDate: '2026-11-08', status: 'aktywny' },
      { department: 'CNC', jobTitle: 'Operator', hireDate: '2026-11-07', status: 'aktywny' },
      { department: 'CNC', jobTitle: 'Operator', hireDate: '2025-01-01', status: 'zwolniony', terminationDate: '2026-11-08' },
    ];
    const r = summarizeRange(employees, undefined, dayRange(NOW, 1), NOW);
    expect(r.hired.total).toBe(1);
    expect(r.left.total).toBe(1);
  });
});
