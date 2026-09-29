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

    const [employeesSnap, absencesSnap, recruitmentSnap, potrzebyObsadySnap, planowanePrzyjeciaSnap] = await Promise.all([
      db.ref('employees').once('value'),
      db.ref('absences').once('value'),
      db.ref('recruitment').once('value'), 
      db.ref('potrzebyObsady').once('value'),
      db.ref('planowanePrzyjecia').once('value'),
    ]);

    const employeesRaw = employeesSnap.val() ?? {};
    const absencesRaw = absencesSnap.val() ?? {};
    const recruitmentRaw = recruitmentSnap.val() ?? {};
    const potrzebyObsadyRaw = potrzebyObsadySnap.val() ?? {};
    const potrzebyByManager: Record<string, number> = {};
    Object.entries(potrzebyObsadyRaw).forEach(([k, v]) => {
      if (typeof v === 'number') {
        potrzebyByManager[k] = v;
      }
    });

    const employees = Object.entries(employeesRaw)
      .map(([, val]) => val as Record<string, string>)
      .filter(
        e =>
          e.status === 'aktywny' ||
          (e.status === 'zwolniony' && (e.terminationDate || e.plannedTerminationDate))
      )
      .map(e => ({
        department: e.department ?? '',
        jobTitle: e.jobTitle ?? '',
        fullName: e.fullName ?? '',
        manager: e.manager ?? '',
        hireDate: e.hireDate || undefined,
        vacationStartDate: e.vacationStartDate || undefined,
        vacationEndDate: e.vacationEndDate || undefined,
        plannedTerminationDate: e.plannedTerminationDate || undefined,
        terminationDate: e.terminationDate || undefined,
        status: e.status ?? 'aktywny',
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
        if (!emp) return null;
        return {
          date: a.date,
          department: emp.department ?? '',
          jobTitle: emp.jobTitle ?? '',
          fullName: emp.fullName ?? '',
          manager: emp.manager ?? '',
        };
      })
      .filter(Boolean);

    const recruitments = Object.entries(recruitmentRaw).map(([key, val]) => {
      const rec = val as Record<string, unknown>;
      const positionsRaw = (rec.positions ?? {}) as Record<
        string,
        { jobTitle?: string; toRecruit?: number; potrzeby?: number }
      >;
      const arrivalsRaw = (rec.arrivals ?? {}) as Record<
        string,
        { date?: string; count?: number }
      >;
      // Nowy model: positions[] — stare wpisy (jobTitle/toRecruit) mapujemy do jednej pozycji
      const legacyJobTitle = typeof rec.jobTitle === 'string' ? rec.jobTitle : undefined;
      const positions = Object.keys(positionsRaw).length
        ? Object.entries(positionsRaw).map(([posId, p]) => ({
            id: posId,
            jobTitle: p.jobTitle ?? '',
            toRecruit: Number(p.toRecruit) || 0,
            potrzeby: p.potrzeby !== undefined ? Number(p.potrzeby) : undefined,
          }))
        : legacyJobTitle
          ? [{ id: 'legacy', jobTitle: legacyJobTitle, toRecruit: Number(rec.toRecruit) || 0, potrzeby: undefined }]
          : [];
      return {
        id: key,
        department: (rec.department as string) ?? '',
        positions,
        arrivals: Object.entries(arrivalsRaw)
          .filter(([, a]) => !!a.date)
          .map(([arrId, a]) => ({ id: arrId, date: a.date as string, count: Number(a.count) || 0 })),
      };
    });

    const planowanePrzyjeciaRaw = planowanePrzyjeciaSnap.val() ?? {};
    const planowanePrzyjecia: Record<string, { id: string; department: string; jobTitle: string; date: string; count: number }> = {};
    Object.entries(planowanePrzyjeciaRaw).forEach(([id, val]) => {
      const p = val as any;
      if (p.date && p.department && p.jobTitle) {
        planowanePrzyjecia[id] = {
          id,
          department: p.department,
          jobTitle: p.jobTitle,
          date: p.date,
          count: Number(p.count) || 0
        };
      }
    });

    const data: HarmonogramData = {
      employees,
      absences: absences as HarmonogramData['absences'],
      recruitments,
      potrzebyByManager,
      planowanePrzyjecia,
    };

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('public/harmonogram error:', error);
    return NextResponse.json({ error: 'Błąd pobierania danych.' }, { status: 500 });
  }
}
