'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, CalendarClock, ArrowRight, BarChart3, Settings } from 'lucide-react';

type QuickLinksCardProps = {
  isAdmin: boolean;
};

export function QuickLinksCard({ isAdmin }: QuickLinksCardProps) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-base">Szybkie linki</CardTitle>
        <CardDescription>
          Przejdź do najczęściej używanych sekcji.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <QuickLink
          href="/aktywni"
          icon={<Users className="h-4 w-4" />}
          label="Pracownicy aktywni"
        />
        <QuickLink
          href="/statystyki"
          icon={<BarChart3 className="h-4 w-4" />}
          label="Statystyki"
        />
        <QuickLink
          href="/harmonogram"
          icon={<CalendarClock className="h-4 w-4" />}
          label="Planowanie"
        />
        {isAdmin && (
          <QuickLink
            href="/konfiguracja"
            icon={<Settings className="h-4 w-4" />}
            label="Konfiguracja"
          />
        )}
      </CardContent>
    </Card>
  );
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link href={href} prefetch>
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 h-11 rounded-xl hover:bg-primary/5"
      >
        {icon}
        <span className="text-sm font-medium">{label}</span>
        <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
      </Button>
    </Link>
  );
}
