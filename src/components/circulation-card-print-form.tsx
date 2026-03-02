
'use client';
/* eslint-disable @next/next/no-inline-styles */

import React from 'react';
import { Employee, CirculationCard } from '@/lib/types';
import { formatDate } from '@/lib/date';

interface CirculationCardPrintFormProps {
  employee: Employee | null;
  card: CirculationCard | null;
}

export const CirculationCardPrintForm = React.forwardRef<HTMLDivElement, CirculationCardPrintFormProps>(
  ({ employee, card }, ref) => {

    if (!employee || !card) {
      return <div ref={ref} />;
    }

    return (
      <div ref={ref}>
        <style type="text/css" media="print">
          {`
            @page {
              size: A4;
              margin: 0mm;
              padding: 0mm;
            }
            
            body, html {
              margin: 0 !important;
              padding: 0 !important;
              width: 210mm;
              height: 297mm;
              display: block;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
          `}
        </style>

        {/* Outer container - fills entire A4 */}
        <div className="bg-white text-black" style={{
          width: '210mm',
          height: '297mm',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          fontFamily: 'Times New Roman, serif',
          margin: 0,
          padding: 0,
          fontSize: '11pt',
          lineHeight: '1.4'
        }}>

          <div style={{ width: '100%' }}>
            {/* Header Section */}
            <div style={{ marginBottom: '6mm' }}>
              <h1 style={{ fontSize: '14pt', fontWeight: 'bold', margin: '0 0 2mm 0' }}>KARTA OBIEGOWA PRACOWNIKA</h1>
              <p style={{ fontSize: '9pt', fontWeight: '600', margin: 0 }}>Dokument potwierdzający zwrot wszystkich materiałów i wyposażenia</p>
            </div>

            {/* Employee Info Row - Centered block */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2mm',
              marginBottom: '8mm'
            }}>
              <div style={{ fontWeight: 'bold' }}>Dane Pracownika / Employee Details:</div>
              <div>Nazwisko i imię: <span style={{ fontWeight: 'bold' }}>{employee.fullName}</span></div>
              <div>Dział: <span style={{ fontWeight: 'bold' }}>{employee.department}</span></div>
              <div>Stanowisko: <span style={{ fontWeight: 'bold' }}>{employee.jobTitle}</span></div>
              <div>Numer karty: <span style={{ fontWeight: 'bold' }}>{employee.cardNumber}</span></div>
              <div>Data zwrotu: <span style={{ fontWeight: 'bold' }}>{formatDate(card.date, 'dd.MM.yyyy')}</span></div>
            </div>

            {/* Checklist Header */}
            <div style={{
              fontWeight: 'bold',
              marginBottom: '6mm',
            }}>
              ZWROT MATERIAŁÓW I WYPOSAŻENIA
            </div>

            {/* Checklist - Centered list without borders */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4mm',
              marginBottom: '12mm'
            }}>
              {/* Item 1 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1mm' }}>
                <div style={{ fontWeight: '600' }}>1. Odzież robocza</div>
                <div style={{ display: 'flex', gap: '4mm' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '1mm' }}>
                    <input type="checkbox" style={{ width: '3mm', height: '3mm' }} />
                    <span>Tak</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '1mm' }}>
                    <input type="checkbox" style={{ width: '3mm', height: '3mm' }} />
                    <span>Nie</span>
                  </label>
                </div>
              </div>

              {/* Item 2 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1mm' }}>
                <div style={{ fontWeight: '600' }}>2. Środki ochrony</div>
                <div style={{ display: 'flex', gap: '4mm' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '1mm' }}>
                    <input type="checkbox" style={{ width: '3mm', height: '3mm' }} />
                    <span>Tak</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '1mm' }}>
                    <input type="checkbox" style={{ width: '3mm', height: '3mm' }} />
                    <span>Nie</span>
                  </label>
                </div>
              </div>

              {/* Item 3 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1mm' }}>
                <div style={{ fontWeight: '600' }}>3. Karty dostępu</div>
                <div style={{ display: 'flex', gap: '4mm' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '1mm' }}>
                    <input type="checkbox" style={{ width: '3mm', height: '3mm' }} />
                    <span>Tak</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '1mm' }}>
                    <input type="checkbox" style={{ width: '3mm', height: '3mm' }} />
                    <span>Nie</span>
                  </label>
                </div>
              </div>

              {/* Item 4 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1mm' }}>
                <div style={{ fontWeight: '600' }}>4. Dokumenty</div>
                <div style={{ display: 'flex', gap: '4mm' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '1mm' }}>
                    <input type="checkbox" style={{ width: '3mm', height: '3mm' }} />
                    <span>Tak</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '1mm' }}>
                    <input type="checkbox" style={{ width: '3mm', height: '3mm' }} />
                    <span>Nie</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Signature Section */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12mm',
              marginTop: '16mm'
            }}>
              <div>(Podpis pracownika)</div>
              <div>(Podpis pracownika Magazynu)</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CirculationCardPrintForm.displayName = 'CirculationCardPrintForm';

