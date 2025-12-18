
import { NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    getAdminApp(); // Ensure admin app is initialized

    const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
      throw new Error("FIREBASE_STORAGE_BUCKET environment variable is not set.");
    }
    
    const bucket = admin.storage().bucket(bucketName);
    const [files] = await bucket.getFiles({ prefix: 'archives/' });

    const fileNames = files
      .map(file => file.name.replace('archives/', ''))
      .filter(name => name.length > 0 && name.endsWith('.xlsx'));
      
    return NextResponse.json({ success: true, files: fileNames });

  } catch (error: any) {
    console.error('API Error (archives/list):', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An unknown server error occurred.' },
      { status: 500 }
    );
  }
}
