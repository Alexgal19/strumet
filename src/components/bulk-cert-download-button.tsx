'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useToast } from '@/hooks/use-toast';
import type { Employee } from '@/lib/types';

interface BulkCertDownloadButtonProps {
    employees: Employee[];
    className?: string;
}

export function BulkCertDownloadButton({ employees, className }: BulkCertDownloadButtonProps) {
    const [isDownloading, setIsDownloading] = useState(false);
    const { toast } = useToast();

    const handleDownload = async () => {
        const certEmployees = employees.filter(e => e.certificateUrl);
        if (certEmployees.length === 0) {
            toast({ title: 'Brak certyfikatów', description: 'Żaden z pracowników na tej liście nie ma dodanego skanu certyfikatu.' });
            return;
        }

        setIsDownloading(true);
        toast({ title: 'Rozpoczęto pobieranie', description: `Przygotowuję ${certEmployees.length} plików...` });
        
        try {
            const zip = new JSZip();
            const folder = zip.folder('Certyfikaty_Spawaczy');
            if (!folder) throw new Error('Nie udało się utworzyć folderu w ZIP');

            for (const emp of certEmployees) {
                if (!emp.certificateUrl) continue;
                try {
                    const res = await fetch(emp.certificateUrl);
                    const blob = await res.blob();
                    const name = emp.fullName.trim().replace(/\s+/g, '_');
                    const ext = emp.certificateUrl.split('?')[0].split('.').pop() || 'jpg';
                    folder.file(`Certyfikat_${name}.${ext}`, blob);
                } catch (e) {
                    console.error(`Nie udało się pobrać certyfikatu dla ${emp.fullName}`, e);
                }
            }

            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, 'Certyfikaty_Spawaczy.zip');
            toast({ title: 'Gotowe!', description: 'Archiwum ZIP zostało pobrane.' });
        } catch (error) {
            console.error('ZIP error:', error);
            toast({ variant: 'destructive', title: 'Błąd', description: 'Wystąpił błąd podczas tworzenia pliku ZIP.' });
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <Button onClick={handleDownload} disabled={isDownloading} className={className} variant="outline" size="sm">
            {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Pobierz certyfikaty
        </Button>
    );
}
