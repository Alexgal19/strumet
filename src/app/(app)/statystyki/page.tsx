'use client';

import { PageHeader } from '@/components/page-header';

export default function StatisticsPage() {
  return (
    <div>
      <PageHeader 
        title="Statystyki"
        description="Analizuj dane dotyczące pracowników."
      />
      <div className="text-center text-muted-foreground py-10">
        Funkcjonalność w trakcie budowy.
      </div>
    </div>
  );
}
