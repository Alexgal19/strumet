'use client';

import { PageHeader } from '@/components/page-header';

export default function FingerprintAppointmentsPage() {
  return (
    <div>
      <PageHeader 
        title="Terminy na odciski palców"
        description="Zarządzaj terminami na pobranie odcisków palców."
      />
      <div className="text-center text-muted-foreground py-10">
        Funkcjonalność w trakcie budowy.
      </div>
    </div>
  );
}
