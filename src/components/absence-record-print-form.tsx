'use client';

import React from 'react';
import { AbsenceRecord } from '@/lib/types';
import { formatDate } from '@/lib/date';
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
              margin: 1.5cm;
            }
            body, html {
                margin: 0;
                padding: 0;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 10pt;
              line-height: 1.4;
            }
          `}
        </style>
        
        <div className="h-[25cm] flex flex-col justify-between p-4">
            <div>
                <header className="text-center mb-8">
                    <h1 className="text-base font-bold tracking-wider">OŚWIADCZENIE / ЗАЯВА</h1>
                </header>

                <p className="mb-4 text-sm">Oświadczam, że podwykonawca / Повідомляю, що виконавець:</p>
                
                <div className="border-b-2 border-black py-2 px-2 mb-1 text-center">
                    <p className="font-bold text-base tracking-wide">
                        {record.employeeFullName.toUpperCase()}
                    </p>
                </div>
                 <div className="text-center mb-6">
                    <p className="text-xs text-gray-500">({record.jobTitle}, {record.department})</p>
                </div>
                
                <div className="flex justify-between items-center mb-8 text-sm">
                    <div className="flex items-baseline">
                    <span className="mr-2">w dniu / в день:</span>
                    <span className="font-bold text-base border-b border-dotted border-black px-4">{formatDate(record.incidentDate, 'dd.MM.yyyy')}</span>
                    </div>
                    <div className="flex items-baseline ml-6">
                    <span className="mr-2">świadczył usługi w godzinach / працював:</span>
                    <span className="font-bold text-base border-b border-dotted border-black min-w-[140px] inline-block text-center">{record.hours || '________________'}</span>
                    </div>
                </div>

                <section className="space-y-6 mb-10">
                    <div className="flex items-start space-x-3">
                        <Checkbox id="reason1" checked={record.reason === 'no_card'} disabled className="mt-1 border-black disabled:opacity-100" />
                        <Label htmlFor="reason1" className="text-sm leading-relaxed cursor-default">
                            Nieodbicie dyskietki spowodowane było jej brakiem / Невідбиття карти сталося з причини її відсутності в цей день.
                        </Label>
                    </div>
                    <div className="flex items-start space-x-3">
                        <Checkbox id="reason2" checked={record.reason === 'forgot_to_scan'} disabled className="mt-1 border-black disabled:opacity-100" />
                        <Label htmlFor="reason2" className="text-sm leading-relaxed cursor-default">
                            Nieodbicie dyskietki na wejściu/wyjściu wynikło z zapomnienia / Не відбиття карти на вході/виході сталося через те, що виконавець забув карту.
                        </Label>
                    </div>
                </section>
            </div>
            
            <footer className="pt-20">
                <div className="flex justify-center">
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
