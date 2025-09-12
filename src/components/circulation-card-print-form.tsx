'use client';

import React from 'react';
import { Employee } from "@/lib/types";
import { format, parseISO } from "date-fns";

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
        : format(new Date(), 'dd.MM.yyyy');

    const warehouseItems = ["spodnie", "bluza", "buty", "koszulka", "koszula", "pas", "zarękawnik P-L", "przyłbica", "fartuch"];
    const supervisorItems = ["Zwrot kluczy do szafki na ubraniowej", "Zwrot kluczy do szafki na wydziale", "Szlifierka"];
    const foremanItems = ["Miarka", "Kabel spawalniczy", "Masa"];

    return (
        <div ref={ref} className="bg-white text-black font-sans w-full">
            <style jsx global>{`
              @media print {
                body {
                  margin: 0;
                  padding: 0;
                  background: white;
                }
                .print-container {
                  padding: 1.5cm;
                  width: 100%;
                  height: 100%;
                  box-sizing: border-box;
                }
              }
              @page {
                size: A4;
                margin: 0;
              }
            `}</style>
             <div className="print-container p-10">
                <div className="text-center mb-6">
                    <h1 className="text-lg font-bold tracking-widest border-b-2 border-black inline-block px-4 pb-1">KARTA OBIEGOWA</h1>
                </div>
                
                <table className="w-full text-sm mb-6">
                    <tbody>
                        <tr>
                            <td className="font-bold pr-4 py-0.5 w-1/5">Nazwisko Imię:</td>
                            <td className="py-0.5 font-semibold">{employee.fullName}</td>
                        </tr>
                        <tr>
                            <td className="font-bold pr-4 py-0.5">Stanowisko:</td>
                            <td className="py-0.5">{employee.jobTitle}</td>
                        </tr>
                        <tr>
                            <td className="font-bold pr-4 py-0.5">Dział:</td>
                            <td className="py-0.5">{employee.department}</td>
                        </tr>
                        <tr>
                            <td className="font-bold pr-4 py-0.5">Nr karty RCP:</td>
                            <td className="py-0.5">{employee.cardNumber}</td>
                        </tr>
                        <tr>
                            <td className="font-bold pr-4 py-0.5">Data zwolnienia:</td>
                            <td className="py-0.5">{printDate}</td>
                        </tr>
                    </tbody>
                </table>
                <div className="border-t-2 border-black mb-4"></div>

                <div className="space-y-4">
                    <div>
                        <h2 className="text-sm font-bold text-center tracking-wider mb-2">MAGAZYN</h2>
                        {warehouseItems.map(item => (
                            <div key={item} className="flex justify-between items-center py-1 border-b border-dotted border-gray-400">
                                <span className="text-sm capitalize">{item}</span>
                                <span className="text-xs">TAK / NIE / ND</span>
                            </div>
                        ))}
                        <div className="flex justify-end pt-4">
                            <div className="w-1/2 border-t border-gray-500 text-center pt-1">
                                <span className="text-xs text-gray-500">(podpis i data)</span>
                            </div>
                        </div>
                    </div>
                     <div>
                        <h2 className="text-sm font-bold text-center tracking-wider mb-2">INFORMATYK</h2>
                        <div className="flex justify-between items-center py-1 border-b border-dotted border-gray-400">
                            <span className="text-sm">Zwrot karty</span>
                            <span className="text-xs">TAK / NIE / ND</span>
                        </div>
                        <div className="flex justify-end pt-4">
                            <div className="w-1/2 border-t border-gray-500 text-center pt-1">
                                <span className="text-xs text-gray-500">(podpis i data)</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-center tracking-wider mb-2">OPIEKUN</h2>
                         {supervisorItems.map(item => (
                            <div key={item} className="flex justify-between items-center py-1 border-b border-dotted border-gray-400">
                                <span className="text-sm">{item}</span>
                                <span className="text-xs">TAK / NIE / ND</span>
                            </div>
                        ))}
                        <div className="flex justify-end pt-4">
                            <div className="w-1/2 border-t border-gray-500 text-center pt-1">
                                <span className="text-xs text-gray-500">(podpis i data)</span>
                            </div>
                        </div>
                    </div>
                   <div>
                        <h2 className="text-sm font-bold text-center tracking-wider mb-2">BRYGADZISTA</h2>
                        {foremanItems.map(item => (
                            <div key={item} className="flex justify-between items-center py-1 border-b border-dotted border-gray-400">
                                <span className="text-sm">{item}</span>
                                <span className="text-xs">TAK / NIE / ND</span>
                            </div>
                        ))}
                        <div className="flex justify-end pt-4">
                            <div className="w-1/2 border-t border-gray-500 text-center pt-1">
                                <span className="text-xs text-gray-500">(podpis i data)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  }
);

CirculationCardPrintForm.displayName = 'CirculationCardPrintForm';
