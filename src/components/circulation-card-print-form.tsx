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
             <div ref={ref} className="p-8 border rounded-lg bg-white shadow-md text-black text-xs aspect-[1/1.414] flex items-center justify-center text-center text-gray-500">
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

    const dataSectionItems = [
        { label: "Nazwisko Imię", value: employee.fullName },
        { label: "Stanowisko", value: employee.jobTitle },
        { label: "Dział", value: employee.department },
        { label: "Nr karty RCP", value: employee.cardNumber },
        { label: "Data", value: printDate },
    ];

    const warehouseItems = ["spodnie", "bluza", "buty", "koszulka", "koszula", "pas", "zarękawnik P-L", "przyłbica", "fartuch"];
    const supervisorItems = ["Zwrot kluczy do szafki na ubraniowej", "Zwrot kluczy do szafki na wydziale", "Szlifierka"];
    const foremanItems = ["Miarka", "Kabel spawalniczy", "Masa"];

    const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
        <div className="mb-1.5">
            <h2 className="text-center font-bold bg-gray-200 p-0.5 border-t border-x border-black text-sm">{title}</h2>
            {children}
        </div>
    );
    
    const ChecklistRow = ({ label }: { label: string }) => (
        <div className="grid grid-cols-[1fr_40px_40px_40px] items-center border-b border-x border-black">
            <span className="px-2 py-0.5 text-sm">{label}</span>
            <div className="h-full flex items-center justify-center border-l"><div className="w-4 h-4 border border-black"></div></div>
            <div className="h-full flex items-center justify-center border-l"><div className="w-4 h-4 border border-black"></div></div>
            <div className="h-full flex items-center justify-center border-l"><div className="w-4 h-4 border border-black"></div></div>
        </div>
    );
    
    const SignatureRow = ({ label }: { label: string }) => (
        <div className="border-t border-x border-b border-black text-right pr-4 py-0.5">
            <span className="text-xs italic">{label}</span>
        </div>
    );


    return (
        <div ref={ref} className="bg-white text-black text-xs print:shadow-none print:p-0 w-full">
             <style type="text/css" media="print">
              {`
                @page {
                   size: A4;
                   margin: 1.5cm;
                }
                 body { 
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
              `}
            </style>
            <div className="w-full">
                <header className="text-center mb-2">
                    <h1 className="text-lg font-bold tracking-wider">KARTA OBIEGOWA</h1>
                </header>
                
                <section className="border-t border-black">
                     {dataSectionItems.map(item => (
                        <div key={item.label} className="grid grid-cols-3 border-b border-black">
                            <div className="col-span-1 font-semibold p-1 border-x border-black">{item.label}</div>
                            <div className="col-span-2 p-1 border-r border-black">{item.value || ''}</div>
                        </div>
                    ))}
                </section>
                
                <div className="h-2"></div>

                <main>
                    <Section title="Magazyn">
                        <div className="grid grid-cols-[1fr_40px_40px_40px] items-center border-b border-x border-black bg-gray-100">
                            <span className="px-2 py-0.5 font-bold text-sm">Zwrot odzieży</span>
                            <div className="h-full flex items-center justify-center border-l font-bold text-xs">TAK</div>
                            <div className="h-full flex items-center justify-center border-l font-bold text-xs">NIE</div>
                            <div className="h-full flex items-center justify-center border-l font-bold text-xs">ND</div>
                        </div>
                        {warehouseItems.map(item => <ChecklistRow key={item} label={item} />)}
                        <SignatureRow label="Podpis pracownika Magazynu" />
                    </Section>

                    <Section title="Informatyk">
                        <div className="grid grid-cols-[1fr_120px_1fr] items-center border-b border-x border-black">
                            <span className="px-2 py-0.5 text-sm">Zwrot karty</span>
                            <div className="h-full flex items-center justify-center border-l font-bold text-base bg-green-200">TAK</div>
                            <div className="grid grid-rows-2 h-full border-l">
                               <div className="px-2 py-0.5 text-sm border-b">Data:</div>
                               <div className="px-2 py-0.5 text-sm">Podpis:</div>
                            </div>
                        </div>
                    </Section>
                    
                    <Section title="Opiekun">
                        <div className="grid grid-cols-[1fr_40px_40px_40px] items-center border-b border-x border-black bg-gray-100">
                            <span className="px-2 py-0.5 font-bold text-sm"></span>
                             <div className="h-full flex items-center justify-center border-l font-bold text-xs">TAK</div>
                            <div className="h-full flex items-center justify-center border-l font-bold text-xs">NIE</div>
                            <div className="h-full flex items-center justify-center border-l font-bold text-xs">ND</div>
                        </div>
                         {supervisorItems.map(item => <ChecklistRow key={item} label={item} />)}
                        <SignatureRow label="Podpis" />
                    </Section>

                    <Section title="Brygadzista">
                         <div className="grid grid-cols-[1fr_40px_40px_40px] items-center border-b border-x border-black bg-gray-100">
                            <span className="px-2 py-0.5 font-bold text-sm"></span>
                            <div className="h-full flex items-center justify-center border-l font-bold text-xs">TAK</div>
                            <div className="h-full flex items-center justify-center border-l font-bold text-xs">NIE</div>
                            <div className="h-full flex items-center justify-center border-l font-bold text-xs">ND</div>
                        </div>
                        {foremanItems.map(item => <ChecklistRow key={item} label={item} />)}
                        <SignatureRow label="Podpis" />
                    </Section>
                </main>
            </div>
        </div>
    );
  }
);

CirculationCardPrintForm.displayName = 'CirculationCardPrintForm';
