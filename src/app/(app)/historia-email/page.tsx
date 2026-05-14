'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppContext } from '@/context/app-context';
import type { EmailLog } from '@/lib/types';

const STATUS_LABELS = {
  sent: 'Wysłano',
  failed: 'Błąd',
};

export default function EmailHistoryPage() {
  const { emailLogs } = useAppContext();
  const [filter, setFilter] = useState<string>('all');

  const filteredLogs = filter === 'all'
    ? emailLogs
    : emailLogs.filter(log => log.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Historia email</h1>
        <p className="text-muted-foreground mt-1">
          Wszystkie wysłane wiadomości email.
        </p>
      </div>

      <div className="flex gap-4 items-center">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtruj status..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            <SelectItem value="sent">Wysłane</SelectItem>
            <SelectItem value="failed">Błędne</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          Razem: {emailLogs.length} wiadomości
        </span>
      </div>

      {filteredLogs.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Brak wiadomości w historii.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map(log => (
            <Card key={log.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                      {STATUS_LABELS[log.status]}
                    </Badge>
                    <span className="font-medium">{log.templateName}</span>
                  </div>
                  <p className="text-sm">
                    <strong>Do:</strong> {log.employeeFullName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {log.recipientEmail}
                  </p>
                  {log.errorMessage && (
                    <p className="text-sm text-destructive mt-1">
                      Błąd: {log.errorMessage}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(log.sentAt), 'dd.MM.yyyy HH:mm', { locale: pl })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(log.sentAt), { addSuffix: true, locale: pl })}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}