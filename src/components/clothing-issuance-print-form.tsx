
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
            itemsToRender = description
                .split('\n')
                .map(line => line.trim())
                .filter(line => line)
                .map(name => ({ name, quantity: 1 }));
        } else {
            itemsToRender = issuance.items;
        }

        const s: Record<string, React.CSSProperties> = {
            page: {
                width: '100%',
                margin: '0 auto',
                padding: '20px 24px',
                backgroundColor: '#fff',
                color: '#000',
                fontFamily: 'Arial, sans-serif',
                fontSize: '11px',
                boxSizing: 'border-box',
            },
            title: {
                textAlign: 'center',
                fontSize: '13pt',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                marginBottom: '2mm',
                letterSpacing: '0.5px',
            },
            subtitle: {
                textAlign: 'center',
                fontSize: '9pt',
                color: '#555',
                marginBottom: '8mm',
            },
            section: {
                marginBottom: '6mm',
            },
            sectionTitle: {
                fontSize: '9pt',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                borderBottom: '1px solid #000',
                paddingBottom: '1mm',
                marginBottom: '3mm',
                letterSpacing: '0.3px',
            },
            infoGrid: {
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2mm 8mm',
            },
            infoRow: {
                display: 'flex',
                gap: '2mm',
                fontSize: '10pt',
                padding: '1.5mm 0',
                borderBottom: '1px dotted #ccc',
            },
            infoLabel: {
                color: '#444',
                minWidth: '120px',
                flexShrink: 0,
            },
            infoValue: {
                fontWeight: 'bold',
            },
            table: {
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '10pt',
            },
            th: {
                border: '1px solid #000',
                padding: '2mm 3mm',
                backgroundColor: '#f0f0f0',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '9pt',
            },
            td: {
                border: '1px solid #000',
                padding: '2.5mm 3mm',
                verticalAlign: 'top',
            },
            tdCenter: {
                border: '1px solid #000',
                padding: '2.5mm 3mm',
                textAlign: 'center',
                verticalAlign: 'middle',
            },
            signatureRow: {
                display: 'flex',
                justifyContent: 'space-between',
                gap: '20mm',
                marginTop: '16mm',
            },
            signatureBox: {
                flex: 1,
                textAlign: 'center' as const,
            },
            signatureLine: {
                borderTop: '1px solid #000',
                marginBottom: '2mm',
            },
            signatureLabel: {
                fontSize: '8pt',
                color: '#555',
            },
        };

        return (
            <div ref={ref} style={s.page} className="clothing-print-sheet">
                <style>{`
                    @media print {
                        @page {
                            size: A4;
                            margin: 10mm;
                        }
                    }
                `}</style>

                {/* Nagłówek */}
                <div style={s.title}>Potwierdzenie wydania odzieży roboczej i obuwia</div>
                <div style={s.subtitle}>Workwear &amp; Footwear Issuance Confirmation</div>

                {/* Data */}
                <div style={{ textAlign: 'right', fontSize: '9pt', marginBottom: '6mm', color: '#333' }}>
                    Data wydania: <strong>{formatDate(issuance.date, 'dd.MM.yyyy')}</strong>
                </div>

                {/* Dane pracownika */}
                <div style={s.section}>
                    <div style={s.sectionTitle}>Dane pracownika / Employee Details</div>
                    <div style={s.infoGrid}>
                        <div style={s.infoRow}>
                            <span style={s.infoLabel}>Imię i nazwisko:</span>
                            <span style={s.infoValue}>{employee.fullName}</span>
                        </div>
                        <div style={s.infoRow}>
                            <span style={s.infoLabel}>Numer karty RC:</span>
                            <span style={s.infoValue}>{employee.cardNumber || '—'}</span>
                        </div>
                        <div style={s.infoRow}>
                            <span style={s.infoLabel}>Stanowisko:</span>
                            <span style={s.infoValue}>{employee.jobTitle || '—'}</span>
                        </div>
                        <div style={s.infoRow}>
                            <span style={s.infoLabel}>Dział:</span>
                            <span style={s.infoValue}>{employee.department || '—'}</span>
                        </div>
                    </div>
                </div>

                {/* Tabela odzieży */}
                <div style={s.section}>
                    <div style={s.sectionTitle}>Wydane elementy / Issued Items</div>
                    <table style={s.table}>
                        <thead>
                            <tr>
                                <th style={{ ...s.th, width: '8mm' }}>Lp.</th>
                                <th style={{ ...s.th, textAlign: 'left' }}>Nazwa / Item Name</th>
                                <th style={{ ...s.th, width: '18mm' }}>Ilość / Qty</th>
                                <th style={{ ...s.th, width: '45mm' }}>Podpis odbioru / Signature</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemsToRender.map((item, index) => (
                                <tr key={index}>
                                    <td style={s.tdCenter}>{index + 1}</td>
                                    <td style={s.td}>{item.name}</td>
                                    <td style={s.tdCenter}>{item.quantity}</td>
                                    <td style={s.tdCenter}></td>
                                </tr>
                            ))}
                            {/* Puste wiersze dla wypełnienia ręcznego */}
                            {itemsToRender.length < 6 && Array.from({ length: 6 - itemsToRender.length }).map((_, i) => (
                                <tr key={`empty-${i}`}>
                                    <td style={s.tdCenter}>{itemsToRender.length + i + 1}</td>
                                    <td style={s.td}>&nbsp;</td>
                                    <td style={s.tdCenter}>&nbsp;</td>
                                    <td style={s.tdCenter}>&nbsp;</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Linie podpisów */}
                <div style={s.signatureRow}>
                    <div style={s.signatureBox}>
                        <div style={{ ...s.signatureLine, marginTop: '20mm' }} />
                        <div style={s.signatureLabel}>Data i podpis pracownika / Employee signature</div>
                    </div>
                    <div style={s.signatureBox}>
                        <div style={{ ...s.signatureLine, marginTop: '20mm' }} />
                        <div style={s.signatureLabel}>Podpis osoby wydającej / Issuer signature</div>
                    </div>
                </div>
            </div>
        );
    }
);

ClothingIssuancePrintForm.displayName = 'ClothingIssuancePrintForm';
