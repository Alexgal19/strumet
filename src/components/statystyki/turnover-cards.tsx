'use client';

import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type TurnoverPeriod = {
  rate: string;
  totalTerminations: number;
  avgHeadcount: number;
  days: number;
};

export function TurnoverCards({
  monthly,
  quarterly,
}: {
  monthly: TurnoverPeriod | null;
  quarterly: TurnoverPeriod | null;
}) {
  if (!monthly && !quarterly) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {monthly && (
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Rotacja miesięczna</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{monthly.rate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {monthly.totalTerminations} zwolnień / średnio {monthly.avgHeadcount} prac. (ostatnie {monthly.days} dni)
            </p>
          </CardContent>
        </Card>
      )}
      {quarterly && (
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Rotacja kwartalna</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{quarterly.rate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {quarterly.totalTerminations} zwolnień / średnio {quarterly.avgHeadcount} prac. (ostatnie {quarterly.days} dni)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
