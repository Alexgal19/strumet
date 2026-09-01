'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AuditEntry } from '@/lib/types';
import { getFirebaseServices } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { History } from 'lucide-react';

const ACTION_VARIANTS: Record<string, string> = {
  'Dodanie pracownika': 'default',
  'Aktualizacja pracownika': 'secondary',
  'Zwolnienie pracownika': 'destructive',
  'Trwałe usunięcie pracownika': 'destructive',
  'Przywrócenie pracownika': 'default',
  'Oznaczono nieobecność': 'secondary',
  'Cofnięto nieobecność': 'outline',
};

export function AuditLogList() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const services = getFirebaseServices();
    if (!services?.db) return;
    const auditQuery = query(
      ref(services.db, 'auditLog'),
      orderByChild('at'),
      limitToLast(150)
    );
    const unsubscribe = onValue(auditQuery, (snapshot) => {
      const list: AuditEntry[] = [];
      snapshot.forEach((child) => {
        const val = child.val();
        list.push({ id: child.key ?? '', at: val.at, user: val.user, action: val.action, details: val.details });
      });
      setEntries(list.reverse());
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Historia zmian</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Ostatnie {entries.length} zdarzeń — kto, kiedy i co zmienił.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Ładowanie...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Brak zapisanych zmian — historia zbiera się od teraz.
          </p>
        ) : (
          <ScrollArea className="h-[480px] pr-3">
            <div className="space-y-1.5">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border px-3 py-2 text-sm"
                >
                  <span className="text-xs text-muted-foreground w-32 shrink-0">
                    {format(new Date(entry.at), 'dd.MM.yyyy HH:mm', { locale: pl })}
                  </span>
                  <Badge
                    variant={ACTION_VARIANTS[entry.action] === 'destructive' ? 'destructive' : 'secondary'}
                    className="shrink-0"
                  >
                    {entry.action}
                  </Badge>
                  <span className="font-medium truncate min-w-0">{entry.details}</span>
                  <span className="ml-auto text-xs text-muted-foreground shrink-0">{entry.user}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
