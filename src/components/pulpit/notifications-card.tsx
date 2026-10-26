'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { AppNotification } from '@/lib/types';
import { ExpandableList } from './expandable-list';

type NotificationsCardProps = {
  recentNotifications: AppNotification[];
  unreadCount: number;
};

export function NotificationsCard({ recentNotifications, unreadCount }: NotificationsCardProps) {
  return (
    <Card className="glass-card lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Powiadomienia</CardTitle>
          {unreadCount > 0 && (
            <Badge
              variant="default"
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {unreadCount} nowych
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {recentNotifications.length > 0 ? (
          <>
            <div className="hidden lg:block">
              <ScrollArea className="h-[280px]">
                <div className="space-y-3 pr-4">
                  {recentNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-xl border transition-colors',
                        !notif.read
                          ? 'bg-primary/5 border-primary/20'
                          : 'bg-card/50 border-border/50'
                      )}
                    >
                      {!notif.read && (
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">
                          {notif.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notif.message}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1.5">
                          {format(new Date(notif.createdAt), 'dd.MM.yyyy HH:mm', {
                            locale: pl,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="lg:hidden">
              <ExpandableList
                items={recentNotifications}
                renderItem={(notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-xl border transition-colors',
                      !notif.read
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-card/50 border-border/50'
                    )}
                  >
                    {!notif.read && (
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">
                        {notif.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notif.message}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1.5">
                        {format(new Date(notif.createdAt), 'dd.MM.yyyy HH:mm', {
                          locale: pl,
                        })}
                      </p>
                    </div>
                  </div>
                )}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Bell className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Brak nowych powiadomień.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
