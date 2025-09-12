'use client'

import { db } from "@/lib/firebase";
import { Employee } from "@/lib/types";
import { get, ref } from "firebase/database";
import { format } from "date-fns";
import React, { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <section className="mb-2">
        <h2 className="text-center font-bold bg-gray-200 p-1 border-t border-x border-black text-sm">{title}</h2>
        {children}
    </section>
);

const ChecklistRow = ({ label }: { label: string }) => (
    <div className="grid grid-cols-[1fr_50px_50px_50px] items-center border-b border-x border-black">
        <span className="px-2 py-1.5 text-sm">{label}</span>
        <div className="h-full flex items-center justify-center border-l"><div className="w-4 h-4 border border-black"></div></div>
        <div className="h-full flex items-center justify-center border-l"><div className="w-4 h-4 border border-black"></div></div>
        <div className="h-full flex items-center justify-center border-l"><div className="w-4 h-4 border border-black"></div></div>
    </div>
);

const SignatureRow = ({ label }: { label: string }) => (
    <div className="border-t border-x border-b border-black text-right pr-4 py-1">
        <span className="text-sm">{label}</span>
    </div>
);

const PrintLayout = ({ employee }: { employee: Employee | null }) => {
    if (!employee) {
        return <div>Pracownik o podanym ID nie został znaleziony.</div>;
    }

    const printDate = employee.terminationDate 
        ? format(new Date(employee.terminationDate), 'dd.MM.yyyy')
        : format(new Date(), 'dd.MM.yyyy');
        
    const dataSectionItems = [
        { label: "Nazwisko Imię", value: employee.fullName },
        { label: "Stanowisko", value: employee.jobTitle },
        { label: "Dział", value: employee.department },
        { label: "Nr karty RCP", value: employee.cardNumber },
        { label: "Data", value: printDate },
    ];
    
    const warehouseItems = ["spodnie", "bluza", "buty", "koszulka", "koszula", "pas", "zarękawnik P-L", "przyłbica", "fartuch"];
    const supervisorItems = ["Zwrot kluczy do szafki na ubraniowej", "Zwrot kluczy do szafki na wydziale", "Szlifierka"];
    const foremanItems = ["Miarka", "Kabel spawalniczy", "Masa"];

    return (
        <div className="print:p-0 p-8">
            <style>
                {`
                    @import url('https://cdn.jsdelivr.net/font-geist/latest/geist.css');
                    body { 
                        font-family: 'Geist', sans-serif;
                        color: #000;
                        -webkit-font-smoothing: antialiased;
                        -moz-osx-font-smoothing: grayscale;
                    }
                    @page {
                       size: A4;
                       margin: 1cm;
                    }
                `}
            </style>
             <Button onClick={() => window.print()} className="fixed top-4 right-4 print:hidden">
                <Printer className="mr-2 h-4 w-4" />
                Drukuj
             </Button>

             <div className="w-full bg-white text-black text-xs">
                <header className="text-center mb-4">
                    <h1 className="text-lg font-bold tracking-wider">KARTA OBIEGOWA</h1>
                </header>
                
                <section className="border-t border-black">
                     {dataSectionItems.map(item => (
                        <div key={item.label} className="grid grid-cols-3 border-b border-black">
                            <div className="col-span-1 font-bold p-1.5 border-x border-black">{item.label}</div>
                            <div className="col-span-2 p-1.5 border-r border-black">{item.value || ''}</div>
                        </div>
                    ))}
                </section>
                
                <div className="h-4"></div>

                <main>
                    <Section title="Magazyn">
                        <div className="grid grid-cols-[1fr_50px_50px_50px] items-center border-b border-x border-black bg-gray-100">
                            <span className="px-2 py-1 font-bold text-sm">Zwrot odzieży</span>
                            <div className="h-full flex items-center justify-center border-l font-bold text-sm">TAK</div>
                            <div className="h-full flex items-center justify-center border-l font-bold text-sm">NIE</div>
                            <div className="h-full flex items-center justify-center border-l font-bold text-sm">ND</div>
                        </div>
                        {warehouseItems.map(item => <ChecklistRow key={item} label={item} />)}
                        <SignatureRow label="Podpis pracownika Magazynu" />
                    </Section>

                    <Section title="Informatyk">
                        <div className="grid grid-cols-[1fr_150px_1fr] items-center border-b border-x border-black">
                            <span className="px-2 py-1.5 text-sm">Zwrot karty</span>
                            <div className="h-full flex items-center justify-center border-l font-bold text-lg bg-green-200">TAK</div>
                            <div className="grid grid-rows-2 h-full border-l">
                               <div className="px-2 py-1.5 text-sm border-b">Data:</div>
                               <div className="px-2 py-1.5 text-sm">Podpis:</div>
                            </div>
                        </div>
                    </Section>
                    
                    <Section title="Opiekun">
                        <div className="grid grid-cols-[1fr_50px_50px_50px] items-center border-b border-x border-black bg-gray-100">
                            <span className="px-2 py-1 font-bold text-sm"></span>
                             <div className="h-full flex items-center justify-center border-l font-bold text-sm">TAK</div>
                            <div className="h-full flex items-center justify-center border-l font-bold text-sm">NIE</div>
                            <div className="h-full flex items-center justify-center border-l font-bold text-sm">ND</div>
                        </div>
                         {supervisorItems.map(item => <ChecklistRow key={item} label={item} />)}
                        <SignatureRow label="Podpis" />
                    </Section>

                    <Section title="Brygadzista">
                         <div className="grid grid-cols-[1fr_50px_50px_50px] items-center border-b border-x border-black bg-gray-100">
                            <span className="px-2 py-1 font-bold text-sm"></span>
                            <div className="h-full flex items-center justify-center border-l font-bold text-sm">TAK</div>
                            <div className="h-full flex items-center justify-center border-l font-bold text-sm">NIE</div>
                            <div className="h-full flex items-center justify-center border-l font-bold text-sm">ND</div>
                        </div>
                        {foremanItems.map(item => <ChecklistRow key={item} label={item} />)}
                        <SignatureRow label="Podpis" />
                    </Section>
                </main>
            </div>
        </div>
    );
};

const PrintPageContent = ({ employeeId }: { employeeId: string }) => {
    const [employee, setEmployee] = React.useState<Employee | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchEmployee = async () => {
            if (!employeeId) {
                setLoading(false);
                return;
            }
            const employeeRef = ref(db, `employees/${employeeId}`);
            const snapshot = await get(employeeRef);
            setEmployee(snapshot.val() ? { id: snapshot.key, ...snapshot.val() } : null);
            setLoading(false);
        };
        fetchEmployee();
    }, [employeeId]);
    
    if (loading) {
        return <div className="flex h-screen w-screen items-center justify-center">Ładowanie danych pracownika...</div>;
    }

    return <PrintLayout employee={employee} />;
}

export default function PrintPage({ searchParams }: { searchParams: { employeeId: string } }) {
    const employeeId = searchParams.employeeId;

    if (!employeeId) {
        return <div>Brak ID pracownika.</div>;
    }

    return (
        <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center">Ładowanie...</div>}>
            <PrintPageContent employeeId={employeeId} />
        </Suspense>
    );
}
