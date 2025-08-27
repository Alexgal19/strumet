
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
            @page { size: A4; margin: 2.5cm; }
            body { -webkit-print-color-adjust: exact; }
          `}
        </style>
        <div className="space-y-6 text-sm">
            <header className="text-center">
                <h1 className="text-base font-bold">Wniosek o wydanie odzieży ochronnej, obuwia roboczego oraz środków ochrony indywidualnej</h1>
            </header>

            <div className="text-right">
                <p>Data: {format(issuanceDate, 'PPP', { locale: pl })}</p>
            </div>
            
            <section className="space-y-2">
                <h2 className="font-bold">Dane Pracownika:</h2>
                <p>Imię i nazwisko: <span className="font-semibold">{employee.fullName}</span></p>
                <p>Stanowisko: <span className="font-semibold">{employee.jobTitle}</span></p>
                <p>Dział: <span className="font-semibold">{employee.department}</span></p>
            </section>

            <section className="space-y-2">
                <h2 className="font-bold">Wnioskowane artykuły:</h2>
                {clothingItems.length > 0 ? (
                    <ul className="list-disc list-inside pl-4">
                        {clothingItems.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted-foreground">(Brak wybranych artykułów)</p>
                )}
            </section>
            
            <footer className="pt-20">
                <div className="grid grid-cols-1">
                    <div className="text-center w-1/2 mx-auto">
                        <div className="border-t border-dashed border-black pt-1">
                             <p className="text-xs">Podpis opiekuna</p>
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
