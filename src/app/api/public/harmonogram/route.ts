import { NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';
import type { HarmonogramData } from '@/lib/harmonogram';

export const dynamic = 'force-dynamic';

/**
 * Publiczny (bez logowania) endpoint tylko do ODCZYTU danych harmonogramu obsady.
 * Zwraca wyłącznie minimalny zestaw pól — bez danych wrażliwych (karty, szafki itd.).
 */
export async function GET() {
  try {
    const db = getAdminApp().database();

    const [employeesSnap, absencesSnap, recruitmentSnap] = await Promise.all([
      db.ref('employees').once('value'),
      db.ref('absences').once('value'),
      db.ref('recruitment').once('value'),
    ]);

    const employeesRaw = employeesSnap.val() ?? {};
    const absencesRaw = absencesSnap.val() ?? {};
    const recruitmentRaw = recruitmentSnap.val() ?? {};

    const employees = Object.entries(employeesRaw)
      .map(([, val]) => val as Record<string, string>)
      .filter(e => e.status === 'aktywny')
      .map(e => ({
        department: e.department ?? '',
        jobTitle: e.jobTitle ?? '',
        fullName: e.fullName ?? '',
        manager: e.manager ?? '',
        hireDate: e.hireDate || undefined,
        vacationStartDate: e.vacationStartDate || undefined,
        vacationEndDate: e.vacationEndDate || undefined,
        plannedTerminationDate: e.plannedTerminationDate || undefined,
      }));

    const absenceEntries = Object.entries(absencesRaw)
      .map(([, val]) => val as Record<string, string>)
      .filter(a => !!a.date);
    const employeeById = new Map(
      Object.entries(employeesRaw).map(([id, val]) => [id, val as Record<string, string>])
    );
    const absences = absenceEntries
      .map(a => {
        const emp = employeeById.get(a.employeeId);
        if (!emp || emp.status !== 'aktywny') return null;
        return {
          date: a.date,
          department: emp.department ?? '',
          jobTitle: emp.jobTitle ?? '',
          fullName: emp.fullName ?? '',
          manager: emp.manager ?? '',
        };
      })
      .filter(Boolean);

    const recruitments = Object.entries(recruitmentRaw).map(([, val]) => {
      const rec = val as Record<string, unknown>;
      const positionsRaw = (rec.positions ?? {}) as Record<
        string,
        { jobTitle?: string; toRecruit?: number }
      >;
      const arrivalsRaw = (rec.arrivals ?? {}) as Record<
        string,
        { date?: string; count?: number }
      >;
      // Nowy model: positions[] — stare wpisy (jobTitle/toRecruit) mapujemy do jednej pozycji
      const legacyJobTitle = typeof rec.jobTitle === 'string' ? rec.jobTitle : undefined;
      const positions = Object.keys(positionsRaw).length
        ? Object.values(positionsRaw).map((p) => ({
            jobTitle: p.jobTitle ?? '',
            toRecruit: Number(p.toRecruit) || 0,
          }))
        : legacyJobTitle
          ? [{ jobTitle: legacyJobTitle, toRecruit: Number(rec.toRecruit) || 0 }]
          : [];
      return {
        department: (rec.department as string) ?? '',
        positions,
        arrivals: Object.values(arrivalsRaw)
          .filter((a) => !!a.date)
          .map((a) => ({ date: a.date as string, count: Number(a.count) || 0 })),
      };
    });

    const data: HarmonogramData = {
      employees,
      absences: absences as HarmonogramData['absences'],
      recruitments,
    };

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('public/harmonogram error:', error);
    return NextResponse.json({ error: 'Błąd pobierania danych.' }, { status: 500 });
  }
}
