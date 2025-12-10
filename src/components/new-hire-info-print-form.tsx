
'use client';

import React from 'react';
import { Employee } from '@/lib/types';

interface NewHireInfoPrintFormProps {
  employee: Employee | null;
}

export const NewHireInfoPrintForm = React.forwardRef<HTMLDivElement, NewHireInfoPrintFormProps>(
  ({ employee }, ref) => {
    
    if (!employee) {
        return <div ref={ref} />;
    }

    return (
      <div ref={ref} className="text-black bg-white font-sans">
         <style type="text/css" media="print">
          {`
            @page { 
              size: A4;
              margin: 2cm;
            }
            html, body {
              font-family: Arial, sans-serif;
              font-size: 14pt;
            }
          `}
        </style>
        <div className="p-8 border-2 border-black h-[calc(297mm-4cm)] w-[calc(210mm-4cm)] flex flex-col items-center justify-center">
            <header className="text-center mb-16">
                <h1 className="text-3xl font-bold tracking-wider">KARTA INFORMACYJNA PRACOWNIKA</h1>
            </header>
            
            <section className="space-y-8 text-2xl w-full max-w-lg">
                <div className="flex items-center border-b-2 border-dotted border-gray-400 pb-2">
                    <p className="w-48 shrink-0 text-gray-600">Nazwisko i Imię:</p>
                    <p className="font-bold">{employee.fullName}</p>
                </div>
                <div className="flex items-center border-b-2 border-dotted border-gray-400 pb-2">
                    <p className="w-48 shrink-0 text-gray-600">Numer karty:</p>
                    <p className="font-bold">{employee.cardNumber}</p>
                </div>
                <div className="flex items-center border-b-2 border-dotted border-gray-400 pb-2">
                    <p className="w-48 shrink-0 text-gray-600">Dział:</p>
                    <p className="font-semibold">{employee.department}</p>
                </div>
                <div className="flex items-center border-b-2 border-dotted border-gray-400 pb-2">
                    <p className="w-48 shrink-0 text-gray-600">Stanowisko:</p>
                    <p className="font-semibold">{employee.jobTitle}</p>
                </div>
            </section>
        </div>
      </div>
    );
  }
);

NewHireInfoPrintForm.displayName = 'NewHireInfoPrintForm';
