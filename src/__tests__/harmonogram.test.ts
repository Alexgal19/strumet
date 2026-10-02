import { buildHarmonogram, type HarmonogramData, type HarmonogramEmployee } from '@/lib/harmonogram';

const NOW = new Date(2026, 9, 15); // 2026-10-15

const emp = (over: Partial<HarmonogramEmployee>): HarmonogramEmployee => ({
  department: 'Spawalnia',
  jobTitle: 'Spawacz',
  fullName: 'Jan Kowalski',
  manager: 'Adam A',
  hireDate: '2026-01-01',
  status: 'aktywny',
  ...over,
});

const baseData = (employees: HarmonogramEmployee[], recruitments: HarmonogramData['recruitments'] = []): HarmonogramData => ({
  employees,
  absences: [],
  recruitments,
});

describe('buildHarmonogram — przyjęcia/rekrutacja przy kilku kierownikach', () => {
  const recruitments: HarmonogramData['recruitments'] = [
    {
      id: 'r1',
      department: 'Spawalnia',
      positions: [{ id: 'p1', jobTitle: 'Spawacz', toRecruit: 2 }],
      arrivals: [{ id: 'a1', date: '2026-10-10', count: 2 }],
    },
  ];

  it('liczy przyjęcia i toRecruit tylko raz, gdy to samo stanowisko ma dwóch kierowników', () => {
    const data = baseData(
      [emp({ fullName: 'A B', manager: 'Adam A' }), emp({ fullName: 'C D', manager: 'Beata B' })],
      recruitments
    );
    const dept = buildHarmonogram(data, 0, NOW).rows[0];
    const day = NOW.getDate() - 1;

    // 2 pracowników + 2 przyjęcia = 4 (a nie 6)
    expect(dept.cells[day].mam).toBe(4);
    // obecnie 2 + toRecruit 2 = 4 potrzeb (a nie 6)
    expect(dept.potrzeby).toBe(4);
  });

  it('nie tworzy pustego wiersza stanowiska u "Brak kierownika", gdy ma je inny kierownik', () => {
    const data = baseData(
      [emp({ fullName: 'A B', manager: 'Adam A' }), emp({ fullName: 'E F', manager: '' })],
      recruitments
    );
    const dept = buildHarmonogram(data, 0, NOW).rows[0];
    const brak = dept.managers.find(m => m.manager === 'Brak kierownika')!;
    // 'Brak kierownika' ma własnego pracownika na tym samym stanowisku — jeden wiersz, bez duplikatu
    expect(brak.positions.map(p => p.jobTitle)).toEqual(['Spawacz']);
    expect(dept.cells[NOW.getDate() - 1].mam).toBe(4); // 2 pracowników + 2 przyjęcia
  });
});

describe('buildHarmonogram — planowane przyjęcia z Zapotrzebowania', () => {
  const planned = (date: string, count: number, id = 'x1') => ({
    [id]: { id, department: 'Spawalnia', jobTitle: 'Spawacz', date, count },
  });

  it('nadchodzące przyjęcie zwiększa mam od swojej daty, minione jest pomijane', () => {
    const data: HarmonogramData = {
      ...baseData([emp({})]),
      planowanePrzyjecia: { ...planned('2026-10-20', 3), ...planned('2026-10-01', 5, 'x2') },
    };
    const dept = buildHarmonogram(data, 0, NOW).rows[0];
    expect(dept.cells[18].mam).toBe(1); // 19.10 — przed przyjęciem
    expect(dept.cells[19].mam).toBe(4); // 20.10 — +3; minione (01.10) nie liczone
    expect(dept.cells[0].mam).toBe(1);
  });

  it('nie zmienia obecnie ani potrzeb', () => {
    const data: HarmonogramData = { ...baseData([emp({})]), planowanePrzyjecia: planned('2026-10-20', 3) };
    const dept = buildHarmonogram(data, 0, NOW).rows[0];
    expect(dept.obecnie).toBe(1);
    expect(dept.potrzeby).toBe(1);
  });

  it('tworzy stanowisko, które ma tylko planowane przyjęcie', () => {
    const data: HarmonogramData = {
      ...baseData([emp({ jobTitle: 'Monter' })]),
      planowanePrzyjecia: planned('2026-10-20', 2),
    };
    const dept = buildHarmonogram(data, 0, NOW).rows[0];
    expect(dept.positions.map(p => p.jobTitle).sort()).toEqual(['Monter', 'Spawacz']);
  });
});

