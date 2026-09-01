'use client';

import React, { useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { getFirebaseServices } from '@/lib/firebase';
import { Database, Download, Upload, Loader2 } from 'lucide-react';

async function getAuthToken(): Promise<string | null> {
  const services = getFirebaseServices();
  const user = services?.auth?.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export function BackupCard() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreData, setRestoreData] = useState<Record<string, unknown> | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Brak uwierzytelnienia.');
      const response = await fetch('/api/backup', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Serwer odmówił dostępu.');
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `baza-st-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Kopia pobrana', description: 'Pełny zrzut bazy został zapisany jako JSON.' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: error instanceof Error ? error.message : 'Nie udało się pobrać kopii.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFilePick = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object') throw new Error('Nieprawidłowy format.');
      setRestoreData(parsed);
      setConfirmText('');
    } catch {
      toast({ variant: 'destructive', title: 'Błąd', description: 'Wybierz prawidłowy plik JSON kopii zapasowej.' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRestore = async () => {
    if (!restoreData) return;
    setIsRestoring(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Brak uwierzytelnienia.');
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(restoreData),
      });
      if (!response.ok) throw new Error('Serwer odmówił przywrócenia.');
      toast({ title: 'Przywrócono', description: 'Baza została nadpisana kopią zapasową. Odśwież stronę.' });
      setRestoreData(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: error instanceof Error ? error.message : 'Nie udało się przywrócić kopii.',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Kopia zapasowa bazy</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Pełny zrzut całej bazy (pracownicy, nieobecności, karty, ustawienia) w formacie JSON.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleExport} disabled={isExporting}>
          {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Pobierz kopię zapasową
        </Button>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isRestoring}>
          <Upload className="mr-2 h-4 w-4" />
          Przywróć z pliku...
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => handleFilePick(e.target.files?.[0] ?? null)}
        />
      </CardContent>

      <AlertDialog open={!!restoreData} onOpenChange={(open) => !open && setRestoreData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nadpisać całą bazę danych?</AlertDialogTitle>
            <AlertDialogDescription>
              Wszystkie obecne dane zostaną <strong>trwale zastąpione</strong> zawartością pliku kopii.
              Aby potwierdzić, wpisz <strong>PRZYWRÓĆ</strong> w pole poniżej.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="restore-confirm">Potwierdzenie</Label>
            <Input
              id="restore-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="PRZYWRÓĆ"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={confirmText !== 'PRZYWRÓĆ' || isRestoring}
              onClick={(e) => {
                e.preventDefault();
                handleRestore();
              }}
            >
              {isRestoring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Przywróć
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
