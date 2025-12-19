import { NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';
import type { App } from 'firebase-admin/app';

export const dynamic = 'force-dynamic';

async function getFirebaseConfig(adminApp: App) {
    const apps = await adminApp.projectManagement().listFirebaseApps();
    const webApp = apps.find(app => app.platform === 'WEB');
    if (!webApp) {
        throw new Error("No web app found in this Firebase project.");
    }
    const config = await webApp.getConfig();
    return config;
}

export async function GET() {
  try {
    const adminApp = getAdminApp();
    const firebaseConfig = await getFirebaseConfig(adminApp);
    
    return NextResponse.json({ success: true, config: firebaseConfig });
  } catch (error: any) {
    console.error('API Error (firebase-config):', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An unknown server error occurred.' },
      { status: 500 }
    );
  }
}