describe('buildHarmonogram — stanowisko z jawnymi potrzebami bez pracowników', () => {
  it('zachowuje stanowisko i jego potrzeby, gdy nikt już na nim nie pracuje', () => {
    const data: HarmonogramData = {
      ...baseData([emp({ jobTitle: 'Monter', manager: 'Adam A' })]),
      jobTitles: ['Spawacz', 'Monter'],
      potrzebyByManager: {
        'Spawalnia___Adam A___Spawacz': 3,
        'Spawalnia___Adam A___Monter': 1,
      },
    };
    const dept = buildHarmonogram(data, 0, NOW).rows[0];
    const spawacz = dept.positions.find(p => p.jobTitle === 'Spawacz')!;
    expect(spawacz.potrzeby).toBe(3);
    expect(spawacz.obecnie).toBe(0);
    expect(dept.potrzeby).toBe(4);
  });

  it('odzyskuje pełną nazwę stanowiska ze znakiem "/" (klucz jest zsanityzowany)', () => {
    const data: HarmonogramData = {
      ...baseData([emp({ jobTitle: 'Monter', manager: 'Adam A' })]),
      jobTitles: ['Spawacz MIG/MAG', 'Monter'],
      potrzebyByManager: { 'Spawalnia___Adam A___Spawacz MIG_MAG': 2 },
    };
    const dept = buildHarmonogram(data, 0, NOW).rows[0];
    expect(dept.positions.map(p => p.jobTitle).sort()).toEqual(['Monter', 'Spawacz MIG/MAG']);
  });

  it('nie odtwarza stanowisk o nieznanej nazwie ani kierowników bez pracowników (martwe klucze)', () => {
    const data: HarmonogramData = {
      ...baseData([emp({ manager: 'Adam A' })]),
      jobTitles: ['Spawacz', 'Monter'],
      potrzebyByManager: {
        'Spawalnia___Adam A___Nieznane': 5,
        'Spawalnia___Beata B___Monter': 2, // Beata nie ma już nikogo w dziale
      },
    };
    const dept = buildHarmonogram(data, 0, NOW).rows[0];
    expect(dept.managers.map(m => m.manager)).toEqual(['Adam A']);
    expect(dept.positions.map(p => p.jobTitle)).toEqual(['Spawacz']);
    expect(dept.potrzeby).toBe(1);
  });

  it('nie dubluje stanowiska, które ma pracownika, i pomija potrzeby = 0', () => {
    const data: HarmonogramData = {
      ...baseData([emp({})]),
      jobTitles: ['Spawacz', 'Pusty'],
      potrzebyByManager: { 'Spawalnia___Adam A___Spawacz': 2, 'Spawalnia___Adam A___Pusty': 0 },
    };
    const dept = buildHarmonogram(data, 0, NOW).rows[0];
    expect(dept.positions.map(p => p.jobTitle)).toEqual(['Spawacz']);
  });
});

describe('buildHarmonogram — stanowisko tylko z przyjęciem przy kilku kierownikach', () => {
  it('pokazuje je w grupie "Brak kierownika", gdy dział ma 2 kierowników i nikt nie jest bez kierownika', () => {
    const data: HarmonogramData = {
      ...baseData([
        emp({ fullName: 'A B', manager: 'Adam A' }),
        emp({ fullName: 'C D', manager: 'Beata B' }),
      ]),
      planowanePrzyjecia: { x: { id: 'x', department: 'Spawalnia', jobTitle: 'Monter', date: '2026-10-20', count: 2 } },
    };
    const dept = buildHarmonogram(data, 0, NOW).rows[0];
    const monter = dept.positions.find(p => p.jobTitle === 'Monter');
    expect(monter).toBeDefined();
    expect(monter!.manager).toBe('Brak kierownika');
    expect(monter!.cells[19].mam).toBe(2); // 20.10
    expect(monter!.cells[18].mam).toBe(0); // 19.10
  });
});

describe('buildHarmonogram — przyjęcie a już wprowadzony pracownik', () => {
  const planned = {
    x: { id: 'x', department: 'Spawalnia', jobTitle: 'Spawacz', date: '2026-10-20', count: 3 },
  };

  it('odejmuje od przyjęcia osoby zatrudnione w oknie dat (brak podwójnego liczenia)', () => {
    const data: HarmonogramData = {
      ...baseData([emp({}), emp({ fullName: 'Nowy', hireDate: '2026-10-16' })]),
      planowanePrzyjecia: planned,
    };
    const dept = buildHarmonogram(data, 0, NOW).rows[0];
    expect(dept.cells[14].mam).toBe(1); // 15.10: Nowy jeszcze nie zatrudniony
    expect(dept.cells[19].mam).toBe(4); // 20.10: Jan + Nowy + (3 - 1) przyjęcia
  });

  it('transfer na stanowisko też pomniejsza przyjęcie', () => {
    const data: HarmonogramData = {
      ...baseData([emp({}), emp({ fullName: 'Przeniesiony', hireDate: '2020-01-01' })]),
      planowanePrzyjecia: planned,
      transfery: {
        t1: {
          employeeId: 'e1', fullName: 'Przeniesiony', fromDepartment: 'Inny', fromJobTitle: 'Inne',
          toDepartment: 'Spawalnia', toJobTitle: 'Spawacz', date: '2026-10-18',
        },
      },
    };
    const dept = buildHarmonogram(data, 0, NOW).rows[0];
    expect(dept.cells[19].mam).toBe(4); // Jan + Przeniesiony + (3 - 1)
  });
});
