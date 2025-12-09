
'use client';

import React from 'react';
import { Employee, CirculationCard } from '@/lib/types';
import { formatDate } from '@/lib/date';
import { Checkbox } from './ui/checkbox';

interface CirculationCardPrintFormProps {
  employee: Employee | null;
  card: CirculationCard | null;
}

export const CirculationCardPrintForm = React.forwardRef<HTMLDivElement, CirculationCardPrintFormProps>(
  ({ employee, card }, ref) => {
    
    if (!employee || !card) {
        return <div ref={ref} />;
    }

    const LabeledCheckbox = ({ label }: { label: string }) => (
        <div className="flex items-center space-x-2">
            <div className="w-5 h-5 border border-black" />
            <span className="text-sm">{label}</span>
        </div>
    );

    return (
      <div ref={ref} className="bg-white text-black font-serif">
         <style type="text/css" media="print">
          {`
            @page { 
              size: A4;
              margin: 1cm;
            }
            html, body {
              width: 210mm;
              height: 297mm;
              margin: 0;
              padding: 0;
              font-family: 'Times New Roman', Times, serif;
              font-size: 12pt;
            }
          `}
        </style>
        <div className="p-8 h-full flex flex-col">
            <header className="text-center mb-10">
                <h1 className="text-xl font-bold">KARTA OBIEGOWA PRACOWNIKA</h1>
            </header>

            <div className="text-right mb-8">
                <p>Data: {formatDate(card.date, 'dd.MM.yyyy')}</p>
            </div>
            
            <section className="space-y-3 mb-10 text-base">
                <div className="grid grid-cols-[200px_1fr] gap-x-4">
                    <p>Nazwisko i imię:</p> <p className="font-bold">{employee.fullName}</p>
                    <p>Dział:</p>          <p className="font-semibold">{employee.department}</p>
                    <p>Stanowisko:</p>    <p className="font-semibold">{employee.jobTitle}</p>
                    <p>Numer karty:</p>   <p className="font-bold">{employee.cardNumber}</p>
                </div>
            </section>

            <section className="space-y-6 mb-12 text-base">
                 <div className="flex items-center space-x-6">
                    <p className="w-64">Odzież - zwrócona:</p>
                    <div className="flex items-center space-x-4">
                        <LabeledCheckbox label="Tak" />
                        <LabeledCheckbox label="Nie" />
                    </div>
                </div>
                 <div className="flex items-center space-x-6">
                    <p className="w-64">Środki ochrony indywidualnej - zwrócone:</p>
                    <div className="flex items-center space-x-4">
                        <LabeledCheckbox label="Tak" />
                        <LabeledCheckbox label="Nie" />
                    </div>
                </div>
            </section>

            
            <footer className="pt-24 mt-auto">
              <div className="flex justify-end">
                  <div className="text-center w-2/5">
                      <div className="border-t border-dotted border-black pt-2">
                           <p className="text-sm">(Podpis pracownika Magazynu)</p>
                      </div>
                  </div>
              </div>
          </footer>
        </div>
      </div>
    );
  }
);

CirculationCardPrintForm.displayName = 'CirculationCardPrintForm';

