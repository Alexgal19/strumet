import { NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';
import { commentKey, validateKomentarz } from '@/lib/komentarze-validation';

export const dynamic = 'force-dynamic';

/**
 * Publiczny zapis komentarza do bloku stanowiska (Gość i admin).
 * Jeden komentarz na stanowisko; pusty tekst = usunięcie.
 * Zapis przez Admin SDK — reguły RTDB zostają szczelne (zapis tylko dla admina).
 */

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

    const result = validateKomentarz(
      body as { department: unknown; jobTitle: unknown; text: unknown },
      configNames(deptSnap.val()),
      configNames(jobSnap.val())
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const key = commentKey(result.value.department, result.value.jobTitle);    const nodeRef = db.ref(`komentarzeZapotrzebowania/${key}`);

    if (result.value.text === '') {
      await nodeRef.remove();
    } else {
      await nodeRef.set({
        text: result.value.text,
        author: 'Gość',
        updatedAt: new Date().toISOString(),
      });
    }

    try {
      await db.ref('auditLog').push().set({
        at: new Date().toISOString(),
        user: 'gość (publiczny)',
        action: result.value.text === '' ? 'Usunięto komentarz' : 'Dodano/edytowano komentarz',
        details: `${result.value.department} / ${result.value.jobTitle}`,
      });
    } catch (auditError) {
      console.error('public/komentarze audit error:', auditError);
    }

    return NextResponse.json({ key, removed: result.value.text === '' });
  } catch (error) {
    console.error('public/komentarze error:', error);
    return NextResponse.json({ error: 'Błąd zapisywania. Spróbuj ponownie.' }, { status: 500 });
  }
}
