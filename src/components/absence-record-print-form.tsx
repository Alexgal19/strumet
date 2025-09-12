
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
      <div ref={ref} className="p-4 bg-white text-black font-sans print:p-0 print:shadow-none">
        <style type="text/css" media="print">
          {`
            @page { 
              size: A4;
              margin: 1.5cm;
            }
            html, body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              font-size: 11pt;
            }
            .print-container {
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              min-height: 24cm;
            }
            .grid-cols-form {
              grid-template-columns: 1fr 1fr;
            }
          `}
        </style>
        <div className="print-container">
          <div>
            <header className="text-center mb-6">
                <h1 className="text-lg font-bold">OŚWIADCZENIE/ЗАЯВА</h1>
            </header>

            <p className="mb-4">Oświadczam, że podwykonawca / Повідомляю, що виконавець:</p>
            
            <div className="grid grid-cols-form gap-4 border-2 border-black">
                <div className="p-2 bg-gray-200 text-center font-bold flex items-center justify-center">
                    {record.employeeFullName.toUpperCase()}
                </div>
                <div className="p-2 border-l-2 border-black text-center font-bold flex items-center justify-center">
                    {record.department.toUpperCase()}
                </div>
            </div>

            <div className="grid grid-cols-form border-2 border-t-0 border-black mb-6">
                <div className="p-2 flex items-center">
                   <span className="mr-4">w dniu / в день</span>
                   <span className="font-bold">{format(parseISO(record.incidentDate), 'dd.MM.yyyy')}</span>
                </div>
                <div className="p-2 border-l-2 border-black flex items-center h-12">
                   <span className="mr-4">świadczył usługi w godzinach / працював:</span>
                   <span className="font-bold"></span>
                </div>
            </div>

            <section className="space-y-6 mb-6">
                <div className="flex items-center space-x-3">
                    <Checkbox id="reason1" checked={record.reason === 'no_card'} readOnly />
                    <Label htmlFor="reason1" className="text-base">
                        Nieodbicie dyskietki spowodowane było jej brakiem / Невідбиття карти сталося з причини її відсутності в цей день.
                    </Label>
                </div>
                 <div className="flex items-center space-x-3">
                    <Checkbox id="reason2" checked={record.reason === 'forgot_to_scan'} readOnly />
                    <Label htmlFor="reason2" className="text-base">
                        Nieodbicie dyskietki na wejściu/wyjściu wynikło z zapomnienia / Не відбиття карти на вході/виході сталося через те, що виконавець забув карту.
                    </Label>
                </div>
            </section>
          </div>
            
          <footer className="pt-20">
              <div className="flex justify-between">
                  <div className="text-center w-2/5">
                      <div className="border-t border-black pt-1">
                           <p className="text-xs">(podpis pracownika)</p>
                      </div>
                  </div>
                  <div className="text-center w-2/5">
                      <div className="border-t border-black pt-1">
                           <p className="text-xs">(podpis kierownika)</p>
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

    