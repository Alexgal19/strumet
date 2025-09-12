'use client';

import React from 'react';
import { Employee, ClothingIssuanceHistoryItem } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';

interface ClothingIssuancePrintFormProps {
  employee: Employee | null;
  issuance: ClothingIssuanceHistoryItem | null;
}

export const ClothingIssuancePrintForm = React.forwardRef<HTMLDivElement, ClothingIssuancePrintFormProps>(
  ({ employee, issuance }, ref) => {
    
    if (!employee || !issuance) {
        return <div ref={ref} />;
    }

    return (
      <div ref={ref} className="p-4 bg-white text-black font-serif print:p-0 print:shadow-none">
        <style type="text/css" media="print">
          {`
            @page { 
              size: A4;
              margin: 1.5cm;
            }
            html, body {
              margin: 0;
              padding: 0;
              font-family: 'Times New Roman', Times, serif;
              font-size: 11pt;
            }
          `}
        </style>
        <div className="print-container">
          <div>
            <header className="text-center mb-6">
                <h1 className="text-base font-bold underline">Wniosek o wydanie odzieży ochronnej, obuwia roboczego oraz środków ochrony indywidualnej</h1>
            </header>

            <div className="text-right mb-8">
                <p>Data: {format(parseISO(issuance.date), 'dd.MM.yyyy', { locale: pl })}</p>
            </div>
            
            <section className="space-y-2 mb-6">
                <p><strong>Dane Pracownika:</strong></p>
                <div className="grid grid-cols-[120px_1fr] gap-x-2">
                    <p>Imię i nazwisko:</p> <p className="font-semibold">{employee.fullName}</p>
                    <p>Stanowisko:</p>    <p className="font-semibold">{employee.jobTitle}</p>
                    <p>Dział:</p>          <p className="font-semibold">{employee.department}</p>
                    <p>Numer karty:</p>    <p className="font-semibold">{employee.cardNumber}</p>
                </div>
            </section>

            <section className="space-y-2">
                <p><strong>Wnioskowane artykuły:</strong></p>
                {issuance.items.length > 0 ? (
                    <ul className="list-decimal list-inside pl-4 space-y-1">
                        {issuance.items.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">(Brak wybranych artykułów)</p>
                )}
            </section>
          </div>
            
          <footer className="pt-24 mt-auto">
              <div className="flex justify-between">
                  <div className="text-center w-2/5">
                      <div className="border-t border-black pt-1">
                           <p className="text-xs">(podpis pracownika)</p>
                      </div>
                  </div>
                  <div className="text-center w-2/5">
                      <div className="border-t border-black pt-1">
                           <p className="text-xs">(podpis opiekuna)</p>
                      </div>
                  </div>
              </div>
          </footer>
        </div>
      </div>
    );
  }
);

ClothingIssuancePrintForm.displayName = 'ClothingIssuancePrintForm';
