
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
  { id: 4, label: 'Miara/Suwmiarka' },
];

export const CirculationCardPrintForm = React.forwardRef<HTMLDivElement, CirculationCardPrintFormProps>(
  ({ employee, card }, ref) => {

    if (!employee || !card) {
      return <div ref={ref} />;
    }

    return (
      <div ref={ref} style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '15mm 10mm',
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '10.5pt',
        lineHeight: '1.6',
        boxSizing: 'border-box',
        backgroundColor: '#fff',
        textAlign: 'center',
        marginLeft: 'auto',
        marginRight: 'auto',
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '10mm',
          paddingBottom: '5mm',
          borderBottom: '3px double #333',
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
            fontSize: '8.5pt',
            color: '#666',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
          }}>
            Protokół zwrotu mienia firmowego
          </p>
        </div>

        {/* Employee Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '3mm',
          marginBottom: '10mm',
          maxWidth: '170mm',
          marginLeft: 'auto',
          marginRight: 'auto',
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
              borderRadius: '5px',
              padding: '2.5mm 4mm',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '6.5pt', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5mm', fontWeight: '600' }}>
                {item.label}
              </div>
              <div style={{ fontWeight: '700', fontSize: '10pt', color: '#1a1a1a' }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Checklist */}
        <div style={{ marginBottom: '12mm', maxWidth: '170mm', marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{
            fontWeight: '700',
            fontSize: '11pt',
            marginBottom: '5mm',
            color: '#1a1a1a',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            Lista kontrolna zwrotu
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '3mm',
          }}>
            {checklistItems.map((item) => (
              <div key={item.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '3mm 5mm',
                borderBottom: '1px solid #e5e5e5',
              }}>
                <span style={{
                  fontWeight: '700',
                  width: '6mm',
                  textAlign: 'left',
                  color: '#999',
                  fontSize: '8.5pt',
                }}>{item.id}.</span>
                <span style={{ fontWeight: '600', fontSize: '10pt', flex: 1, textAlign: 'center', color: '#333' }}>
                  {item.label}
                </span>
                <div style={{ display: 'flex', gap: '4mm', alignItems: 'center' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.5mm',
                    fontSize: '8.5pt',
                    color: '#555',
                  }}>
                    <div style={{
                      width: '4mm', height: '4mm',
                      border: '1.5px solid #888',
                      borderRadius: '1.5px',
                      display: 'inline-block',
                    }} />
                    Tak
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.5mm',
                    fontSize: '8.5pt',
                    color: '#555',
                  }}>
                    <div style={{
                      width: '4mm', height: '4mm',
                      border: '1.5px solid #888',
                      borderRadius: '1.5px',
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
          maxWidth: '170mm',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingTop: '20mm',
        }}>
          <div style={{ textAlign: 'center', width: '45%' }}>
            <div style={{
              borderBottom: '1.5px solid #333',
              height: '18mm',
              marginBottom: '2mm',
            }} />
            <div style={{ fontSize: '8.5pt', color: '#555', fontWeight: '600' }}>
              Podpis pracownika
            </div>
          </div>
          <div style={{ textAlign: 'center', width: '45%' }}>
            <div style={{
              borderBottom: '1.5px solid #333',
              height: '18mm',
              marginBottom: '2mm',
            }} />
            <div style={{ fontSize: '8.5pt', color: '#555', fontWeight: '600' }}>
              Podpis pracownika Magazynu
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CirculationCardPrintForm.displayName = 'CirculationCardPrintForm';
