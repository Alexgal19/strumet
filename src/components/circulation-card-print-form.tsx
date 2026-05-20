
'use client';

import React from 'react';
import { Employee, CirculationCard } from '@/lib/types';
import { formatDate } from '@/lib/date';

interface CirculationCardPrintFormProps {
  employee: Employee | null;
  card: CirculationCard | null;
}

const checklistItems = [
  { id: 1, label: 'Odzież robocza' },
  { id: 2, label: 'Środki ochrony' },
  { id: 3, label: 'Karty dostępu' },
  { id: 4, label: 'Dokumenty' },
  { id: 5, label: 'Miara/Suwmiarka' },
];

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
              size: A4 portrait;
              margin: 0;
            }
            @media print {
              body, html {
                margin: 0 !important;
                padding: 0 !important;
                width: 210mm;
                height: 297mm;
              }
              .print-only {
                position: absolute;
                top: 0;
                left: 0;
                width: 210mm;
                height: 297mm;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          `}
        </style>

        <div style={{
          width: '210mm',
          height: '297mm',
          margin: '0 auto',
          padding: '0',
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '10.5pt',
          lineHeight: '1.6',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          backgroundColor: '#fff',
        }}>
          {/* Content wrapper - centered horizontally */}
          <div style={{
            width: '170mm',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '20mm',
          }}>
            {/* Header */}
            <div style={{
              textAlign: 'center',
              marginBottom: '10mm',
              paddingBottom: '5mm',
              borderBottom: '3px double #333',
              width: '100%',
            }}>
              <h1 style={{
                fontSize: '20pt',
                fontWeight: '700',
                margin: '0 0 2mm 0',
                letterSpacing: '3px',
                color: '#1a1a1a',
              }}>
                KARTA OBIEGOWA
              </h1>
              <p style={{
                fontSize: '9pt',
                color: '#666',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
              }}>
                Protokół zwrotu mienia firmowego
              </p>
            </div>

            {/* Employee Info - centered cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '4mm',
              width: '100%',
              marginBottom: '12mm',
            }}>
              {[
                { label: 'Pracownik', value: employee.fullName },
                { label: 'Data zwrotu', value: formatDate(card.date, 'dd.MM.yyyy') },
                { label: 'Dział', value: employee.department },
                { label: 'Stanowisko', value: employee.jobTitle },
                { label: 'Nr karty', value: employee.cardNumber },
              ].map((item, i) => (
                <div key={i} style={{
                  background: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  padding: '3mm 5mm',
                }}>
                  <div style={{ fontSize: '7pt', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1mm', fontWeight: '600' }}>
                    {item.label}
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '11pt', color: '#1a1a1a' }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Checklist */}
            <div style={{ width: '100%', marginBottom: '15mm' }}>
              <div style={{
                textAlign: 'center',
                fontWeight: '700',
                fontSize: '12pt',
                marginBottom: '6mm',
                color: '#1a1a1a',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
              }}>
                Lista kontrolna zwrotu
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4mm',
                alignItems: 'center',
              }}>
                {checklistItems.map((item) => (
                  <div key={item.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '3.5mm 6mm',
                    borderBottom: '1px solid #e5e5e5',
                  }}>
                    <span style={{
                      fontWeight: '700',
                      width: '8mm',
                      textAlign: 'left',
                      color: '#999',
                      fontSize: '9pt',
                    }}>{item.id}.</span>
                    <span style={{ fontWeight: '600', fontSize: '11pt', flex: 1, textAlign: 'center', color: '#333' }}>
                      {item.label}
                    </span>
                    <div style={{ display: 'flex', gap: '5mm', alignItems: 'center' }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2mm',
                        fontSize: '9pt',
                        color: '#555',
                      }}>
                        <div style={{
                          width: '4.5mm', height: '4.5mm',
                          border: '1.5px solid #888',
                          borderRadius: '2px',
                          display: 'inline-block',
                        }} />
                        Tak
                      </label>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2mm',
                        fontSize: '9pt',
                        color: '#555',
                      }}>
                        <div style={{
                          width: '4.5mm', height: '4.5mm',
                          border: '1.5px solid #888',
                          borderRadius: '2px',
                          display: 'inline-block',
                        }} />
                        Nie
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Podpisy */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              marginTop: 'auto',
              paddingTop: '20mm',
              paddingBottom: '15mm',
            }}>
              <div style={{ textAlign: 'center', width: '45%' }}>
                <div style={{
                  borderBottom: '2px solid #333',
                  height: '20mm',
                  marginBottom: '3mm',
                }} />
                <div style={{ fontSize: '9pt', color: '#555', fontWeight: '600' }}>
                  Podpis pracownika
                </div>
              </div>
              <div style={{ textAlign: 'center', width: '45%' }}>
                <div style={{
                  borderBottom: '2px solid #333',
                  height: '20mm',
                  marginBottom: '3mm',
                }} />
                <div style={{ fontSize: '9pt', color: '#555', fontWeight: '600' }}>
                  Podpis pracownika Magazynu
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CirculationCardPrintForm.displayName = 'CirculationCardPrintForm';
