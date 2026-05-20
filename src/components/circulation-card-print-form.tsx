
'use client';

import React from 'react';
import { Employee, CirculationCard } from '@/lib/types';
import { formatDate } from '@/lib/date';

interface CirculationCardPrintFormProps {
  employee: Employee | null;
  card: CirculationCard | null;
  variant?: 'classic' | 'modern' | 'extended';
}

const checklistItems = [
  { id: 1, label: 'Odzież robocza' },
  { id: 2, label: 'Środki ochrony' },
  { id: 3, label: 'Karty dostępu' },
  { id: 4, label: 'Dokumenty' },
  { id: 5, label: 'Miara/Suwmiarka' },
];

// ─── WARIANT 1: KLASYCZNY ───────────────────────────────────────────
function ClassicVariant({ employee, card }: CirculationCardPrintFormProps) {
  return (
    <div className="bg-white text-black" style={{
      width: '210mm',
      minHeight: '297mm',
      padding: '15mm 20mm',
      fontFamily: 'Times New Roman, serif',
      fontSize: '11pt',
      lineHeight: '1.5',
      boxSizing: 'border-box',
    }}>
      {/* Nagłówek z ramką */}
      <div style={{
        border: '2px solid #000',
        padding: '6mm',
        textAlign: 'center',
        marginBottom: '8mm',
        borderRadius: '2px',
      }}>
        <h1 style={{ fontSize: '16pt', fontWeight: 'bold', margin: '0 0 2mm 0', letterSpacing: '1px' }}>
          KARTA OBIEGOWA PRACOWNIKA
        </h1>
        <p style={{ fontSize: '9pt', margin: 0, opacity: 0.8 }}>
          Dokument potwierdzający zwrot wszystkich materiałów i wyposażenia firmowego
        </p>
      </div>

      {/* Dane pracownika - tabela */}
      <div style={{ marginBottom: '8mm' }}>
        <div style={{
          fontWeight: 'bold',
          fontSize: '10pt',
          marginBottom: '3mm',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          borderBottom: '1px solid #000',
          paddingBottom: '1mm',
        }}>
          Dane pracownika
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11pt' }}>
          <tbody>
            {[
              ['Nazwisko i imię', employee!.fullName],
              ['Dział', employee!.department],
              ['Stanowisko', employee!.jobTitle],
              ['Numer karty', employee!.cardNumber],
              ['Data zwrotu', formatDate(card?.date, 'dd.MM.yyyy')],
            ].map(([label, value], i) => (
              <tr key={i}>
                <td style={{
                  width: '40%',
                  padding: '2mm 3mm',
                  fontWeight: '600',
                  borderBottom: '1px solid #ccc',
                  verticalAlign: 'middle',
                }}>
                  {label}
                </td>
                <td style={{
                  padding: '2mm 3mm',
                  borderBottom: '1px solid #ccc',
                  fontWeight: 'bold',
                  fontSize: '12pt',
                }}>
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Checklist */}
      <div style={{ marginBottom: '10mm' }}>
        <div style={{
          fontWeight: 'bold',
          fontSize: '10pt',
          marginBottom: '3mm',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          borderBottom: '1px solid #000',
          paddingBottom: '1mm',
        }}>
          Zwrot materiałów i wyposażenia
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11pt' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th style={{
                width: '8%',
                padding: '2mm 2mm',
                border: '1px solid #000',
                textAlign: 'center',
                fontWeight: 'bold',
              }}>Lp.</th>
              <th style={{
                padding: '2mm 3mm',
                border: '1px solid #000',
                textAlign: 'left',
                fontWeight: 'bold',
              }}>Materiał / Wyposażenie</th>
              <th style={{
                width: '15%',
                padding: '2mm 2mm',
                border: '1px solid #000',
                textAlign: 'center',
                fontWeight: 'bold',
              }}>Zwrócono</th>
              <th style={{
                width: '15%',
                padding: '2mm 2mm',
                border: '1px solid #000',
                textAlign: 'center',
                fontWeight: 'bold',
              }}>Nie zwrócono</th>
            </tr>
          </thead>
          <tbody>
            {checklistItems.map((item) => (
              <tr key={item.id}>
                <td style={{
                  padding: '3mm 2mm',
                  border: '1px solid #000',
                  textAlign: 'center',
                  fontWeight: '600',
                }}>{item.id}</td>
                <td style={{
                  padding: '3mm 3mm',
                  border: '1px solid #000',
                  fontWeight: '600',
                }}>{item.label}</td>
                <td style={{
                  padding: '3mm 2mm',
                  border: '1px solid #000',
                  textAlign: 'center',
                }}>
                  <div style={{
                    width: '5mm', height: '5mm', border: '1.5px solid #000',
                    display: 'inline-block', borderRadius: '1px',
                  }} />
                </td>
                <td style={{
                  padding: '3mm 2mm',
                  border: '1px solid #000',
                  textAlign: 'center',
                }}>
                  <div style={{
                    width: '5mm', height: '5mm', border: '1.5px solid #000',
                    display: 'inline-block', borderRadius: '1px',
                  }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Podpisy - obok siebie */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        marginTop: '20mm',
        paddingTop: '8mm',
      }}>
        <div style={{ textAlign: 'center', width: '40%' }}>
          <div style={{
            borderBottom: '1px solid #000',
            height: '15mm',
            marginBottom: '2mm',
          }} />
          <div style={{ fontSize: '9pt', fontWeight: '600' }}>(Podpis pracownika)</div>
        </div>
        <div style={{ textAlign: 'center', width: '40%' }}>
          <div style={{
            borderBottom: '1px solid #000',
            height: '15mm',
            marginBottom: '2mm',
          }} />
          <div style={{ fontSize: '9pt', fontWeight: '600' }}>(Podpis pracownika Magazynu)</div>
        </div>
      </div>
    </div>
  );
}

// ─── WARIANT 2: NOWOCZESNY ───────────────────────────────────────────
function ModernVariant({ employee, card }: CirculationCardPrintFormProps) {
  return (
    <div className="bg-white text-black" style={{
      width: '210mm',
      minHeight: '297mm',
      padding: '18mm 25mm',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontSize: '10.5pt',
      lineHeight: '1.6',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
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
          fontSize: '18pt',
          fontWeight: '700',
          margin: '0 0 2mm 0',
          letterSpacing: '2px',
          color: '#1a1a1a',
        }}>
          KARTA OBIEGOWA
        </h1>
        <p style={{
          fontSize: '8.5pt',
          color: '#666',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          Protokół zwrotu mienia firmowego
        </p>
      </div>

      {/* Employee Info - centered cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '3mm',
        width: '100%',
        marginBottom: '10mm',
      }}>
        {[
          { label: 'Pracownik', value: employee!.fullName },
          { label: 'Data zwrotu', value: formatDate(card?.date, 'dd.MM.yyyy') },
          { label: 'Dział', value: employee!.department },
          { label: 'Stanowisko', value: employee!.jobTitle },
          { label: 'Nr karty', value: employee!.cardNumber },
        ].map((item, i) => (
          <div key={i} style={{
            background: '#f8f8f8',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            padding: '2.5mm 4mm',
          }}>
            <div style={{ fontSize: '7.5pt', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5mm' }}>
              {item.label}
            </div>
            <div style={{ fontWeight: '600', fontSize: '11pt' }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Checklist */}
      <div style={{ width: '100%', marginBottom: '12mm' }}>
        <div style={{
          textAlign: 'center',
          fontWeight: '700',
          fontSize: '11pt',
          marginBottom: '5mm',
          color: '#333',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          Lista kontrolna zwrotu
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '3mm',
          alignItems: 'center',
        }}>
          {checklistItems.map((item) => (
            <div key={item.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6mm',
              width: '80%',
              padding: '3mm 0',
              borderBottom: '1px solid #eee',
            }}>
              <span style={{
                fontWeight: '700',
                width: '6mm',
                textAlign: 'center',
                color: '#999',
                fontSize: '9pt',
              }}>{item.id}.</span>
              <span style={{ fontWeight: '600', fontSize: '11pt', flex: 1, textAlign: 'center' }}>
                {item.label}
              </span>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5mm',
                fontSize: '9pt',
                color: '#555',
              }}>
                <div style={{
                  width: '4mm', height: '4mm',
                  border: '1.5px solid #999',
                  borderRadius: '2px',
                  display: 'inline-block',
                }} />
                Tak
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5mm',
                fontSize: '9pt',
                color: '#555',
              }}>
                <div style={{
                  width: '4mm', height: '4mm',
                  border: '1.5px solid #999',
                  borderRadius: '2px',
                  display: 'inline-block',
                }} />
                Nie
              </label>
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
        paddingTop: '15mm',
      }}>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <div style={{
            borderBottom: '1.5px solid #333',
            height: '18mm',
            marginBottom: '2mm',
          }} />
          <div style={{ fontSize: '8.5pt', color: '#666', fontWeight: '600' }}>
            Podpis pracownika
          </div>
        </div>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <div style={{
            borderBottom: '1.5px solid #333',
            height: '18mm',
            marginBottom: '2mm',
          }} />
          <div style={{ fontSize: '8.5pt', color: '#666', fontWeight: '600' }}>
            Podpis pracownika Magazynu
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── WARIANT 3: ROZBUDOWANY ──────────────────────────────────────────
function ExtendedVariant({ employee, card }: CirculationCardPrintFormProps) {
  return (
    <div className="bg-white text-black" style={{
      width: '210mm',
      minHeight: '297mm',
      padding: '12mm 18mm',
      fontFamily: 'Times New Roman, serif',
      fontSize: '10.5pt',
      lineHeight: '1.5',
      boxSizing: 'border-box',
    }}>
      {/* Nagłówek firmowy */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid #000',
        paddingBottom: '4mm',
        marginBottom: '6mm',
      }}>
        <div>
          <div style={{ fontSize: '8pt', color: '#666', marginBottom: '1mm' }}>Dokument wewnętrzny</div>
          <h1 style={{ fontSize: '15pt', fontWeight: 'bold', margin: 0, letterSpacing: '0.5px' }}>
            KARTA OBIEGOWA PRACOWNIKA
          </h1>
        </div>
        <div style={{ textAlign: 'right', fontSize: '8pt', color: '#666' }}>
          <div>Nr: ..................</div>
          <div>Data wyst.: {formatDate(card?.date, 'dd.MM.yyyy')}</div>
        </div>
      </div>

      {/* Sekcja A - Dane pracownika */}
      <div style={{ marginBottom: '6mm' }}>
        <div style={{
          background: '#000',
          color: '#fff',
          padding: '1.5mm 3mm',
          fontWeight: 'bold',
          fontSize: '9pt',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '3mm',
        }}>
          A. Dane pracownika
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5pt' }}>
          <tbody>
            {[
              ['Nazwisko i imię', employee!.fullName, 'Numer karty', employee!.cardNumber],
              ['Dział', employee!.department, 'Stanowisko', employee!.jobTitle],
            ].map((row, i) => (
              <tr key={i}>
                <td style={{ width: '20%', padding: '2mm 2mm', fontWeight: '600', borderBottom: '1px solid #ccc' }}>{row[0]}</td>
                <td style={{ width: '30%', padding: '2mm 2mm', fontWeight: 'bold', borderBottom: '1px solid #ccc' }}>{row[1]}</td>
                <td style={{ width: '20%', padding: '2mm 2mm', fontWeight: '600', borderBottom: '1px solid #ccc' }}>{row[2]}</td>
                <td style={{ width: '30%', padding: '2mm 2mm', fontWeight: 'bold', borderBottom: '1px solid #ccc' }}>{row[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sekcja B - Lista kontrolna */}
      <div style={{ marginBottom: '6mm' }}>
        <div style={{
          background: '#000',
          color: '#fff',
          padding: '1.5mm 3mm',
          fontWeight: 'bold',
          fontSize: '9pt',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '3mm',
        }}>
          B. Zwrot materiałów i wyposażenia
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
          <thead>
            <tr style={{ background: '#e8e8e8' }}>
              <th style={{ width: '8%', padding: '2mm', border: '1px solid #000', textAlign: 'center' }}>Lp.</th>
              <th style={{ padding: '2mm 3mm', border: '1px solid #000', textAlign: 'left' }}>Nazwa materiału</th>
              <th style={{ width: '18%', padding: '2mm', border: '1px solid #000', textAlign: 'center' }}>Zwrócono</th>
              <th style={{ width: '18%', padding: '2mm', border: '1px solid #000', textAlign: 'center' }}>Nie zwrócono</th>
              <th style={{ width: '20%', padding: '2mm', border: '1px solid #000', textAlign: 'center' }}>Uwagi</th>
            </tr>
          </thead>
          <tbody>
            {checklistItems.map((item) => (
              <tr key={item.id}>
                <td style={{ padding: '3mm', border: '1px solid #000', textAlign: 'center', fontWeight: '600' }}>{item.id}</td>
                <td style={{ padding: '3mm', border: '1px solid #000', fontWeight: '600' }}>{item.label}</td>
                <td style={{ padding: '3mm', border: '1px solid #000', textAlign: 'center' }}>
                  <div style={{ width: '5mm', height: '5mm', border: '1.5px solid #000', display: 'inline-block' }} />
                </td>
                <td style={{ padding: '3mm', border: '1px solid #000', textAlign: 'center' }}>
                  <div style={{ width: '5mm', height: '5mm', border: '1.5px solid #000', display: 'inline-block' }} />
                </td>
                <td style={{ padding: '3mm', border: '1px solid #000' }}></td>
              </tr>
            ))}
            {/* Dodatkowe puste wiersze */}
            {[6, 7, 8].map((num) => (
              <tr key={num}>
                <td style={{ padding: '3mm', border: '1px solid #000', textAlign: 'center', color: '#ccc' }}>{num}</td>
                <td style={{ padding: '3mm', border: '1px solid #000', color: '#ccc' }}></td>
                <td style={{ padding: '3mm', border: '1px solid #000', textAlign: 'center' }}>
                  <div style={{ width: '5mm', height: '5mm', border: '1.5px solid #000', display: 'inline-block' }} />
                </td>
                <td style={{ padding: '3mm', border: '1px solid #000', textAlign: 'center' }}>
                  <div style={{ width: '5mm', height: '5mm', border: '1.5px solid #000', display: 'inline-block' }} />
                </td>
                <td style={{ padding: '3mm', border: '1px solid #000' }}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sekcja C - Uwagi */}
      <div style={{ marginBottom: '6mm' }}>
        <div style={{
          background: '#000',
          color: '#fff',
          padding: '1.5mm 3mm',
          fontWeight: 'bold',
          fontSize: '9pt',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '3mm',
        }}>
          C. Uwagi
        </div>
        <div style={{
          border: '1px solid #000',
          minHeight: '20mm',
          padding: '3mm',
          fontSize: '9pt',
          color: '#999',
        }}>
          ....................................................................................................................................................
          <br />
          ....................................................................................................................................................
        </div>
      </div>

      {/* Sekcja D - Podpisy */}
      <div>
        <div style={{
          background: '#000',
          color: '#fff',
          padding: '1.5mm 3mm',
          fontWeight: 'bold',
          fontSize: '9pt',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '5mm',
        }}>
          D. Podpisy
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          gap: '8mm',
        }}>
          {[
            'Pracownik',
            'Pracownik Magazynu',
            'Kierownik Działu',
          ].map((role) => (
            <div key={role} style={{ textAlign: 'center', width: '30%' }}>
              <div style={{
                borderBottom: '1px solid #000',
                height: '18mm',
                marginBottom: '2mm',
              }} />
              <div style={{ fontSize: '8.5pt', fontWeight: '600' }}>({role})</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── EXPORT ───────────────────────────────────────────────────────────
export const CirculationCardPrintForm = React.forwardRef<HTMLDivElement, CirculationCardPrintFormProps>(
  ({ employee, card, variant = 'classic' }, ref) => {

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
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          `}
        </style>

        {variant === 'classic' && <ClassicVariant employee={employee} card={card} />}
        {variant === 'modern' && <ModernVariant employee={employee} card={card} />}
        {variant === 'extended' && <ExtendedVariant employee={employee} card={card} />}
      </div>
    );
  }
);

CirculationCardPrintForm.displayName = 'CirculationCardPrintForm';
