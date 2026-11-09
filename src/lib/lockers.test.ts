import { describe, expect, it } from 'vitest';
import type { Employee } from './types';
import { buildLockerOccupancy } from './lockers';

const emp = (fullName: string, extra: Partial<Employee> = {}): Employee => ({
  id: fullName,
  fullName,
  hireDate: '2025-01-01',
  jobTitle: '',
  department: '',
  manager: '',
  cardNumber: '',
  nationality: '',
  lockerNumber: '',
  departmentLockerNumber: '',
  sealNumber: '',
  status: 'aktywny',
  ...extra,
});

describe('buildLockerOccupancy', () => {
  it('counts all three main lockers and the department locker', () => {
    const map = buildLockerOccupancy([
      emp('Kowalski Jan', { lockerNumber: 'K206', lockerNumber2: ' k207', lockerNumber3: '15', departmentLockerNumber: '99' }),
    ]);
    expect(Object.keys(map).sort()).toEqual(['15', '99', 'K206', 'K207']);
  });

  it('ignores terminated employees and lists every active owner of a shared locker', () => {
    const map = buildLockerOccupancy([
      emp('A', { lockerNumber: 'K1' }),
      emp('B', { lockerNumber2: 'K1' }),
      emp('C', { lockerNumber: 'K1', status: 'zwolniony' }),
    ]);
    expect(map.K1).toEqual(['A', 'B']);
  });

  it('does not count the same locker twice for one employee', () => {
    const map = buildLockerOccupancy([emp('A', { lockerNumber: 'K1', lockerNumber2: 'k1' })]);
    expect(map.K1).toEqual(['A']);
  });
});
