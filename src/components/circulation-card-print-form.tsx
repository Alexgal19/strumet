'use client';

import React from 'react';
import { Employee } from '@/lib/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CirculationCardPrintFormProps {
  employee: Employee | null;
}

const InfoRow = ({ label, value }: { label: string, value: string | undefined }) => (
    <div className="flex flex-col">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="font-semibold text-sm">{value || 'Brak danych'}</span>
    </div>
);

const ChecklistItem = ({ label }: { label:string }) => (
    <div className="flex items-center justify-between py-1 border-b border-gray-200">
        <span className="text-sm flex-grow pr-4">{label}</span>
        <div className="flex items-center space-x-2 text-xs shrink-0">
            <span>TAK</span>
            <div className="w-4 h-4 border-2 border-black"></div>
            <span className="ml-2">NIE</span>
            <div className="w-4 h-4 border-2 border-black"></div>
        </div>
    </div>
);

const SignatureSection = ({ label }: { label: string }) => (
    <div className="mt-2">
        <div className="border-t-2 border-dotted border-black w-56 pt-1 text-xs text-center text-gray-600">
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
            body {
              font-family: Arial, sans-serif;
              font-size: 10pt;
              background-color: white;
            }
          `}
        </style>
        <div className="p-[1.5cm] print:p-0">
            <header className="text-center mb-4">
                <h1 className="text-lg font-bold tracking-wider">KARTA OBIEGOWA</h1>
                <p className="text-xs text-gray-500">Potwierdzenie rozliczenia pracownika</p>
            </header>

            <section className="border-t border-b border-black py-2 mb-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <InfoRow label="Pracownik" value={employee.fullName} />
                    <InfoRow label="Data zwolnienia" value={employee.terminationDate ? format(new Date(employee.terminationDate), 'd MMMM yyyy', { locale: pl }) : format(new Date(), 'd MMMM yyyy', { locale: pl })} />
                    <InfoRow label="Stanowisko" value={employee.jobTitle} />
                    <InfoRow label="Dział" value={employee.department} />
                </div>
            </section>
            
            <div className="space-y-3">
                <h2 className="text-base font-bold mb-1">Rozliczenie z działami</h2>
                
                <div className="space-y-2">
                    <div>
                        <h3 className="font-semibold text-sm mb-1">Magazyn</h3>
                        <ChecklistItem label="Spodnie, bluza, buty, koszulka" />
                        <ChecklistItem label="Pas, zarękawnik, przyłbica, fartuch" />
                        <SignatureSection label="Podpis pracownika Magazynu" />
                    </div>
                    
                    <div>
                        <h3 className="font-semibold text-sm mb-1 pt-2">Dział IT</h3>
                        <ChecklistItem label="Zwrot karty RCP" />
                        <SignatureSection label="Podpis pracownika Działu IT" />
                    </div>

                    <div>
                        <h3 className="font-semibold text-sm mb-1 pt-2">Opiekun / Lider</h3>
                        <ChecklistItem label="Zwrot kluczy do szafek" />
                        <ChecklistItem label="Szlifierka, miarka, narzędzia" />
                        <SignatureSection label="Podpis Opiekuna / Lidera" />
                    </div>
                </div>
            </div>

            <footer className="mt-8 pt-8 text-center">
                 <div className="inline-block relative">
                    <div className="border-t-2 border-dotted border-black w-80 pt-2 text-xs">
                        Podpis pracownika
                    </div>
                 </div>
            </footer>
        </div>
      </div>
    );
  }
);

CirculationCardPrintForm.displayName = 'CirculationCardPrintForm';
