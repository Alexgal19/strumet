import { NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';
import { getTodayYmd, validatePrzyjecie } from '@/lib/przyjecia-validation';

export const dynamic = 'force-dynamic';

/**
 * Publiczny zapis planowanego przyjęcia (dla Gości bez logowania).
 * Zapis odbywa się przez Admin SDK, więc reguły RTDB nie muszą być luzowane.
 * Walidacja: dział/stanowisko z list konfiguracyjnych, data >= dziś (Europe/Warsaw), liczba 1..50.
 */

// Prosty limit zapytań (pamięć procesu — na instancję App Hosting).
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const hits = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now >= entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

function configNames(val: unknown): string[] {
  if (!val || typeof val !== 'object') return [];
  return Object.values(val as Record<string, unknown>)
    .map(v => (v as { name?: unknown }).name)
    .filter((n): n is string => typeof n === 'string' && n.trim().length > 0);
}

export async function POST(req: Request) {
  if (isRateLimited(getClientIp(req))) {
    return NextResponse.json(
      { error: 'Zbyt wiele prób. Spróbuj ponownie później.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowe dane.' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Nieprawidłowe dane.' }, { status: 400 });
  }

  try {
    const db = getAdminApp().database();
    const [deptSnap, jobSnap] = await Promise.all([
      db.ref('config/departments').once('value'),
      db.ref('config/jobTitles').once('value'),
    ]);

    const result = validatePrzyjecie(
      body as { department: unknown; jobTitle: unknown; date: unknown; count: unknown },
      configNames(deptSnap.val()),
      configNames(jobSnap.val()),
      getTodayYmd()
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const record = {
      department: result.value.department,
      jobTitle: result.value.jobTitle,
      date: result.value.date,
      count: result.value.count,
      createdBy: 'guest',
      createdAt: new Date().toISOString(),
    };
    const newRef = db.ref('planowanePrzyjecia').push();
    await newRef.set(record);

    // Audyt — best effort, nie blokuje odpowiedzi.
    try {
      await db.ref('auditLog').push().set({
        at: new Date().toISOString(),
        user: 'gość (publiczny)',
        action: 'Dodano planowane przyjęcie',
        details: `${record.department} / ${record.jobTitle} — ${record.date} — ${record.count} os.`,
      });
    } catch (auditError) {
      console.error('public/przyjecia audit error:', auditError);
    }

    return NextResponse.json({ id: newRef.key, ...record }, { status: 201 });
  } catch (error) {
    console.error('public/przyjecia error:', error);
    return NextResponse.json({ error: 'Błąd zapisywania. Spróbuj ponownie.' }, { status: 500 });
  }
}
