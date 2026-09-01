'use client';

import React from 'react';
import { Employee, Absence } from '@/lib/types';
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { pl } from 'date-fns/locale';

interface MonthlyReportPrintProps {
  employees: Employee[];
  absences: Absence[];
  month: Date;
}

export function MonthlyReportPrint({ employees, absences, month }: MonthlyReportPrintProps) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const inMonth = (raw: string | undefined | null) => {
    if (!raw) return false;
    const d = parseISO(raw);
    return !isNaN(d.getTime()) && isWithinInterval(d, { start: monthStart, end: monthEnd });
  };

  const monthAbsences = absences.filter((a) => inMonth(a.date));
  const deptCounts = new Map<string, number>();
  const personCounts = new Map<string, number>();
  monthAbsences.forEach((a) => {
    const e = employees.find((emp) => emp.id === a.employeeId);
    if (!e) return;
    const dept = e.department || 'Bez działu';
    deptCounts.set(dept, (deptCounts.get(dept) ?? 0) + 1);
    personCounts.set(e.fullName, (personCounts.get(e.fullName) ?? 0) + 1);
  });

  const in30 = (raw: string | undefined) => {
    if (!raw) return false;
    const d = parseISO(raw);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    return d >= now && d <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  };

  const expiringContracts = employees
    .filter((e) => in30(e.contractEndDate))
    .sort((a, b) => new Date(a.contractEndDate!).getTime() - new Date(b.contractEndDate!).getTime());
  const plannedTerminations = employees
    .filter((e) => in30(e.plannedTerminationDate))
    .sort((a, b) => new Date(a.plannedTerminationDate!).getTime() - new Date(b.plannedTerminationDate!).getTime());

  return (
    <div className="bg-white text-black p-8 font-sans" style={{ width: '210mm' }}>
      <div className="flex items-start justify-between border-b-2 border-black pb-3 mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Baza-ST — Raport miesięczny</h1>
          <p className="text-sm mt-1 capitalize">
            {format(month, 'LLLL yyyy', { locale: pl })}
          </p>
        </div>
        <div className="text-xs text-right">
          <p>Wygenerowano: {format(new Date(), 'dd.MM.yyyy HH:mm')}</p>
          <p>Liczba pracowników aktywnych: {employees.length}</p>
        </div>
      </div>

      <section className="mb-6">
        <h2 className="text-base font-bold border-b border-black mb-2">1. Nieobecności wg działów</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left py-1">Dział</th>
              <th className="text-right py-1">Dni nieobecności</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(deptCounts.entries()).sort((a, b) => b[1] - a[1]).map(([dept, count]) => (
              <tr key={dept} className="border-b border-gray-300">
                <td className="py-1">{dept}</td>
                <td className="text-right py-1">{count}</td>
              </tr>
            ))}
            {deptCounts.size === 0 && (
              <tr><td colSpan={2} className="py-1 text-gray-500">Brak nieobecności w tym miesiącu.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="mb-6">
        <h2 className="text-base font-bold border-b border-black mb-2">2. Nieobecności wg pracowników</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left py-1">Pracownik</th>
              <th className="text-right py-1">Dni</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(personCounts.entries()).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
              <tr key={name} className="border-b border-gray-300">
                <td className="py-1">{name}</td>
                <td className="text-right py-1">{count}</td>
              </tr>
            ))}
            {personCounts.size === 0 && (
              <tr><td colSpan={2} className="py-1 text-gray-500">Brak danych.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="mb-6">
        <h2 className="text-base font-bold border-b border-black mb-2">3. Umowy wygasające w ciągu 30 dni</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left py-1">Pracownik</th>
              <th className="text-left py-1">Dział</th>
              <th className="text-right py-1">Umowa do</th>
            </tr>
          </thead>
          <tbody>
            {expiringContracts.map((e) => (
              <tr key={e.id} className="border-b border-gray-300">
                <td className="py-1">{e.fullName}</td>
                <td className="py-1">{e.department}</td>
                <td className="text-right py-1">{format(parseISO(e.contractEndDate!), 'dd.MM.yyyy')}</td>
              </tr>
            ))}
            {expiringContracts.length === 0 && (
              <tr><td colSpan={3} className="py-1 text-gray-500">Brak umów wygasających w ciągu 30 dni.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="text-base font-bold border-b border-black mb-2">4. Planowane zwolnienia</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left py-1">Pracownik</th>
              <th className="text-left py-1">Dział</th>
              <th className="text-right py-1">Data zwolnienia</th>
            </tr>
          </thead>
          <tbody>
            {plannedTerminations.map((e) => (
              <tr key={e.id} className="border-b border-gray-300">
                <td className="py-1">{e.fullName}</td>
                <td className="py-1">{e.department}</td>
                <td className="text-right py-1">{format(parseISO(e.plannedTerminationDate!), 'dd.MM.yyyy')}</td>
              </tr>
            ))}
            {plannedTerminations.length === 0 && (
              <tr><td colSpan={3} className="py-1 text-gray-500">Brak zaplanowanych zwolnień.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
