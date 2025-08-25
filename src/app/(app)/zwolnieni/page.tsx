'use client';

import { PageHeader } from '@/components/page-header';

export default function TerminatedEmployeesPage() {
  return (
    <div>
      <PageHeader 
        title="Pracownicy zwolnieni"
        description="Przeglądaj listę pracowników, którzy zakończyli pracę."
      />
      <div className="text-center text-muted-foreground py-10">
        Funkcjonalność w trakcie budowy.
      </div>
    </div>
  );
}
