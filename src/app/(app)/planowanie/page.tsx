'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Loader2, Download } from 'lucide-react';
import { isWithinInterval, startOfDay, endOfDay, addDays, format } from 'date-fns';
import { useAppContext } from '@/context/app-context';
import { useEmployees } from '@/hooks/use-employees';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { parseMaybeDate } from '@/lib/date';
import { EmployeeCard, ContractCard, FingerprintCard } from '@/components/planning-cards';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HarmonogramView } from '@/components/harmonogram-view';
import type { HarmonogramData } from '@/lib/harmonogram';

export default function PlanowaniePage() {
  const { isLoading: isAuthLoading } = useAppContext();
  if (isAuthLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  // /planowanie zawsze otwiera harmonogram obsady — dla gości i zalogowanych
  return <PublicPlanowanieView />;
}

/** Widok publiczny (bez logowania): tylko do odczytu â€” zapotrzebowania + harmonogram */
function PublicPlanowanieView() {
  const [data, setData] = useState<HarmonogramData | null>(null);
  const [error, setError] = useState(false);
  const [view, setView] = useState<'harmonogram' | 'zapotrzebowania'>('harmonogram');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/public/harmonogram')
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

  return (
    <div className="h-full flex flex-col">
      {error ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Nie udaĹ‚o siÄ™ pobraÄ‡ danych harmonogramu.
        </div>
      ) : !data ? (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <PageHeader
            title="Rekrutacja"
            description="Zaplanuj, ile osĂłb trzeba zrekrutowaÄ‡ do kaĹĽdego dziaĹ‚u i kiedy majÄ… przyjĹ›Ä‡."
          />

          <div className="flex flex-col gap-4 overflow-y-auto pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex overflow-hidden rounded-lg border border-border">
                <Button
                  type="button"
                  size="sm"
                  variant={view === 'harmonogram' ? 'default' : 'ghost'}
                  className="rounded-none border-0"
                  onClick={() => setView('harmonogram')}
                >
                  Harmonogram obsady
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={view === 'zapotrzebowania' ? 'default' : 'ghost'}
                  className="rounded-none border-0"
                  onClick={() => setView('zapotrzebowania')}
                >
                  Zapotrzebowania
                </Button>
              </div>
            </div>

            {view === 'harmonogram' ? (
              <HarmonogramView data={data} showExport />
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {[...data.recruitments]
                  .sort((a, b) => a.department.localeCompare(b.department, 'pl'))
                  .map(order => {
                    const sumRekrut = order.positions.reduce(
                      (s, p) => s + (Number(p.toRecruit) || 0),
                      0
                    );
                    const planned = order.arrivals.reduce(
                      (s, a) => s + (Number(a.count) || 0),
                      0
                    );
                    return (
                      <Card key={order.department}>
                        <CardHeader className="pb-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <CardTitle className="text-base">{order.department}</CardTitle>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="tabular-nums">
                                Rekrutacja: {sumRekrut} os.
                              </Badge>
                              {planned > 0 && (
                                <Badge
                                  variant="outline"
                                  className="border-emerald-500/60 text-emerald-700 tabular-nums dark:text-emerald-400"
                                >
                                  PrzyjÄ™cia: {planned}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground">
                              Stanowiska i liczba osĂłb:
                            </p>
                            {order.positions.map(p => (
                              <div
                                key={p.jobTitle}
                                className="flex items-center justify-between gap-2 rounded-md border bg-background/50 px-3 py-2 text-sm"
                              >
                                <span>{p.jobTitle}</span>
                                <span className="tabular-nums font-medium">
                                  {Number(p.toRecruit) || 0} os.
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground">
                              Planowane przyjÄ™cia ({planned} os.):
                            </p>
                            {order.arrivals.length === 0 ? (
                              <p className="rounded-md border border-dashed px-3 py-3 text-center text-xs text-muted-foreground">
                                Brak zaplanowanych dat przyjÄ™Ä‡.
                              </p>
                            ) : (
                              [...order.arrivals]
                                .sort((a, b) => a.date.localeCompare(b.date))
                                .map((a, i) => (
                                  <div
                                    key={`${a.date}-${i}`}
                                    className="flex items-center justify-between gap-2 rounded-md border bg-background/50 px-3 py-2 text-sm"
                                  >
                                    <span>{format(new Date(a.date), 'dd.MM.yyyy')}</span>
                                    <span className="tabular-nums font-medium">
                                      {Number(a.count) || 0} os.
                                    </span>
                                  </div>
                                ))
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}




