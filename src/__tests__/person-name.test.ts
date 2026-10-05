import { buildTokenFrequency, guessNameOrder, joinFullName, splitFullName, suggestReordered } from '@/lib/person-name';

describe('person-name', () => {
  it('splitFullName: pierwszy wyraz to nazwisko, reszta to imię/imiona', () => {
    expect(splitFullName('Kowalski Jan')).toEqual({ lastName: 'Kowalski', firstName: 'Jan' });
    expect(splitFullName('  Kowalski   Jan  Maria ')).toEqual({ lastName: 'Kowalski', firstName: 'Jan Maria' });
    expect(splitFullName('Kowalski')).toEqual({ lastName: 'Kowalski', firstName: '' });
    expect(splitFullName(undefined)).toEqual({ lastName: '', firstName: '' });
  });

  it('joinFullName składa "Nazwisko Imię" i czyści spacje', () => {
    expect(joinFullName(' Kowalski ', ' Jan  Maria')).toBe('Kowalski Jan Maria');
    expect(joinFullName('Kowalski', '')).toBe('Kowalski');
  });

  it('split i join są odwrotne', () => {
    const { lastName, firstName } = splitFullName('Nowak Anna Maria');
    expect(joinFullName(lastName, firstName)).toBe('Nowak Anna Maria');
  });

  it('suggestReordered przenosi ostatni wyraz na początek', () => {
    expect(suggestReordered('Jan Kowalski')).toBe('Kowalski Jan');
    expect(suggestReordered('Jan Maria Kowalski')).toBe('Kowalski Jan Maria');
    expect(suggestReordered('Kowalski')).toBe('Kowalski');
  });

  it('guessNameOrder używa częstości wyrazów (imiona powtarzają się częściej)', () => {
    const names = ['Oleksandr Petrenko', 'Oleksandr Melnyk', 'Dryha Volodymyr', 'Oleksandr Bondar', 'Volodymyr Koval'];
    const freq = buildTokenFrequency(names);
    expect(guessNameOrder('Oleksandr Petrenko', freq)).toBe('firstLast');
    expect(guessNameOrder('Dryha Volodymyr', freq)).toBe('lastFirst');
    expect(guessNameOrder('Single', freq)).toBe('unclear');
  });
});
