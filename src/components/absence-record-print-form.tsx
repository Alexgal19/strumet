'use client';

import React from 'react';
import { AbsenceRecord } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

interface AbsenceRecordPrintFormProps {
  record: AbsenceRecord | null;
}

export const AbsenceRecordPrintForm = React.forwardRef<HTMLDivElement, AbsenceRecordPrintFormProps>(
  ({ record }, ref) => {
    
    if (!record) {
        return <div ref={ref} />;
    }

    return (
      <div ref={ref} className="bg-white text-black font-sans">
        <style type="text/css" media="print">
          {`
            @page {
              size: A4;
              margin: 0;
            }
            html, body {
              height: 100%;
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              font-size: 11pt;
            }
            .print-area {
                padding: 1.5cm;
                height: 100%;
                box-sizing: border-box;
            }
          `}
        </style>
        
        <div className="print-area">
            <header className="text-center mb-10">
                <h1 className="text-lg font-bold tracking-wider">OŚWIADCZENIE / ЗАЯВА</h1>
            </header>

            <p className="mb-6">Oświadczam, że podwykonawca / Повідомляю, що виконавець:</p>
            
            <div className="border-b-2 border-black py-2 px-2 mb-4">
              <p className="text-center font-bold text-base tracking-wide">
                {record.employeeFullName.toUpperCase()}
              </p>
            </div>
             <div className="text-center text-base mb-4">
                <span className="text-gray-600">Dział:</span> {record.department}
            </div>
            <div className="text-center text-base mb-6">
                 <span className="text-gray-600">Stanowisko:</span> {record.jobTitle}
            </div>


            <div className="flex justify-between items-center mb-8 text-sm">
                <div className="flex items-baseline">
                   <span className="mr-2">w dniu / в день:</span>
                   <span className="font-bold text-base border-b border-dotted border-black px-4">{record.incidentDate ? format(parseISO(record.incidentDate), 'dd.MM.yyyy') : ''}</span>
                </div>
                <div className="flex items-baseline">
                   <span className="mr-2">świadczył usługi w godzinach / працював:</span>
                   <span className="font-bold text-base border-b border-dotted border-black min-w-[150px] inline-block text-center">{record.hours || '________________'}</span>
                </div>
            </div>

            <section className="space-y-8 mb-8">
                <div className="flex items-start space-x-3">
                    <Checkbox id="reason1" checked={record.reason === 'no_card'} readOnly className="mt-1 border-black" />
                    <Label htmlFor="reason1" className="text-sm leading-relaxed cursor-default">
                        Nieodbicie dyskietki spowodowane było jej brakiem / Невідбиття карти сталося з причини її відсутності в цей день.
                    </Label>
                </div>
                 <div className="flex items-start space-x-3">
                    <Checkbox id="reason2" checked={record.reason === 'forgot_to_scan'} readOnly className="mt-1 border-black" />
                    <Label htmlFor="reason2" className="text-sm leading-relaxed cursor-default">
                        Nieodbicie dyskietki na wejściu/wyjściu wynikło z zapomnienia / Не відбиття карти на вході/виході сталося через те, що виконавець забув карту.
                    </Label>
                </div>
            </section>
            
            <footer className="mt-32">
                <div className="flex justify-between">
                    <div className="text-center w-2/5">
                        <div className="border-t border-gray-400 pt-1">
                             <p className="text-xs text-gray-600">(podpis pracownika)</p>
                        </div>
                    </div>
                    <div className="text-center w-2/5">
                        <div className="border-t border-gray-400 pt-1">
                             <p className="text-xs text-gray-600">(podpis kierownika)</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
      </div>
    );
  }
);

AbsenceRecordPrintForm.displayName = 'AbsenceRecordPrintForm';
