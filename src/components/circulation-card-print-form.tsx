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
        : format(new Date(), 'dd.MM.yyyy');

    const warehouseItems = ["spodnie", "bluza", "buty", "koszulka", "koszula", "pas", "zarękawnik P-L", "przyłbica", "fartuch"];
    const supervisorItems = ["Zwrot kluczy do szafki na ubraniowej", "Zwrot kluczy do szafki na wydziale", "Szlifierka"];
    const foremanItems = ["Miarka", "Kabel spawalniczy", "Masa"];

    const SectionHeader = ({ title }: { title: string }) => (
        <h2 className="text-sm font-bold text-center tracking-wider uppercase border-b-2 border-black pb-1 mb-3">{title}</h2>
    );

    const ChecklistRow = ({ label }: { label: string }) => (
        <div className="flex justify-between items-center py-1.5 border-b border-dotted border-gray-400">
            <span className="text-sm">{label}</span>
            <div className="flex items-center space-x-4 text-xs">
                <span>TAK / NIE / ND</span>
            </div>
        </div>
    );
    
    const SignatureRow = () => (
         <div className="flex justify-end pt-6">
            <div className="w-1/2 border-t border-gray-400 text-center pt-1">
                <span className="text-xs text-gray-600">(podpis i data)</span>
            </div>
        </div>
    );


    return (
        <div ref={ref} className="bg-white text-black font-sans w-full">
             <style type="text/css" media="print">
              {`
                @page {
                   size: A4;
                   margin: 1.5cm;
                }
                 body, html { 
                    font-family: Arial, sans-serif;
                    font-size: 10pt;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
              `}
            </style>
            <div className="w-full">
                <header className="text-center mb-6">
                    <h1 className="text-xl font-bold tracking-wider">KARTA OBIEGOWA</h1>
                </header>
                
                <section className="border-y-2 border-black py-2 mb-6">
                     <table className="w-full text-sm">
                        <tbody>
                            <tr>
                                <td className="font-bold pr-2 py-0.5 w-1/4">Nazwisko Imię:</td>
                                <td className="py-0.5">{employee.fullName}</td>
                            </tr>
                             <tr>
                                <td className="font-bold pr-2 py-0.5 w-1/4">Stanowisko:</td>
                                <td className="py-0.5">{employee.jobTitle}</td>
                            </tr>
                            <tr>
                                <td className="font-bold pr-2 py-0.5 w-1/4">Dział:</td>
                                <td className="py-0.5">{employee.department}</td>
                            </tr>
                            <tr>
                                <td className="font-bold pr-2 py-0.5 w-1/4">Nr karty RCP:</td>
                                <td className="py-0.5">{employee.cardNumber}</td>
                            </tr>
                            <tr>
                                <td className="font-bold pr-2 py-0.5 w-1/4">Data zwolnienia:</td>
                                <td className="py-0.5">{printDate}</td>
                            </tr>
                        </tbody>
                     </table>
                </section>
                

                <main className="space-y-6">
                    <div>
                        <SectionHeader title="Magazyn" />
                         {warehouseItems.map(item => <ChecklistRow key={item} label={item} />)}
                        <SignatureRow />
                    </div>
                     <div>
                        <SectionHeader title="Informatyk" />
                        <ChecklistRow label="Zwrot karty" />
                        <SignatureRow />
                    </div>
                    <div>
                        <SectionHeader title="Opiekun" />
                         {supervisorItems.map(item => <ChecklistRow key={item} label={item} />)}
                        <SignatureRow />
                    </div>

                   <div>
                        <SectionHeader title="Brygadzista" />
                        {foremanItems.map(item => <ChecklistRow key={item} label={item} />)}
                        <SignatureRow />
                    </div>
                </main>
            </div>
        </div>
    );
  }
);

CirculationCardPrintForm.displayName = 'CirculationCardPrintForm';
