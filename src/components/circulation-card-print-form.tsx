'use client';

import React from 'react';
import { Employee, CirculationCard } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';

interface CirculationCardPrintFormProps {
  employee: Employee | null;
  card: CirculationCard | null;
}

export const CirculationCardPrintForm = React.forwardRef<HTMLDivElement, CirculationCardPrintFormProps>(
  ({ employee, card }, ref) => {
    
    if (!employee || !card) {
        return <div ref={ref} />;
    }

    const sections = [
        { title: "Dział Kadr", manager: "Kierownik Działu Kadr" },
        { title: "Dział Produkcji", manager: "Kierownik Produkcji" },
        { title: "Dział Logistyki", manager: "Kierownik Logistyki" },
        { title: "Dział Jakości", manager: "Kierownik Jakości" },
        { title: "Bezpieczeństwo i Higiena Pracy", manager: "Specjalista ds. BHP" },
    ];

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
              font-size: 11pt;
            }
          `}
        </style>
        <div className="p-4">
            <header className="text-center mb-8">
                <h1 className="text-xl font-bold">KARTA OBIEGOWA PRACOWNIKA</h1>
                <p className="text-sm">(Employee Clearance Form)</p>
            </header>

            <div className="text-right mb-6">
                <p>Data: {format(parseISO(card.date), 'dd.MM.yyyy', { locale: pl })}</p>
            </div>
            
            <section className="space-y-2 mb-6 text-sm">
                <p><strong>Dane Pracownika / Employee Details:</strong></p>
                <div className="grid grid-cols-[180px_1fr] gap-x-2 gap-y-1">
                    <p>Imię i nazwisko:</p> <p className="font-semibold">{employee.fullName}</p>
                    <p>Stanowisko:</p>    <p className="font-semibold">{employee.jobTitle}</p>
                    <p>Dział:</p>          <p className="font-semibold">{employee.department}</p>
                    <p>Data zatrudnienia:</p> <p className="font-semibold">{employee.hireDate || '________________'}</p>
                    <p>Data zwolnienia:</p> <p className="font-semibold">{employee.terminationDate || '________________'}</p>
                </div>
            </section>

            <table className="w-full border-collapse border border-black text-sm mb-8">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-black p-2 w-1/3">Dział / Department</th>
                        <th className="border border-black p-2 w-1/3">Podpis i data / Signature and Date</th>
                        <th className="border border-black p-2 w-1/3">Uwagi / Comments</th>
                    </tr>
                </thead>
                <tbody>
                    {sections.map(section => (
                        <tr key={section.title}>
                            <td className="border border-black p-2">
                                <p className="font-bold">{section.title}</p>
                                <p className="text-xs text-gray-600">({section.manager})</p>
                            </td>
                            <td className="border border-black p-2 h-16"></td>
                            <td className="border border-black p-2"></td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            <footer className="pt-12 text-sm">
              <div className="flex justify-between">
                  <div className="text-center w-2/5">
                      <div className="border-t border-dotted border-black pt-1">
                           <p className="text-xs">(podpis pracownika / employee signature)</p>
                      </div>
                  </div>
                  <div className="text-center w-2/5">
                      <div className="border-t border-dotted border-black pt-1">
                           <p className="text-xs">(podpis osoby upoważnionej / authorized person)</p>
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
