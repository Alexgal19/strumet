import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp, adminStorage } from '@/lib/firebase-admin';
import { certificatePathFromUrl } from '@/lib/certificate-url';

const BUCKET_NAME = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'kadry-online-4h3x9.firebasestorage.app';

const getBucket = () => {
    getAdminApp();
    return adminStorage().bucket(BUCKET_NAME);
};

/**
 * GET /api/certificates?path=certificates/xxx.jpg[&download=1&name=...]
 * Serwuje plik certyfikatu przez Admin SDK — niezależnie od tokenów pobierania
 * Firebase Storage (które zmieniają się przy każdym ponownym przesłaniu).
 */
export async function GET(req: NextRequest) {
    try {
        const params = req.nextUrl.searchParams;
        const rawPath = params.get('path') || certificatePathFromUrl(params.get('url'));
        if (!rawPath || !rawPath.startsWith('certificates/') || rawPath.includes('..')) {
            return NextResponse.json({ error: 'Nieprawidłowa ścieżka.' }, { status: 400 });
        }

        const file = getBucket().file(rawPath);
        const [exists] = await file.exists();
        if (!exists) {
            return NextResponse.json({ error: 'Plik nie istnieje.' }, { status: 404 });
        }

        const [[metadata], [buffer]] = await Promise.all([file.getMetadata(), file.download()]);
        const contentType = (metadata.contentType as string) || 'application/octet-stream';
        const fileName = params.get('name') || rawPath.split('/').pop() || 'certyfikat';
        const disposition = params.get('download') === '1' ? 'attachment' : 'inline';

        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Length': String(buffer.length),
                'Content-Disposition': `${disposition}; filename*=UTF-8''${encodeURIComponent(fileName)}`,
                'Cache-Control': 'private, no-store',
            },
        });
    } catch (error: any) {
        console.error('Certificate API get error:', error);
        return NextResponse.json({ error: error?.message || 'Nie udało się pobrać pliku.' }, { status: 500 });
    }
}

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
        const buffer = Buffer.from(await file.arrayBuffer());

        const bucket = getBucket();

        // Usuń stare pliki tego pracownika z innym rozszerzeniem (np. .jpg -> .pdf)
        const [oldFiles] = await bucket.getFiles({ prefix: `certificates/${safeEmpId}.` });
        await Promise.all(
            oldFiles.filter(f => f.name !== filePath).map(f => f.delete({ ignoreNotFound: true }))
        );

        await bucket.file(filePath).save(buffer, {
            resumable: false,
            metadata: { contentType: file.type || 'application/octet-stream' },
        });

        // Stały link przez nasze API (v= tylko omija cache przeglądarki po zmianie pliku)
        const url = `/api/certificates?path=${encodeURIComponent(filePath)}&v=${Date.now()}`;
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
        const bucket = getBucket();

        const filePath = certificatePathFromUrl(url);
        if (filePath && filePath.startsWith('certificates/') && !filePath.includes('..')) {
            await bucket.file(filePath).delete({ ignoreNotFound: true });
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
