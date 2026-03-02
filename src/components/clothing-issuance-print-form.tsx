
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

        const isFullSetDescription = issuance.items.length === 1 && issuance.items[0].id === 'full-set';

        let itemsToRender: { name: string; quantity: number }[] = [];

        if (isFullSetDescription) {
            const description = issuance.items[0].name || '';
            itemsToRender = description.split('\n').map(line => line.trim()).filter(line => line).map(name => ({ name, quantity: 1 }));
        } else {
            itemsToRender = issuance.items;
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
                <div className="h-full flex flex-col justify-center items-center text-center">
                    <div className="w-full">
                        <header className="mb-6">
                            <h1 className="text-lg font-bold">POTWIERDZENIE WYDANIA ODZIEŻY ROBOCZEJ</h1>
                            <p className="text-sm">(Workwear Issuance Confirmation)</p>
                        </header>

                        <div className="mb-4">
                            <p>Data wydania: {formatDate(issuance.date, 'dd.MM.yyyy')}</p>
                        </div>

                        <section className="space-y-2 mb-6 text-sm flex flex-col items-center">
                            <p><strong>Dane Pracownika / Employee Details:</strong></p>
                            <div className="flex flex-col items-center gap-1">
                                <p>Imię i nazwisko: <span className="font-semibold">{employee.fullName}</span></p>
                                <p>Stanowisko: <span className="font-semibold">{employee.jobTitle}</span></p>
                                <p>Dział: <span className="font-semibold">{employee.department}</span></p>
                                <p>Numer karty: <span className="font-semibold">{employee.cardNumber}</span></p>
                            </div>
                        </section>

                        <section className="mb-8">
                            <p className="font-bold text-sm mb-4">Wydane elementy / Issued Items:</p>
                            <div className="text-sm flex flex-col items-center space-y-2">
                                {itemsToRender.map((item, index) => (
                                    <div key={index} className="flex flex-col items-center justify-center gap-1">
                                        <span className="font-medium">{item.name} <span className="text-xs font-normal text-gray-700">(x{item.quantity})</span></span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <footer className="text-sm mt-12 flex flex-col items-center gap-12 pt-8">
                            <div>
                                <p className="text-xs">(data i podpis pracownika)</p>
                            </div>
                            <div>
                                <p className="text-xs">(podpis osoby wydającej)</p>
                            </div>
                        </footer>
                    </div>
                </div>
            </div>
        );
    }
);

ClothingIssuancePrintForm.displayName = 'ClothingIssuancePrintForm';
