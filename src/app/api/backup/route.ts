import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { getAdminApp, adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

async function verifyAdmin(request: Request): Promise<string | null> {
  const header = request.headers.get('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const app = getAdminApp();
    const decoded = await admin.auth(app).verifyIdToken(token);
    const roleSnapshot = await adminDb().ref(`users/${decoded.uid}/role`).get();
    if (roleSnapshot.val() !== 'admin') return null;
    return decoded.uid;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const uid = await verifyAdmin(request);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const snapshot = await adminDb().ref('/').get();
  return NextResponse.json(snapshot.val() ?? {});
}

export async function POST(request: Request) {
  const uid = await verifyAdmin(request);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let data: unknown;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  await adminDb().ref('/').set(data);
  return NextResponse.json({ success: true });
}
