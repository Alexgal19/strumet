'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/app-context';
import { HarmonogramView } from '@/components/harmonogram-view';
import { InstallAppButton } from '@/components/install-app-button';
import { type HarmonogramData, getPotrzebyKey } from '@/lib/harmonogram';
import { getDB } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { ref as dbRef, update } from 'firebase/database';
import { splitArrivals } from '@/lib/przyjecia-historia';
import { PublicZapotrzebowaniaView } from './public-zapotrzebowania-view';
import { HistoriaPrzyjec } from './historia-przyjec';

/** Widok publiczny (bez logowania): tylko do odczytu — zapotrzebowania + harmonogram */
export function PublicPlanowanieView() {
  const [data, setData] = useState<HarmonogramData | null>(null);
  const [error, setError] = useState(false);
  const [view, setView] = useState<'harmonogram' | 'zapotrzebowania' | 'historia'>('harmonogram');
  const { isAdmin } = useAppContext();
  const { toast } = useToast();
  const [onlyShortages, setOnlyShortages] = useState(false);

  // Deep link z Pulpitu: /harmonogram?braki=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setOnlyShortages(params.get('braki') === '1');
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/public/harmonogram', { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then(json => {
        if (!cancelled) setData(json as HarmonogramData);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Zwraca true tylko po udanym zapisie; przy błędzie cofa wartość w widoku i pokazuje komunikat. */
  const handleUpdatePotrzeby = async (dept: string, mgr: string, job: string, newAmount: number): Promise<boolean> => {
    if (!isAdmin) return false;
    const key = getPotrzebyKey(dept, mgr, job);
    const previous = data?.potrzebyByManager?.[key];
    const setLocal = (value: number | undefined) =>
      setData(prev => {
        if (!prev) return prev;
        const next = { ...prev.potrzebyByManager };
        if (value === undefined) delete next[key];
        else next[key] = value;
        return { ...prev, potrzebyByManager: next };
      });
    setLocal(newAmount);
    try {
      const db = getDB();
      if (!db) throw new Error('Brak połączenia z bazą.');
      await update(dbRef(db, 'potrzebyObsady'), { [key]: newAmount });
      return true;
    } catch (err) {
      console.error('Failed to update potrzeby:', err);
      setLocal(previous);
      toast({ variant: 'destructive', title: 'Nie zapisano potrzeb', description: 'Spróbuj ponownie.' });
      return false;
    }
  };

  return (
    <div className="flex flex-col md:h-full">
      {error ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Nie udało się pobrać danych harmonogramu.
        </div>
      ) : !data ? (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <PageHeader
            title="Obsada"
            description="Sprawdź obsadę i zapotrzebowanie według działu."
          />

          <div className="flex flex-col gap-4 pb-6 md:overflow-y-auto">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex w-full sm:w-auto overflow-hidden rounded-lg border border-border">
                <Button
                  type="button"
                  size="sm"
                  variant={view === 'harmonogram' ? 'default' : 'ghost'}
                  className="min-h-12 rounded-none border-0 flex-1 sm:min-h-9 sm:flex-initial"
                  onClick={() => setView('harmonogram')}
                >
                  Harmonogram obsady
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={view === 'zapotrzebowania' ? 'default' : 'ghost'}
                  className="min-h-12 rounded-none border-0 flex-1 sm:min-h-9 sm:flex-initial"
                  onClick={() => setView('zapotrzebowania')}
                >
                  Zapotrzebowania
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={view === 'historia' ? 'default' : 'ghost'}
                  className="min-h-12 rounded-none border-0 flex-1 sm:min-h-9 sm:flex-initial"
                  onClick={() => setView('historia')}
                >
                  Historia{(() => {
                    const n = splitArrivals(Object.values(data.planowanePrzyjecia || {}), format(new Date(), 'yyyy-MM-dd')).past.length;
                    return n > 0 ? ` (${n})` : '';
                  })()}
                </Button>
              </div>
              <InstallAppButton className="w-full sm:ml-auto sm:w-auto" />
            </div>

            {view === 'harmonogram' ? (
              <HarmonogramView
                data={data}
                showExport
                isAdmin={isAdmin}
                onUpdatePotrzeby={handleUpdatePotrzeby}
                onlyShortages={onlyShortages}
              />
            ) : view === 'zapotrzebowania' ? (
              <PublicZapotrzebowaniaView data={data} setData={setData} onUpdatePotrzeby={handleUpdatePotrzeby} />
            ) : (
              <HistoriaPrzyjec data={data} setData={setData} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
