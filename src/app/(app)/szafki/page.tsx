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
import { ZoneView, getZoneRows } from '@/components/szafki/zone-view';
import { useI18n, type TranslationKey } from '@/lib/i18n';
import { EMPLOYEE_LOCKER_FIELDS, buildLockerOccupancy, normalizeLockerLabel } from '@/lib/lockers';

const ZONE_NAMES: Record<string, TranslationKey> = {
  zone1: 'lockers.zone1',
  'zone2-f1': 'lockers.zone2f1',
  'zone2-f2': 'lockers.zone2f2',
};

export default function LockersPage() {
  const { isAdmin } = useAppContext();
  const { t } = useI18n();
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

  // Zajętość liczona ze wszystkich szafek aktywnych pracowników (3 główne + działowa).
  // Szafki zwolnionych są wolne.
  const occupancy = useMemo(() => buildLockerOccupancy(employees), [employees]);
  const zoneRows = useMemo(() => ALL_ZONES.map((zone) => ({ zone, rows: getZoneRows(zone) })), []);

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
              if (!emp.id) return;
              EMPLOYEE_LOCKER_FIELDS.forEach((field) => {
                if (normalizeLockerLabel(emp[field]) === normalizeLockerLabel(oldLabel)) {
                  employeeUpdates[`employees/${emp.id}/${field}`] = newLabel;
                }
              });
            });
        }
      });

      const dbUpdates = {
        'config/lockerLabels': labels,
        ...employeeUpdates,
      };

      await update(ref(db), dbUpdates);

      toast({
        title: t('common.saved'),
        description: t('lockers.savedDesc'),
      });
      setHasChanges(false);
    } catch (err) {
      console.error(err);
      toast({
        title: t('common.error'),
        description: t('common.saveFailed'),
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
        title={t('lockers.title')}
        description={t('lockers.desc')}
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
                    {t('lockers.reset')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('lockers.resetTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('lockers.resetDesc')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset}>{t('common.restore')}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
              >
                <Save className="mr-1.5 h-4 w-4" />
                {isSaving ? t('common.saving') : t('common.save')}
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('lockers.searchPlaceholder')}
          value={highlightQuery}
          onChange={(e) => setHighlightQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {!isAdmin && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          <Lock className="h-4 w-4" />
          {t('lockers.adminOnly')}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm border border-green-500 bg-green-500/20" />
          <span>{t('lockers.legendTaken')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm border border-amber-500 bg-amber-500/20" />
          <span>{t('lockers.legendShared')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm border border-border/60 bg-muted/40" />
          <span>{t('lockers.legendFree')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm ring-2 ring-primary" />
          <span>{t('lockers.legendFound')}</span>
        </div>
      </div>

      <Tabs defaultValue="zone1" className="w-full">
        <TabsList className="mb-4 w-full flex-wrap sm:flex-nowrap justify-start h-auto gap-1">
          <TabsTrigger value="zone1" className="flex-1 sm:flex-initial text-xs sm:text-sm">{t('lockers.zone1Tab')}</TabsTrigger>
          <TabsTrigger value="zone2-f1" className="flex-1 sm:flex-initial text-xs sm:text-sm">{t('lockers.zone2f1Tab')}</TabsTrigger>
          <TabsTrigger value="zone2-f2" className="flex-1 sm:flex-initial text-xs sm:text-sm">{t('lockers.zone2f2Tab')}</TabsTrigger>
        </TabsList>

        {zoneRows.map(({ zone, rows }) => {
          const total = rows.reduce((sum, r) => sum + r.lockers.length, 0);
          const taken = rows.reduce(
            (sum, r) => sum + r.lockers.filter((l) => occupancy[normalizeLockerLabel(labels[l.id] ?? l.defaultLabel)]?.length).length,
            0
          );
          return (
            <TabsContent key={zone.id} value={zone.id}>
              <Card>
                <CardHeader>
                  <CardTitle>{ZONE_NAMES[zone.id] ? t(ZONE_NAMES[zone.id]) : zone.name}</CardTitle>
                  <CardDescription>
                    {t('lockers.zoneSummary', { taken, total, free: total - taken })}{' '}
                    {isAdmin ? t('lockers.hoverEditHint') : t('lockers.hoverHint')}
                    {highlightQuery && (
                      <span className="ml-1 text-primary font-medium">
                        {t('lockers.searchResults', { query: highlightQuery })}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ZoneView
                    rows={rows}
                    labels={labels}
                    editingId={editingId}
                    highlightQuery={highlightQuery}
                    occupancy={occupancy}
                    onEdit={(id) => {
                      if (!isAdmin) return;
                      setEditingId(id);
                    }}
                    onChange={handleChange}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
