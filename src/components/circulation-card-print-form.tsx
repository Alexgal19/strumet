'use client';

import React from 'react';
import { Employee } from "@/lib/types";
import { format } from "date-fns";

interface CirculationCardPrintFormProps {
  employee: Employee | null;
}

export const CirculationCardPrintForm = React.forwardRef<HTMLDivElement, CirculationCardPrintFormProps>(
  ({ employee }, ref) => {
    
    if (!employee) {
      return (
           <div ref={ref} className="p-8 border rounded-lg bg-white shadow-md text-black aspect-[1/1.414] flex items-center justify-center text-center text-gray-500">
              <div>
                  <h3 className="text-lg font-semibold mb-2">Podgląd Karty Obiegowej</h3>
                  <p>Wybierz pracownika, aby zobaczyć, jak będzie wyglądał dokument.</p>
              </div>
          </div>
      );
    }

    const printDate = employee.terminationDate 
        ? format(new Date(employee.terminationDate), 'dd.MM.yyyy')
        : '______________';

    const warehouseItems = ["Spodnie", "Bluza", "Buty", "Koszulka", "Koszula", "Pas", "Zarękawnik P-L", "Przyłbica", "Fartuch"];
    const itItems = ["Zwrot karty"];
    const supervisorItems = ["Zwrot kluczy do szafki na ubraniowej", "Zwrot kluczy do szafki na wydziale", "Szlifierka"];
    const foremanItems = ["Miarka", "Kabel spawalniczy", "Masa"];

    const renderSection = (title: string, items: string[]) => (
      <div className="mb-4">
        <h2 className="text-sm font-bold text-center tracking-wider mb-2">{title}</h2>
        <div className="space-y-1">
          {items.map(item => (
            <div key={item} className="flex justify-between items-end">
              <span className="text-sm">{item}</span>
              <span className="flex-grow border-b border-dotted border-gray-400 mx-2"></span>
              <span className="text-xs">TAK / NIE / ND</span>
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-6">
          <div className="w-1/2 text-center">
            <div className="border-t border-gray-500 pt-1">
              <span className="text-xs text-gray-500">(podpis i data)</span>
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <div ref={ref} className="bg-white text-black font-sans p-4 w-full">
        <style jsx global>{`
            @media print {
              body, html {
                margin: 0;
                padding: 0;
                width: 100%;
                background: white;
                -webkit-print-color-adjust: exact;
              }
              .print-container {
                padding: 0;
                width: 100%;
                height: 100%;
                box-sizing: border-box;
              }
            }
            @page {
              size: A4;
              margin: 1.5cm;
            }
        `}</style>
         <div className="print-container">
            <div className="text-center mb-6">
                <h1 className="text-lg font-bold tracking-widest border-b-2 border-black inline-block px-4 pb-1">KARTA OBIEGOWA</h1>
            </div>
            
            <div className="text-sm mb-6 space-y-1">
              <div className="flex">
                <span className="font-bold w-36 shrink-0">Nazwisko Imię:</span>
                <span className="font-semibold">{employee.fullName}</span>
              </div>
              <div className="flex">
                <span className="font-bold w-36 shrink-0">Stanowisko:</span>
                <span>{employee.jobTitle}</span>
              </div>
              <div className="flex">
                <span className="font-bold w-36 shrink-0">Dział:</span>
                <span>{employee.department}</span>
              </div>
               <div className="flex">
                <span className="font-bold w-36 shrink-0">Nr karty RCP:</span>
                <span>{employee.cardNumber}</span>
              </div>
              <div className="flex">
                <span className="font-bold w-36 shrink-0">Data zwolnienia:</span>
                <span>{printDate}</span>
              </div>
            </div>
            
            <div className="border-t-2 border-black mb-4"></div>

            <div className="space-y-4">
              {renderSection("MAGAZYN", warehouseItems)}
              {renderSection("INFORMATYK", itItems)}
              {renderSection("OPIEKUN", supervisorItems)}
              {renderSection("BRYGADZISTA", foremanItems)}
            </div>
        </div>
      </div>
    );
  }
);

CirculationCardPrintForm.displayName = 'CirculationCardPrintForm';