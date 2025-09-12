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
    <div className="flex items-center justify-between py-2 border-b border-gray-300">
        <span className="text-sm flex-grow pr-4">{label}</span>
        <div className="flex items-center space-x-4 text-sm shrink-0">
            <div className="flex items-center space-x-2">
                <span>TAK</span>
                <div className="w-4 h-4 border-2 border-black"></div>
            </div>
            <div className="flex items-center space-x-2">
                <span>NIE</span>
                <div className="w-4 h-4 border-2 border-black"></div>
            </div>
        </div>
    </div>
);

const SignatureSection = ({ label }: { label: string }) => (
    <div className="mt-8">
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
              background-color: white;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-container {
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              height: calc(297mm - 3cm);
              width: 100%;
            }
          `}
        </style>
        <div className="print-container p-[1.5cm] print:p-0">
          <main>
            <header className="text-center mb-6">
                <h1 className="text-xl font-bold tracking-wider">KARTA OBIEGOWA</h1>
                <p className="text-sm text-gray-500">Potwierdzenie rozliczenia pracownika</p>
            </header>

            <section className="border-t-2 border-b-2 border-black py-3 mb-6">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    <InfoRow label="Pracownik" value={employee.fullName} />
                    <InfoRow label="Data zwolnienia" value={employee.terminationDate ? format(new Date(employee.terminationDate), 'd MMMM yyyy', { locale: pl }) : format(new Date(), 'd MMMM yyyy', { locale: pl })} />
                    <InfoRow label="Stanowisko" value={employee.jobTitle} />
                    <InfoRow label="Dział" value={employee.department} />
                </div>
            </section>
            
            <div className="space-y-4">
                <h2 className="text-lg font-bold mb-2">Rozliczenie z działami</h2>
                
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-base mb-1">Magazyn</h3>
                        <ChecklistItem label="Spodnie, bluza, buty, koszulka" />
                        <ChecklistItem label="Pas, zarękawnik, przyłbica, fartuch" />
                        <div className="flex justify-end"><SignatureSection label="Podpis pracownika Magazynu" /></div>
                    </div>
                    
                    <div>
                        <h3 className="font-semibold text-base mb-1">Dział IT</h3>
                        <ChecklistItem label="Zwrot karty RCP" />
                        <div className="flex justify-end"><SignatureSection label="Podpis pracownika Działu IT" /></div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-base mb-1">Opiekun / Lider</h3>
                        <ChecklistItem label="Zwrot kluczy do szafek" />
                        <ChecklistItem label="Szlifierka, miarka, narzędzia" />
                         <div className="flex justify-end"><SignatureSection label="Podpis Opiekuna / Lidera" /></div>
                    </div>
                </div>
            </div>
          </main>

          <footer className="text-center">
              <SignatureSection label="Podpis pracownika" />
          </footer>
        </div>
      </div>
    );
  }
);

CirculationCardPrintForm.displayName = 'CirculationCardPrintForm';
