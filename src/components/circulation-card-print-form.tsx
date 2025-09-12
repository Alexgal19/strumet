'use client';

import React from 'react';
import { Employee } from '@/lib/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface CirculationCardPrintFormProps {
  employee: Employee | null;
}

const InfoRow = ({ label, value }: { label: string, value: string | undefined }) => (
    <div>
        <p className="text-xs text-gray-600">{label}</p>
        <p className="font-semibold text-sm">{value || 'Brak danych'}</p>
    </div>
);

const ChecklistItem = ({ label }: { label: string }) => (
    <div className="flex items-center justify-between py-2 border-b">
        <span className="text-sm pr-4">{label}</span>
        <div className="flex items-center space-x-6 text-sm shrink-0">
            <span>TAK</span> <div className="w-4 h-4 border-2 border-black inline-block"></div>
            <span className="ml-4">NIE</span> <div className="w-4 h-4 border-2 border-black inline-block"></div>
        </div>
    </div>
);

const SignatureSection = ({ label }: { label: string }) => (
    <div className="pt-12">
        <div className="border-t-2 border-dotted border-black w-64 pt-1 text-xs text-center text-gray-500">
            {label}
        </div>
    </div>
);

export const CirculationCardPrintForm = React.forwardRef<HTMLDivElement, CirculationCardPrintFormProps>(
  ({ employee }, ref) => {
    
    if (!employee) {
        return <div ref={ref} className="hidden" />;
    }

    return (
      <div ref={ref} className="bg-white text-black font-sans">
        <style type="text/css" media="print">
          {`
            @page {
              size: A4;
              margin: 1.5cm;
            }
            body, html {
              background-color: white !important;
              font-family: Arial, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          `}
        </style>
        <div className="w-full">
            {/* Header */}
            <header className="text-center mb-6">
                <h1 className="text-lg font-bold tracking-wider">KARTA OBIEGOWA</h1>
                <p className="text-sm text-gray-500">Potwierdzenie rozliczenia pracownika</p>
            </header>

            {/* Employee Info */}
            <section className="border-t-2 border-b-2 border-black py-3 mb-6">
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    <InfoRow label="Pracownik" value={employee.fullName} />
                    <InfoRow label="Data zwolnienia" value={employee.terminationDate ? format(new Date(employee.terminationDate), 'd MMMM yyyy', { locale: pl }) : format(new Date(), 'd MMMM yyyy', { locale: pl })} />
                    <InfoRow label="Stanowisko" value={employee.jobTitle} />
                    <InfoRow label="Dział" value={employee.department} />
                </div>
            </section>
            
            {/* Main Content */}
            <main className="space-y-6">
                <h2 className="text-base font-bold mb-2">Rozliczenie z działami</h2>
                
                {/* Section Magazyn */}
                <div className="space-y-1">
                    <h3 className="font-semibold text-sm">Magazyn</h3>
                    <ChecklistItem label="Spodnie, bluza, buty, koszulka" />
                    <ChecklistItem label="Pas, zarękawnik, przyłbica, fartuch" />
                    <div className="flex justify-end pt-2"><SignatureSection label="Podpis pracownika Magazynu" /></div>
                </div>
                
                {/* Section IT */}
                <div className="space-y-1">
                    <h3 className="font-semibold text-sm">Dział IT</h3>
                    <ChecklistItem label="Zwrot karty RCP" />
                    <div className="flex justify-end pt-2"><SignatureSection label="Podpis pracownika Działu IT" /></div>
                </div>

                {/* Section Opiekun */}
                <div className="space-y-1">
                    <h3 className="font-semibold text-sm">Opiekun / Lider</h3>
                    <ChecklistItem label="Zwrot kluczy do szafek" />
                    <ChecklistItem label="Szlifierka, miarka, narzędzia" />
                    <div className="flex justify-end pt-2"><SignatureSection label="Podpis Opiekuna / Lidera" /></div>
                </div>
            </main>

            {/* Footer */}
            <footer className="flex justify-center pt-8">
                <SignatureSection label="Podpis pracownika" />
            </footer>
        </div>
      </div>
    );
  }
);

CirculationCardPrintForm.displayName = 'CirculationCardPrintForm';
