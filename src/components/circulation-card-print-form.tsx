'use client';

import React from 'react';
import { Employee } from '@/lib/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface CirculationCardPrintFormProps {
  employee: Employee | null;
}

const InfoRow = ({ label, value }: { label: string, value: string | undefined }) => (
    <div className="flex flex-col">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="font-semibold">{value || 'Brak danych'}</span>
    </div>
);

const ChecklistItem = ({ label }: { label: string }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-200">
        <span className="text-sm">{label}</span>
        <div className="flex items-center space-x-4 text-xs">
            <span>TAK</span>
            <div className="w-5 h-5 border-2 border-black"></div>
            <span className="ml-4">NIE</span>
            <div className="w-5 h-5 border-2 border-black"></div>
        </div>
    </div>
);

const SignatureSection = ({ label }: { label: string }) => (
    <div className="mt-8 text-sm">
        <div className="border-t-2 border-dotted border-black w-72 pt-1">
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
            <header className="text-center mb-10">
                <h1 className="text-2xl font-bold tracking-wider">KARTA OBIEGOWA</h1>
                <p className="text-gray-500">Potwierdzenie rozliczenia pracownika</p>
            </header>

            <section className="border-t border-b border-black py-4 mb-10">
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <InfoRow label="Pracownik" value={employee.fullName} />
                    <InfoRow label="Data zwolnienia" value={format(new Date(), 'd MMMM yyyy', { locale: pl })} />
                    <InfoRow label="Stanowisko" value={employee.jobTitle} />
                    <InfoRow label="Dział" value={employee.department} />
                    <InfoRow label="Nr karty RCP" value={employee.cardNumber} />
                </div>
            </section>
            
            <div className="space-y-10">
                <section>
                    <h2 className="text-lg font-bold mb-3">Rozliczenie z działami</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-base mb-2">Magazyn</h3>
                            <ChecklistItem label="Spodnie, bluza, buty, koszulka" />
                            <ChecklistItem label="Pas, zarękawnik, przyłbica, fartuch" />
                            <SignatureSection label="Podpis pracownika Magazynu" />
                        </div>
                        
                        <div className="pt-4">
                            <h3 className="font-semibold text-base mb-2">Dział IT</h3>
                            <ChecklistItem label="Zwrot karty RCP" />
                            <SignatureSection label="Podpis pracownika Działu IT" />
                        </div>

                         <div className="pt-4">
                            <h3 className="font-semibold text-base mb-2">Opiekun / Lider</h3>
                            <ChecklistItem label="Zwrot kluczy do szafek" />
                            <ChecklistItem label="Szlifierka, miarka, narzędzia" />
                            <SignatureSection label="Podpis Opiekuna / Lidera" />
                        </div>
                    </div>
                </section>
            </div>

            <footer className="mt-20 pt-10 text-center">
                 <div className="inline-block relative">
                    <div className="border-t-2 border-dotted border-black w-80 pt-2 text-sm">
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
