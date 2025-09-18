'use client';

import React from 'react';
import { Employee, ClothingIssuance } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';

interface ClothingIssuancePrintFormProps {
  employee: Employee | null;
  issuance: ClothingIssuance | null;
}

export const ClothingIssuancePrintForm = React.forwardRef<HTMLDivElement, ClothingIssuancePrintFormProps>(
  ({ employee, issuance }, ref) => {
    
    if (!employee || !issuance) {
        return <div ref={ref} />;
    }

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
            .no-break {
                page-break-inside: avoid;
            }
          `}
        </style>
        <div className="p-4">
            <header className="text-center mb-8">
                <h1 className="text-lg font-bold">POTWIERDZENIE WYDANIA ODZIEŻY ROBOCZEJ</h1>
                <p className="text-sm">(Workwear Issuance Confirmation)</p>
            </header>

            <div className="text-right mb-6">
                <p>Data wydania: {format(parseISO(issuance.date), 'dd.MM.yyyy', { locale: pl })}</p>
            </div>
            
            <section className="space-y-2 mb-6 text-sm no-break">
                <p><strong>Dane Pracownika / Employee Details:</strong></p>
                <div className="grid grid-cols-[180px_1fr] gap-x-2 gap-y-1">
                    <p>Imię i nazwisko:</p> <p className="font-semibold">{employee.fullName}</p>
                    <p>Stanowisko:</p>    <p className="font-semibold">{employee.jobTitle}</p>
                    <p>Dział:</p>          <p className="font-semibold">{employee.department}</p>
                </div>
            </section>

            <section className="mb-8 no-break">
                <p className="font-bold text-sm mb-2">Wydane elementy / Issued Items:</p>
                <table className="w-full border-collapse border border-black text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-black p-2 w-1/12 text-center">Lp.</th>
                            <th className="border border-black p-2 text-left">Nazwa elementu / Item Name</th>
                            <th className="border border-black p-2 w-1/6 text-center">Ilość / Quantity</th>
                            <th className="border border-black p-2 w-1/4 text-center">Podpis pracownika /<br/>Employee Signature</th>
                        </tr>
                    </thead>
                    <tbody>
                        {issuance.items.map((item, index) => (
                            <tr key={item.id}>
                                <td className="border border-black p-2 text-center">{index + 1}.</td>
                                <td className="border border-black p-2">{item.name}</td>
                                <td className="border border-black p-2 text-center">{item.quantity}</td>
                                <td className="border border-black p-2 h-12"></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
            
            <footer className="pt-16 text-sm no-break">
              <div className="flex justify-between items-end">
                  <div className="text-center w-2/5">
                      <div className="border-t border-dotted border-black pt-1">
                           <p className="text-xs">(data i podpis pracownika / date and employee signature)</p>
                      </div>
                  </div>
                  <div className="text-center w-2/5">
                      <div className="border-t border-dotted border-black pt-1">
                           <p className="text-xs">(podpis osoby wydającej / issuer's signature)</p>
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
