
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
          fontFamily: 'Times New Roman, serif',
          margin: 0,
          padding: 0,
          fontSize: '10pt',
          lineHeight: '1.4'
        }}>
          
          {/* Header Section */}
          <div style={{
            textAlign: 'center',
            borderBottom: '2px solid black',
            paddingTop: '8mm',
            paddingBottom: '4mm',
            paddingLeft: '8mm',
            paddingRight: '8mm',
            flexShrink: 0
          }}>
            <h1 style={{
              fontSize: '14pt',
              fontWeight: 'bold',
              margin: '0 0 2mm 0'
            }}>KARTA OBIEGOWA PRACOWNIKA</h1>
            <p style={{
              fontSize: '9pt',
              fontWeight: '600',
              margin: 0
            }}>Dokument potwierdzający zwrot wszystkich materiałów i wyposażenia</p>
          </div>

          {/* Employee Info Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '4mm',
            paddingBottom: '4mm',
            paddingLeft: '8mm',
            paddingRight: '8mm',
            fontSize: '9pt',
            borderBottom: '1px solid #ccc',
            flexShrink: 0,
            gap: '8mm'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: '1mm' }}>
                <span style={{ fontWeight: '600' }}>Nazwisko i imię:</span> 
                <span style={{ fontWeight: 'bold', marginLeft: '2mm' }}>{employee.fullName}</span>
              </div>
              <div>
                <span style={{ fontWeight: '600' }}>Dział:</span> 
                <span style={{ marginLeft: '2mm' }}>{employee.department}</span>
              </div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ marginBottom: '1mm' }}>
                <span style={{ fontWeight: '600' }}>Data:</span> 
                <span style={{ fontWeight: 'bold', marginLeft: '2mm' }}>{formatDate(card.date, 'dd.MM.yyyy')}</span>
              </div>
              <div>
                <span style={{ fontWeight: '600' }}>Stanowisko:</span> 
                <span style={{ marginLeft: '2mm' }}>{employee.jobTitle}</span>
              </div>
            </div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div style={{ marginBottom: '1mm' }}>
                <span style={{ fontWeight: '600' }}>Numer karty:</span>
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>{employee.cardNumber}</div>
            </div>
          </div>

          {/* Checklist Header */}
          <div style={{
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '9pt',
            textDecoration: 'underline',
            paddingTop: '3mm',
            paddingBottom: '2mm',
            paddingLeft: '8mm',
            paddingRight: '8mm',
            flexShrink: 0
          }}>
            ZWROT MATERIAŁÓW I WYPOSAŻENIA
          </div>

          {/* Checklist - 4 columns grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '6mm',
            paddingTop: '3mm',
            paddingBottom: '3mm',
            paddingLeft: '8mm',
            paddingRight: '8mm',
            fontSize: '9pt',
            flex: 1,
            alignContent: 'start'
          }}>
            {/* Item 1 */}
            <div style={{ 
              borderLeft: '2px solid black',
              paddingLeft: '2mm'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '1mm', fontSize: '8.5pt' }}>
                1. Odzież robocza
              </div>
              <div style={{ display: 'flex', gap: '4mm', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '1.5mm' }}>
                  <input type="checkbox" style={{ width: '3mm', height: '3mm' }} />
                  <span style={{ fontSize: '8pt' }}>Tak</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '1.5mm' }}>
                  <input type="checkbox" style={{ width: '3mm', height: '3mm' }} />
                  <span style={{ fontSize: '8pt' }}>Nie</span>
                </label>
              </div>
            </div>

            {/* Item 2 */}
            <div style={{ 
              borderLeft: '2px solid black',
              paddingLeft: '2mm'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '1mm', fontSize: '8.5pt' }}>
                2. Środki ochrony
              </div>
              <div style={{ display: 'flex', gap: '4mm', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '1.5mm' }}>
                  <input type="checkbox" style={{ width: '3mm', height: '3mm' }} />
                  <span style={{ fontSize: '8pt' }}>Tak</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '1.5mm' }}>
                  <input type="checkbox" style={{ width: '3mm', height: '3mm' }} />
                  <span style={{ fontSize: '8pt' }}>Nie</span>
                </label>
              </div>
            </div>

            {/* Item 3 */}
            <div style={{ 
              borderLeft: '2px solid black',
              paddingLeft: '2mm'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '1mm', fontSize: '8.5pt' }}>
                3. Karty dostępu
              </div>
              <div style={{ display: 'flex', gap: '4mm', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '1.5mm' }}>
                  <input type="checkbox" style={{ width: '3mm', height: '3mm' }} />
                  <span style={{ fontSize: '8pt' }}>Tak</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '1.5mm' }}>
                  <input type="checkbox" style={{ width: '3mm', height: '3mm' }} />
                  <span style={{ fontSize: '8pt' }}>Nie</span>
                </label>
              </div>
            </div>

            {/* Item 4 */}
            <div style={{ 
              borderLeft: '2px solid black',
              paddingLeft: '2mm'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '1mm', fontSize: '8.5pt' }}>
                4. Dokumenty
              </div>
              <div style={{ display: 'flex', gap: '4mm', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '1.5mm' }}>
                  <input type="checkbox" style={{ width: '3mm', height: '3mm' }} />
                  <span style={{ fontSize: '8pt' }}>Tak</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '1.5mm' }}>
                  <input type="checkbox" style={{ width: '3mm', height: '3mm' }} />
                  <span style={{ fontSize: '8pt' }}>Nie</span>
                </label>
              </div>
            </div>
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Separator Line */}
          <div style={{
            borderTop: '2px solid black',
            margin: '0 8mm',
            flexShrink: 0
          }} />

          {/* Signature Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8mm',
            paddingTop: '6mm',
            paddingBottom: '8mm',
            paddingLeft: '8mm',
            paddingRight: '8mm',
            flexShrink: 0
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                borderTop: '1px solid black',
                paddingTop: '2mm',
                minHeight: '12mm',
                marginBottom: '2mm'
              }} />
              <div style={{ fontSize: '9pt', fontWeight: '600' }}>
                Podpis pracownika
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                borderTop: '1px solid black',
                paddingTop: '2mm',
                minHeight: '12mm',
                marginBottom: '2mm'
              }} />
              <div style={{ fontSize: '9pt', fontWeight: '600' }}>
                Podpis pracownika Magazynu
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CirculationCardPrintForm.displayName = 'CirculationCardPrintForm';

