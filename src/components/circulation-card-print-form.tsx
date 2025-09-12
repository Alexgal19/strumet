'use client';

import React from 'react';
import { Employee } from "@/lib/types";
import { format } from "date-fns";

interface CirculationCardPrintFormProps {
  employee: Employee | null;
}

export const CirculationCardPrintForm = React.forwardRef<HTMLDivElement, CirculationCardPrintFormProps>(
  ({ employee }, ref) => {
    
    // Preview for the main page
    if (!employee) {
      return (
           <div ref={ref} className="p-8 border rounded-lg bg-white shadow-md text-black flex items-center justify-center text-center text-gray-500 min-h-[400px]">
              <div>
                  <h3 className="text-lg font-semibold mb-2">Podgląd Karty Obiegowej</h3>
                  <p>Wybierz pracownika, aby zobaczyć, jak będzie wyglądał dokument.</p>
              </div>
          </div>
      );
    }

    const printDate = employee.terminationDate 
        ? format(new Date(employee.terminationDate), 'dd.MM.yyyy')
        : '______________';

    const warehouseItems = ["Spodnie", "Bluza", "Buty", "Koszulka", "Koszula", "Pas", "Zarękawnik P-L", "Przyłbica", "Fartuch"];
    const itItems = ["Zwrot karty"];
    const supervisorItems = ["Zwrot kluczy do szafki na ubraniowej", "Zwrot kluczy do szafki na wydziale", "Szlifierka"];
    const foremanItems = ["Miarka", "Kabel spawalniczy", "Masa"];

    const renderSection = (title: string, items: string[]) => (
      <div className="section">
        <h2 className="section-title">{title}</h2>
        <div className="section-content">
          {items.map(item => (
            <div key={item} className="item-row">
              <span className="item-label">{item}</span>
              <span className="item-dots"></span>
              <span className="item-signature-placeholder">TAK / NIE / ND</span>
            </div>
          ))}
        </div>
        <div className="signature-line">
          <div className="signature-box">
            <span className="signature-caption">(podpis i data)</span>
          </div>
        </div>
      </div>
    );

    return (
      <div ref={ref} className="print-root-container bg-white">
        {/* These styles are applied ONLY during printing */}
        <style jsx global>{`
            @media print {
              @page {
                size: A4;
                margin: 1.5cm;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                background: white !important;
                -webkit-print-color-adjust: exact !important;
              }
              .print-root-container {
                padding: 0;
                margin: 0;
                width: 100%;
                box-shadow: none;
                border: none;
              }
            }
            
            .print-page {
                background: white;
                color: black;
                font-family: Arial, sans-serif;
                font-size: 11pt;
                padding: 1rem;
            }
            .page-title {
                text-align: center;
                font-size: 1.25rem;
                font-weight: bold;
                letter-spacing: 0.1em;
                border-bottom: 2px solid black;
                display: inline-block;
                padding-bottom: 4px;
                margin-bottom: 2rem;
            }
            .employee-info {
                margin-bottom: 1.5rem;
                font-size: 11pt;
            }
            .info-row {
                display: flex;
                margin-bottom: 4px;
            }
            .info-label {
                font-weight: bold;
                width: 130px;
                flex-shrink: 0;
            }
            .info-value {
                font-weight: normal;
            }
            .divider {
                border-top: 2px solid black;
                margin-bottom: 1rem;
            }
            .section {
                margin-bottom: 1.5rem;
            }
            .section-title {
                font-size: 10pt;
                font-weight: bold;
                text-align: center;
                letter-spacing: 0.05em;
                margin-bottom: 0.75rem;
            }
            .item-row {
                display: flex;
                align-items: flex-end;
                margin-bottom: 0.75rem;
            }
            .item-label {
                font-size: 11pt;
            }
            .item-dots {
                flex-grow: 1;
                border-bottom: 1px dotted #888;
                margin: 0 0.5rem;
                transform: translateY(-4px);
            }
            .item-signature-placeholder {
                font-size: 9pt;
                color: #333;
            }
            .signature-line {
                display: flex;
                justify-content: flex-end;
                padding-top: 2.5rem;
            }
            .signature-box {
                width: 45%;
                border-top: 1px solid #666;
                padding-top: 4px;
                text-align: center;
            }
            .signature-caption {
                font-size: 8pt;
                color: #555;
            }
        `}</style>
         <div className="print-page">
            <div>
              <div style={{textAlign: 'center'}}>
                <h1 className="page-title">KARTA OBIEGOWA</h1>
              </div>
              
              <div className="employee-info">
                <div className="info-row">
                  <span className="info-label">Nazwisko Imię:</span>
                  <span className="info-value">{employee.fullName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Stanowisko:</span>
                  <span className="info-value">{employee.jobTitle}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Dział:</span>
                  <span className="info-value">{employee.department}</span>
                </div>
                 <div className="info-row">
                  <span className="info-label">Nr karty RCP:</span>
                  <span className="info-value">{employee.cardNumber}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Data zwolnienia:</span>
                  <span className="info-value">{printDate}</span>
                </div>
              </div>
              
              <div className="divider"></div>

              <div className="space-y-4">
                {renderSection("MAGAZYN", warehouseItems)}
                {renderSection("INFORMATYK", itItems)}
                {renderSection("OPIEKUN", supervisorItems)}
                {renderSection("BRYGADZISTA", foremanItems)}
              </div>
            </div>
        </div>
      </div>
    );
  }
);

CirculationCardPrintForm.displayName = 'CirculationCardPrintForm';
