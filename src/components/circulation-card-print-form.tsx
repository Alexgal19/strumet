'use client';

import React from 'react';
import { Employee } from "@/lib/types";
import { format } from "date-fns";

interface CirculationCardPrintFormProps {
  employee: Employee | null;
}

export const CirculationCardPrintForm = React.forwardRef<HTMLDivElement, CirculationCardPrintFormProps>(
  ({ employee }, ref) => {
    
    // Preview for the main page
    if (!employee) {
      return (
           <div ref={ref} className="p-8 border rounded-lg bg-white shadow-md text-black flex items-center justify-center text-center text-gray-500 min-h-[400px]">
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
      <div className="section mb-6">
        <h2 className="section-title text-center font-bold text-xs tracking-wider mb-3">{title}</h2>
        <div className="section-content space-y-3">
          {items.map(item => (
            <div key={item} className="item-row flex items-end">
              <span className="item-label text-sm">{item}</span>
              <span className="item-dots flex-grow border-b border-dotted border-gray-400 mx-2 mb-1"></span>
              <span className="item-signature-placeholder text-xs text-gray-600">TAK / NIE / ND</span>
            </div>
          ))}
        </div>
        <div className="signature-line flex justify-end pt-10">
          <div className="signature-box w-2/5 border-t border-gray-400 pt-1 text-center">
            <span className="signature-caption text-[8pt] text-gray-500">(podpis i data)</span>
          </div>
        </div>
      </div>
    );

    return (
      <div ref={ref} className="print-content bg-white text-black font-sans p-8">
        <div style={{textAlign: 'center'}} className="mb-8">
            <h1 className="page-title inline-block text-lg font-bold tracking-widest border-b-2 border-black pb-1">KARTA OBIEGOWA</h1>
        </div>
        
        <div className="employee-info mb-6 text-sm space-y-1">
            <div className="info-row flex">
                <span className="info-label font-bold w-32 shrink-0">Nazwisko Imię:</span>
                <span className="info-value">{employee.fullName}</span>
            </div>
            <div className="info-row flex">
                <span className="info-label font-bold w-32 shrink-0">Stanowisko:</span>
                <span className="info-value">{employee.jobTitle}</span>
            </div>
            <div className="info-row flex">
                <span className="info-label font-bold w-32 shrink-0">Dział:</span>
                <span className="info-value">{employee.department}</span>
            </div>
            <div className="info-row flex">
                <span className="info-label font-bold w-32 shrink-0">Nr karty RCP:</span>
                <span className="info-value">{employee.cardNumber}</span>
            </div>
            <div className="info-row flex">
                <span className="info-label font-bold w-32 shrink-0">Data zwolnienia:</span>
                <span className="info-value">{printDate}</span>
            </div>
        </div>
        
        <div className="divider border-t-2 border-black mb-6"></div>

        <div className="space-y-4">
            {renderSection("MAGAZYN", warehouseItems)}
            {renderSection("INFORMATYK", itItems)}
            {renderSection("OPIEKUN", supervisorItems)}
            {renderSection("BRYGADZISTA", foremanItems)}
        </div>
      </div>
    );
  }
);

CirculationCardPrintForm.displayName = 'CirculationCardPrintForm';
