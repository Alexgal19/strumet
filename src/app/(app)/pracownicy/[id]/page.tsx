'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/app-context';
import { EmployeeForm } from '@/components/employee-form';
import { ClothingIssuancePrintForm } from '@/components/clothing-issuance-print-form';
import type { Employee, ClothingIssuance } from '@/lib/types';
import { Loader2 } from 'lucide-react';

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
        config={config}
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
