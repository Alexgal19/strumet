'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAppContext } from '@/context/app-context';
import { EmployeeForm } from '@/components/employee-form';
import { ClothingIssuancePrintForm } from '@/components/clothing-issuance-print-form';
import type { Employee, ClothingIssuance } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const PassportScanner = dynamic(
  () => import('@/components/passport-scanner').then(m => m.PassportScanner),
  { ssr: false }
);

export default function EmployeePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const {
    employees,
    config,
    isLoading,
    handleSaveEmployee,
    handleTerminateEmployee,
  } = useAppContext();

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [passportScanData, setPassportScanData] = useState<{ firstName: string; lastName: string } | null>(null);
  const [clothingPrintData, setClothingPrintData] = useState<{ employee: Employee; issuance: ClothingIssuance } | null>(null);

  const employee = employees.find(e => e.id === id) ?? null;

  const handleSave = async (data: Employee) => {
    const success = await handleSaveEmployee(data);
    if (!success) return;
    if (id === 'new') {
      router.push('/aktywni');
    } else {
      router.back();
    }
  };

  const handleTerminate = async (empId: string, fullName: string) => {
    const success = await handleTerminateEmployee(empId, fullName);
    if (success) router.push('/zwolnieni');
  };

  const handlePrintClothing = (emp: Employee, issuance: ClothingIssuance) => {
    setClothingPrintData({ employee: emp, issuance });
  };

  useEffect(() => {
    if (!clothingPrintData) return;
    const timer = setTimeout(() => {
      window.print();
      setClothingPrintData(null);
    }, 100);
    return () => clearTimeout(timer);
  }, [clothingPrintData]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Allow 'new' as a special id for creating a new employee
  if (!employee && id !== 'new') {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        Pracownik nie został znaleziony.
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:px-8 pb-20 md:pb-8">
      <EmployeeForm
        employee={employee}
        onSave={handleSave}
        onCancel={() => router.back()}
        onTerminate={handleTerminate}
        onPrintClothing={handlePrintClothing}
        onScanPassport={() => setIsScannerOpen(true)}
        passportScanData={passportScanData ?? undefined}
        config={config}
      />

      <PassportScanner
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScanComplete={(data) => {
          setPassportScanData(data);
          setIsScannerOpen(false);
        }}
      />

      {clothingPrintData && (
        <div className="print-only">
          <ClothingIssuancePrintForm
            employee={clothingPrintData.employee}
            issuance={clothingPrintData.issuance}
          />
        </div>
      )}
    </div>
  );
}
