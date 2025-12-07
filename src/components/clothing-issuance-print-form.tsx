
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
                                    <td className="border border-black p-2 h-16"></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            </div>
            
            <footer className="text-sm mt-auto">
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
