'use client'

import { db } from "@/lib/firebase";
import { Employee } from "@/lib/types";
import { get, ref } from "firebase/database";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import React, { Suspense } from "react";

const ChecklistItem = ({ label }: { label: string }) => (
    <div className="flex justify-between items-center py-2 border-b">
        <span>{label}</span>
        <div className="flex items-center space-x-6">
            <span>TAK</span> <div className="w-4 h-4 border-2 border-black inline-block"></div>
            <span className="ml-4">NIE</span> <div className="w-4 h-4 border-2 border-black inline-block"></div>
        </div>
    </div>
);

const SignatureSection = ({ label }: { label: string }) => (
    <div className="pt-12 inline-block">
        <div className="border-t-2 border-dotted border-black w-64 pt-1 text-xs text-center text-gray-500">
            {label}
        </div>
    </div>
);


const PrintLayout = async ({ employeeId }: { employeeId: string }) => {
    const employeeRef = ref(db, `employees/${employeeId}`);
    const snapshot = await get(employeeRef);
    const employee: Employee | null = snapshot.val();

    if (!employee) {
        return <div>Pracownik o podanym ID nie został znaleziony.</div>;
    }
    
    // Trigger print dialog
    React.useEffect(() => {
        window.print();
    }, []);

    const terminationDate = employee.terminationDate 
        ? format(new Date(employee.terminationDate), 'd MMMM yyyy', { locale: pl })
        : ' ';

    return (
        <html>
            <head>
                <title>Karta Obiegowa - {employee.fullName}</title>
                 <style>
                    {`
                        @import url('https://cdn.jsdelivr.net/font-geist/latest/geist.css');
                        body { 
                            font-family: 'Geist', sans-serif;
                            font-size: 11pt;
                            color: #111;
                        }
                        @page {
                           size: A4;
                           margin: 1.5cm;
                        }
                    `}
                </style>
            </head>
            <body>
                 <div style={{ width: '100%' }}>
                    <header style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>KARTA OBIEGOWA</h1>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Potwierdzenie rozliczenia pracownika</p>
                    </header>
                    
                    <section style={{ borderTop: '2px solid black', borderBottom: '2px solid black', padding: '1rem 0', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem 2rem' }}>
                             <div>
                                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Pracownik</p>
                                <p style={{ fontWeight: 'bold' }}>{employee.fullName}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Data zwolnienia</p>
                                <p style={{ fontWeight: 'bold' }}>{terminationDate}</p>
                            </div>
                             <div>
                                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Stanowisko</p>
                                <p style={{ fontWeight: 'bold' }}>{employee.jobTitle}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Dział</p>
                                <p style={{ fontWeight: 'bold' }}>{employee.department}</p>
                            </div>
                        </div>
                    </section>

                    <main>
                        <h2 style={{ fontWeight: 'bold', marginBottom: '1rem', fontSize: '1.125rem' }}>Rozliczenie z działami</h2>
                        
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Magazyn</h3>
                            <div className="space-y-2">
                                <ChecklistItem label="Spodnie, bluza, buty, koszulika" />
                                <ChecklistItem label="Pas, zarękawnik, przyłbica, fartuch" />
                            </div>
                             <div style={{ textAlign: 'right', marginTop: '0.5rem' }}><SignatureSection label="Podpis pracownika Magazynu" /></div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Dział IT</h3>
                            <ChecklistItem label="Zwrot karty RCP" />
                            <div style={{ textAlign: 'right', marginTop: '0.5rem' }}><SignatureSection label="Podpis pracownika Działu IT" /></div>
                        </div>

                         <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Opiekun / Lider</h3>
                            <div className="space-y-2">
                                <ChecklistItem label="Zwrot kluczy do szafek" />
                                <ChecklistItem label="Szlifierka, miarka, narzędzia" />
                            </div>
                            <div style={{ textAlign: 'right', marginTop: '0.5rem' }}><SignatureSection label="Podpis Opiekuna / Lidera" /></div>
                        </div>

                    </main>

                     <footer style={{ textAlign: 'center', paddingTop: '2rem' }}>
                        <SignatureSection label="Podpis pracownika" />
                    </footer>

                </div>
                 <script>
                    window.onload = () => {
                        window.print();
                    };
                </script>
            </body>
        </html>
    );
};


export default function PrintPage({ searchParams }: { searchParams: { employeeId: string } }) {
    const employeeId = searchParams.employeeId;

    if (!employeeId) {
        return <div>Brak ID pracownika.</div>;
    }

    return (
        <Suspense fallback={<div>Ładowanie...</div>}>
            <PrintLayout employeeId={employeeId} />
        </Suspense>
    );
}