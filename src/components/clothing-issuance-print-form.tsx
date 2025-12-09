
'use client';

import React from 'react';
import { Employee, ClothingIssuance } from '@/lib/types';
import { formatDate } from '@/lib/date';

interface ClothingIssuancePrintFormProps {
  employee: Employee | null;
  issuance: ClothingIssuance | null;
}

export const ClothingIssuancePrintForm = React.forwardRef<HTMLDivElement, ClothingIssuancePrintFormProps>(
  ({ employee, issuance }, ref) => {
    
    if (!employee || !issuance) {
        return <div ref={ref} />;
    }

    const isFullSetDescription = issuance.items.length === 1 && issuance.items[0].id === 'full-set';
    
    let itemsToRender: { name: string; quantity: number }[] = [];

    if (isFullSetDescription) {
        // If it's a full set, split the description by newlines to create individual items.
        const description = issuance.items[0].name || '';
        itemsToRender = description.split('\n').map(line => line.trim()).filter(line => line).map(name => ({ name, quantity: 1 }));
    } else {
        itemsToRender = issuance.items;
    }


    return (
      <div ref={ref} className="text-black bg-white font-serif">
         <style type="text/css" media="print">
          {`
            @page { 
              size: A4;
              margin: 1cm;
            }
            html, body {
              width: 210mm;
              height: 297mm;
              font-family: 'Times New Roman', Times, serif;
              font-size: 11pt;
            }
          `}
        </style>
        <div className="flex flex-col justify-between h-full p-4">
            <div>
                <header className="text-center mb-6">
                    <h1 className="text-lg font-bold">POTWIERDZENIE WYDANIA ODZIEŻY ROBOCZEJ</h1>
                    <p className="text-sm">(Workwear Issuance Confirmation)</p>
                </header>

                <div className="text-right mb-4">
                    <p>Data wydania: {formatDate(issuance.date, 'dd.MM.yyyy')}</p>
                </div>
                
                <section className="space-y-2 mb-4 text-sm">
                    <p><strong>Dane Pracownika / Employee Details:</strong></p>
                    <div className="grid grid-cols-[120px_1fr] gap-x-2 gap-y-1">
                        <p>Imię i nazwisko:</p> <p className="font-semibold">{employee.fullName}</p>
                        <p>Stanowisko:</p>    <p className="font-semibold">{employee.jobTitle}</p>
                        <p>Dział:</p>          <p className="font-semibold">{employee.department}</p>
                    </div>
                </section>

                <section className="mb-6">
                    <p className="font-bold text-sm mb-2">Wydane elementy / Issued Items:</p>
                    <div className="border border-black p-2 text-sm min-h-[140px]">
                      {itemsToRender.map((item, index) => (
                          <div key={index} className="flex items-center justify-between border-b border-dotted border-gray-300 py-1.5 last:border-b-0">
                              <div className="flex items-center">
                                  <span className="w-8">{index + 1}.</span>
                                  <span>{item.name}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                  <span className="text-xs">(x{item.quantity})</span>
                                  <div className="h-5 w-5 border border-black"></div>
                              </div>
                          </div>
                      ))}
                    </div>
                </section>
            </div>
            
            <footer className="text-sm mt-auto">
              <div className="flex justify-between items-end pt-16">
                  <div className="text-center w-2/5">
                      <div className="border-t border-dotted border-black pt-1">
                           <p className="text-xs">(data i podpis pracownika)</p>
                      </div>
                  </div>
                  <div className="text-center w-2/5">
                      <div className="border-t border-dotted border-black pt-1">
                           <p className="text-xs">(podpis osoby wydającej)</p>
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
