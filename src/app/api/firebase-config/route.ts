
import { NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';

export const dynamic = 'force-dynamic';

async function getFirebaseConfig(adminApp: App) {
    const apps = await admin.projectManagement(adminApp).listFirebaseApps();
    if (apps.length === 0) {
        throw new Error("No Firebase apps found in this project.");
    }
    // Assuming we want the config for the first web app found
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
    const config = await getFirebaseConfig(adminApp);
    
    return NextResponse.json({ success: true, config });

  } catch (error: any) {
    console.error('API Error (firebase-config):', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An unknown server error occurred.' },
      { status: 500 }
    );
  }
}
