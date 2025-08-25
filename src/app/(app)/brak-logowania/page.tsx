'use client';

import { PageHeader } from '@/components/page-header';

export default function NoLoginPage() {
  return (
    <div>
      <PageHeader 
        title="Brak logowania"
        description="Generuj raporty dotyczące braku logowania przez pracowników."
      />
      <div className="text-center text-muted-foreground py-10">
        Funkcjonalność w trakcie budowy.
      </div>
    </div>
  );
}
