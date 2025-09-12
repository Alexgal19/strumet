'use client';

import React from 'react';
import { Employee } from '@/lib/types';
import { format } from 'date-fns';

interface CirculationCardPrintFormProps {
  employee: Employee | null;
}

const InfoRow = ({ label, value }: { label: string, value: string | undefined }) => (
    <div className="flex justify-between border-b border-black py-1 text-sm">
        <span className="text-gray-600">{label}:</span>
        <span className="font-bold text-right">{value || '.........................'}</span>
    </div>
);

const ChecklistSection = ({ title, items, signatureLabel }: { title: string, items: string[], signatureLabel: string }) => (
    <div className="border border-black">
        <h2 className="text-center font-bold bg-gray-200 p-1 border-b border-black">{title}</h2>
        <div className="p-3">
            <div className="grid grid-cols-[1fr_auto_auto_auto] items-center text-center text-xs font-bold mb-2">
                <div></div>
                <div className="w-12">TAK</div>
                <div className="w-12">NIE</div>
                <div className="w-16">NIE DOT.</div>
            </div>
            {items.map((item, index) => (
                <div key={index} className="grid grid-cols-[1fr_auto_auto_auto] items-center text-sm py-1">
                    <span>{item}</span>
                    <div className="w-5 h-5 border-2 border-black mx-auto"></div>
                    <div className="w-5 h-5 border-2 border-black mx-auto"></div>
                    <div className="w-5 h-5 border-2 border-black mx-auto"></div>
                </div>
            ))}
        </div>
        <div className="border-t border-black p-2 mt-4 text-right text-xs h-16 flex justify-end items-end">
             <div className="border-t border-gray-500 w-48 text-center pt-1">{signatureLabel}</div>
        </div>
    </div>
);

export const CirculationCardPrintForm = React.forwardRef<HTMLDivElement, CirculationCardPrintFormProps>(
  ({ employee }, ref) => {
    
    if (!employee) {
        return <div ref={ref} className="hidden" />;
    }

    return (
      <div ref={ref} className="bg-white text-black font-sans">
        <style type="text/css" media="print">
          {`
            @page {
              size: A4;
              margin: 0;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 10pt;
              background-color: white;
            }
          `}
        </style>
        <div className="p-[1.5cm]">
            <h1 className="text-center font-bold text-lg mb-6">KARTA OBIEGOWA PRACOWNIKA</h1>

            <div className="border-2 border-black p-3 mb-6 space-y-1">
                <InfoRow label="Nazwisko i Imię" value={employee.fullName} />
                <InfoRow label="Stanowisko" value={employee.jobTitle} />
                <InfoRow label="Dział" value={employee.department} />
                <InfoRow label="Nr karty RCP" value={employee.cardNumber} />
                <InfoRow label="Data zwolnienia" value={format(new Date(), 'dd.MM.yyyy')} />
            </div>

            <div className="space-y-4">
                <ChecklistSection 
                    title="Magazyn"
                    items={["Spodnie", "Bluza", "Buty", "Koszulka", "Koszula", "Pas", "Zarękawnik P-L", "Przyłbica", "Fartuch"]}
                    signatureLabel="Podpis pracownika Magazynu"
                />
                 <div className="border border-black">
                    <h2 className="text-center font-bold bg-gray-200 p-1 border-b border-black">Dział IT / Informatyk</h2>
                    <div className="p-3 flex justify-between items-center h-16">
                        <p className="text-sm font-semibold">Zwrot karty RCP</p>
                        <div className="border-t border-gray-500 w-48 text-center pt-1 text-xs">Data i podpis</div>
                    </div>
                </div>
                 <ChecklistSection 
                    title="Opiekun / Lider"
                    items={["Zwrot kluczy do szafki ubraniowej", "Zwrot kluczy do szafki na wydziale", "Szlifierka"]}
                    signatureLabel="Podpis Opiekuna / Lidera"
                />
                 <ChecklistSection 
                    title="Brygadzista"
                    items={["Miarka", "Kabel spawalniczy", "Masa"]}
                    signatureLabel="Podpis Brygadzisty"
                />
            </div>
             <div className="mt-8 text-right">
                <div className="inline-block border-t-2 border-black w-72 text-center pt-1 text-xs">Podpis pracownika</div>
            </div>
        </div>
      </div>
    );
  }
);

CirculationCardPrintForm.displayName = 'CirculationCardPrintForm';
