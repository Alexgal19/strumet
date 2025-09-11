'use client';

import React from 'react';
import { Employee } from '@/lib/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface ClothingIssuancePrintFormProps {
  employee: Employee | null;
  clothingItems: string[];
  issuanceDate: Date;
}

export const ClothingIssuancePrintForm = React.forwardRef<HTMLDivElement, ClothingIssuancePrintFormProps>(
  ({ employee, clothingItems, issuanceDate }, ref) => {
    
    if (!employee) {
        // This part is not intended for printing, just for visual feedback in the UI
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
            .print-container {
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              min-height: 24cm; /* Approximate height for A4 with margins */
              width: 100%;
              border: 1px solid black;
              padding: 1cm;
              box-sizing: border-box;
            }
          `}
        </style>
        <div className="print-container">
          <div>
            <header className="text-center mb-6">
                <h1 className="text-base font-bold underline">Wniosek o wydanie odzieży ochronnej, obuwia roboczego oraz środków ochrony indywidualnej</h1>
            </header>

            <div className="text-right mb-8">
                <p>Data: {format(issuanceDate, 'dd.MM.yyyy', { locale: pl })}</p>
            </div>
            
            <section className="space-y-2 mb-6">
                <p><strong>Dane Pracownika:</strong></p>
                <div className="grid grid-cols-[120px_1fr] gap-x-2">
                    <p>Imię i nazwisko:</p> <p className="font-semibold">{employee.fullName}</p>
                    <p>Stanowisko:</p>    <p className="font-semibold">{employee.jobTitle}</p>
                    <p>Dział:</p>          <p className="font-semibold">{employee.department}</p>
                </div>
            </section>

            <section className="space-y-2">
                <p><strong>Wnioskowane artykuły:</strong></p>
                {clothingItems.length > 0 ? (
                    <ul className="list-decimal list-inside pl-4 space-y-1">
                        {clothingItems.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">(Brak wybranych artykułów)</p>
                )}
            </section>
          </div>
            
          <footer className="pt-16">
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
