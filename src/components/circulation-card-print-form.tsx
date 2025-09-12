'use client';

import React from 'react';
import { Employee } from '@/lib/types';
import { format } from 'date-fns';

interface CirculationCardPrintFormProps {
  employee: Employee | null;
}

const Checkbox = () => <div className="w-4 h-4 border-2 border-black"></div>;

const TableRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <tr className="border-b border-black">
        <td className="border-r border-black p-2">{label}</td>
        <td className="p-2 font-semibold text-center">{children}</td>
    </tr>
);

const ChecklistRow = ({ label }: { label: string }) => (
    <tr className="border-b border-black text-center">
        <td className="border-r border-black p-2 text-left">{label}</td>
        <td className="border-r border-black p-2 flex justify-center items-center"><Checkbox /></td>
        <td className="border-r border-black p-2 flex justify-center items-center"><Checkbox /></td>
        <td className="p-2 flex justify-center items-center"><Checkbox /></td>
    </tr>
);

export const CirculationCardPrintForm = React.forwardRef<HTMLDivElement, CirculationCardPrintFormProps>(
  ({ employee }, ref) => {
    
    if (!employee) {
        return <div ref={ref} className="hidden" />;
    }

    return (
      <div ref={ref} className="bg-white text-black text-sm p-4 font-sans">
        <style type="text/css" media="print">
          {`
            @page {
              size: A4;
              margin: 1cm;
            }
            html, body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              font-size: 10pt;
              background-color: white;
            }
          `}
        </style>
        
        <h1 className="text-center font-bold text-lg mb-6">KARTA OBIEGOWA</h1>

        <table className="w-full border-collapse border border-black mb-6">
            <tbody>
                <TableRow label="Nazwisko Imię">{employee.fullName}</TableRow>
                <TableRow label="Stanowisko">{employee.jobTitle}</TableRow>
                <TableRow label="Dział">{employee.department}</TableRow>
                <TableRow label="Nr karty RCP:">{employee.cardNumber}</TableRow>
                <TableRow label="Data:">{format(new Date(), 'dd.MM.yyyy')}</TableRow>
            </tbody>
        </table>

        <div className="space-y-6">
            {/* Magazyn */}
            <div>
                <h2 className="text-center font-bold bg-gray-200 p-2 border border-b-0 border-black">Magazyn</h2>
                <table className="w-full border-collapse border border-black">
                    <thead>
                        <tr className="border-b border-black bg-gray-100 text-center font-bold">
                            <td className="border-r border-black p-2 w-1/2">Zwrot odzieży</td>
                            <td className="border-r border-black p-2">TAK</td>
                            <td className="border-r border-black p-2">NIE</td>
                            <td className="p-2">NIE DOTYCZY</td>
                        </tr>
                    </thead>
                    <tbody>
                        <ChecklistRow label="spodnie" />
                        <ChecklistRow label="bluza" />
                        <ChecklistRow label="buty" />
                        <ChecklistRow label="koszulka" />
                        <ChecklistRow label="koszula" />
                        <ChecklistRow label="pas" />
                        <ChecklistRow label="zarękawnik P-L" />
                        <ChecklistRow label="przyłbica" />
                        <ChecklistRow label="fartuch" />
                        <tr className="border-b-0">
                            <td colSpan={4} className="p-2 h-14 bg-gray-200 align-bottom">Podpis pracownika Magazynu</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Informatyk */}
            <div>
                <h2 className="text-center font-bold bg-gray-200 p-2 border border-b-0 border-black">Informatyk</h2>
                <table className="w-full border-collapse border border-black">
                    <tr className="border-b border-black text-center">
                        <td className="border-r border-black p-2 w-1/2">Zwrot karty</td>
                        <td className="border-r border-black p-2 font-bold bg-green-200">TAK</td>
                        <td className="border-r border-black p-2">Data</td>
                        <td className="p-2">Podpis</td>
                    </tr>
                    <tr className="h-14">
                        <td className="border-r border-black p-2"></td>
                        <td className="border-r border-black p-2"></td>
                        <td className="border-r border-black p-2"></td>
                        <td className="p-2"></td>
                    </tr>
                </table>
            </div>

             {/* Opiekun */}
            <div>
                <h2 className="text-center font-bold bg-gray-200 p-2 border border-b-0 border-black">Opiekun</h2>
                <table className="w-full border-collapse border border-black">
                    <thead>
                        <tr className="border-b border-black bg-gray-100 text-center font-bold">
                            <td className="border-r border-black p-2 w-1/2"></td>
                            <td className="border-r border-black p-2">TAK</td>
                            <td className="border-r border-black p-2">NIE</td>
                            <td className="p-2">NIE DOTYCZY</td>
                        </tr>
                    </thead>
                    <tbody>
                        <ChecklistRow label="Zwrot kluczy do szafki na ubraniowej" />
                        <ChecklistRow label="Zwrot kluczy do szafki na wydziale" />
                        <ChecklistRow label="Szlifierka" />
                        <tr className="border-b-0">
                            <td colSpan={4} className="p-2 h-14 bg-gray-200 align-bottom">Podpis</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
             {/* Brygadzista */}
            <div>
                <h2 className="text-center font-bold bg-gray-200 p-2 border border-b-0 border-black">Brygadzista</h2>
                <table className="w-full border-collapse border border-black">
                    <thead>
                        <tr className="border-b border-black bg-gray-100 text-center font-bold">
                            <td className="border-r border-black p-2 w-1/2"></td>
                            <td className="border-r border-black p-2">TAK</td>
                            <td className="border-r border-black p-2">NIE</td>
                            <td className="p-2">NIE DOTYCZY</td>
                        </tr>
                    </thead>
                    <tbody>
                        <ChecklistRow label="Miarka" />
                        <ChecklistRow label="Kabel spawalniczy" />
                        <ChecklistRow label="Masa" />
                        <tr className="border-b-0">
                            <td colSpan={4} className="p-2 h-14 bg-gray-200 align-bottom">Podpis</td>
                        </tr>
                    </tbody>
                </table>
            </div>

        </div>
      </div>
    );
  }
);

CirculationCardPrintForm.displayName = 'CirculationCardPrintForm';
