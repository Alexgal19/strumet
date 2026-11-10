'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, CalendarClock, ArrowRight, BarChart3, Settings } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

type QuickLinksCardProps = {
  isAdmin: boolean;
};

export function QuickLinksCard({ isAdmin }: QuickLinksCardProps) {
  const { t } = useI18n();
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-base">{t('dashboard.quickLinks')}</CardTitle>
        <CardDescription>
          {t('dashboard.quickLinksDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <QuickLink
          href="/aktywni"
          icon={<Users className="h-4 w-4" />}
          label={t('nav.aktywni')}
        />
        <QuickLink
          href="/statystyki"
          icon={<BarChart3 className="h-4 w-4" />}
          label={t('nav.statystyki')}
        />
        <QuickLink
          href="/harmonogram"
          icon={<CalendarClock className="h-4 w-4" />}
          label={t('dashboard.planning')}
        />
        {isAdmin && (
          <QuickLink
            href="/konfiguracja"
            icon={<Settings className="h-4 w-4" />}
            label={t('nav.konfiguracja')}
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
