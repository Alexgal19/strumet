'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-context';
import { useEmployees } from '@/hooks/use-employees';
import type { Employee } from '@/lib/types';
import { getDB } from '@/lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import { Save, RotateCcw, Lock, Search } from 'lucide-react';
import type { LockerPosition } from '@/components/szafki/locker-types';
import { ALL_ZONES } from '@/components/szafki/locker-data';
import { ZoneView } from '@/components/szafki/zone-view';

export default function LockersPage() {
  const { isAdmin } = useAppContext();
  const { employees } = useEmployees();
  const { toast } = useToast();
  const [labels, setLabels] = useState<Record<string, string>>({});
  const initialLabelsRef = React.useRef<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [highlightQuery, setHighlightQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Collect all locker positions to trace default and customized labels
  const allLockers = useMemo(() => {
    const list: LockerPosition[] = [];
    ALL_ZONES.forEach((zone) => {
      zone.sections.forEach((section) => {
        section.lockers.forEach((locker) => {
          list.push(locker);
        });
      });
    });
    return list;
  }, []);

  // Build occupied lockers set and map from ACTIVE employees only
  // Terminated employees' lockers are considered free to avoid conflicts
  const occupied = new Set<string>();
  const byMap: Record<string, string> = {};
  employees
    .filter((emp: Employee) => emp.status === 'aktywny')
    .forEach((emp: Employee) => {
      const locker = emp.lockerNumber?.trim();
      const deptLocker = emp.departmentLockerNumber?.trim();
      if (locker) {
        occupied.add(locker);
        byMap[locker] = emp.fullName;
      }
      if (deptLocker) {
        occupied.add(deptLocker);
        byMap[deptLocker] = emp.fullName;
      }
    });
  const occupiedLockers = occupied;
  const occupiedByMap = byMap;

  // Load from Firebase
  useEffect(() => {
    const db = getDB();
    if (!db) return;
    const labelsRef = ref(db, 'config/lockerLabels');
    const unsub = onValue(labelsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setLabels(data);
      initialLabelsRef.current = data;
    });
    return () => unsub();
  }, []);

  const handleChange = useCallback((id: string, val: string) => {
    setLabels((prev) => {
      if (prev[id] === val) return prev;
      return { ...prev, [id]: val };
    });
    setHasChanges(true);
  }, []);

  const handleSave = async () => {
    const db = getDB();
    if (!db) return;
    setIsSaving(true);
    try {
      const initialLabels = initialLabelsRef.current;
      const employeeUpdates: Record<string, any> = {};

      allLockers.forEach((locker) => {
        const oldLabel = initialLabels[locker.id] ?? locker.defaultLabel;
        const newLabel = labels[locker.id] ?? locker.defaultLabel;

        if (oldLabel !== newLabel) {
          // Update only ACTIVE employees matching the old label
          // Terminated employees' locker assignments should NOT be updated
          employees
            .filter((emp: Employee) => emp.status === 'aktywny')
            .forEach((emp: Employee) => {
              if (emp.id) {
                if (emp.lockerNumber === oldLabel) {
                  employeeUpdates[`employees/${emp.id}/lockerNumber`] = newLabel;
                }
                if (emp.departmentLockerNumber === oldLabel) {
                  employeeUpdates[`employees/${emp.id}/departmentLockerNumber`] = newLabel;
                }
              }
            });
        }
      });

      const dbUpdates = {
        'config/lockerLabels': labels,
        ...employeeUpdates,
      };

      await update(ref(db), dbUpdates);

      toast({
        title: 'Zapisano',
        description: 'Numeracja szafek oraz przypisania pracowników zostały zaktualizowane.',
      });
      setHasChanges(false);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Błąd',
        description: 'Nie udało się zapisać zmian.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    // Potwierdzenie przez AlertDialog — window.confirm nie pasuje do UI (blokuje wątek, brak dark-mode)
    setLabels({});
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Szafki pracowników"
        description="Mapa szafek z możliwością edycji numeracji"
      >
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isSaving}
                  >
                    <RotateCcw className="mr-1.5 h-4 w-4" />
                    Reset
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Przywrócić domyślną numerację?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Wszystkie zmiany numeracji zostaną cofnięte do wartości domyślnych. Pamiętaj o zapisaniu.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Anuluj</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset}>Przywróć</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
              >
                <Save className="mr-1.5 h-4 w-4" />
                {isSaving ? 'Zapisywanie...' : 'Zapisz'}
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Szukaj szafki (np. 77, K15)..."
          value={highlightQuery}
          onChange={(e) => setHighlightQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {!isAdmin && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          <Lock className="h-4 w-4" />
          Tylko administrator może edytować numerację szafek.
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm border border-green-500 bg-green-500/20" />
          <span>Zajęta (przypisana do pracownika)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm border border-border/60 bg-muted/40" />
          <span>Wolna</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm border border-primary bg-primary/20" />
          <span>Wyszukana</span>
        </div>
      </div>

      <Tabs defaultValue="zone1" className="w-full">
        <TabsList className="mb-4 w-full flex-wrap sm:flex-nowrap justify-start h-auto gap-1">
          <TabsTrigger value="zone1" className="flex-1 sm:flex-initial text-xs sm:text-sm">Strefa 1 (1-140)</TabsTrigger>
          <TabsTrigger value="zone2-f1" className="flex-1 sm:flex-initial text-xs sm:text-sm">Strefa 2 — Piętro 1 (K1-K120)</TabsTrigger>
          <TabsTrigger value="zone2-f2" className="flex-1 sm:flex-initial text-xs sm:text-sm">Strefa 2 — Piętro 2 (K121-K240)</TabsTrigger>
        </TabsList>

        {ALL_ZONES.map((zone) => (
          <TabsContent key={zone.id} value={zone.id}>
            <Card>
              <CardHeader>
                <CardTitle>{zone.name}</CardTitle>
                <CardDescription>
                  Kliknij na szafkę, aby {isAdmin ? 'edytować jej numer' : 'zaznaczyć'}.
                  {highlightQuery && (
                    <span className="ml-1 text-primary font-medium">
                      Wyniki wyszukiwania dla &quot;{highlightQuery}&quot;
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <ZoneView
                  zone={zone}
                  labels={labels}
                  editingId={editingId}
                  highlightQuery={highlightQuery}
                  occupiedLockers={occupiedLockers}
                  occupiedByMap={occupiedByMap}
                  onEdit={(id) => {
                    if (!isAdmin) return;
                    setEditingId(id);
                  }}
                  onChange={handleChange}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
