import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp, adminStorage } from '@/lib/firebase-admin';
import crypto from 'crypto';

const BUCKET_NAME = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'kadry-online-4h3x9.firebasestorage.app';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const empId = (formData.get('empId') as string | null) || `temp_${Date.now()}`;

        if (!file) {
            return NextResponse.json({ error: 'Brak pliku.' }, { status: 400 });
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json({ error: 'Plik jest za duży (max 5 MB).' }, { status: 400 });
        }

        const safeEmpId = empId.replace(/[^a-zA-Z0-9_-]/g, '_');
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
        const filePath = `certificates/${safeEmpId}.${ext}`;
        const downloadToken = crypto.randomUUID();
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        getAdminApp();
        const bucket = adminStorage().bucket(BUCKET_NAME);
        const storageFile = bucket.file(filePath);

        await storageFile.save(buffer, {
            resumable: false,
            metadata: {
                contentType: file.type || 'application/octet-stream',
                metadata: {
                    firebaseStorageDownloadTokens: downloadToken,
                },
            },
        });

        const encodedPath = encodeURIComponent(filePath);
        const url = `https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/${encodedPath}?alt=media&token=${downloadToken}`;

        return NextResponse.json({ url, filePath });
    } catch (error: any) {
        console.error('Certificate API upload error:', error);
        return NextResponse.json(
            { error: error?.message || 'Nie udało się przesłać pliku.' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { url, empId } = await req.json();
        getAdminApp();
        const bucket = adminStorage().bucket(BUCKET_NAME);

        if (url && typeof url === 'string') {
            const match = url.match(/\/o\/([^?]+)/);
            if (match?.[1]) {
                const filePath = decodeURIComponent(match[1]);
                if (filePath.startsWith('certificates/')) {
                    await bucket.file(filePath).delete({ ignoreNotFound: true });
                }
            }
        } else if (empId) {
            const safeEmpId = String(empId).replace(/[^a-zA-Z0-9_-]/g, '_');
            const [files] = await bucket.getFiles({ prefix: `certificates/${safeEmpId}.` });
            await Promise.all(files.map(f => f.delete({ ignoreNotFound: true })));
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Certificate API delete error:', error);
        return NextResponse.json({ error: error?.message || 'Błąd usuwania.' }, { status: 500 });
    }
}
