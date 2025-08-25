'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { Employee } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

export default function TerminatedEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const employeesRef = ref(db, 'employees');
    const unsubscribe = onValue(employeesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const employeesList = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
            setEmployees(employeesList);
        } else {
            setEmployees([]);
        }
        setIsLoading(false);
    }, (error) => {
        console.error(error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const terminatedEmployees = useMemo(() => employees.filter(e => e.status === 'zwolniony'), [employees]);

  const filteredEmployees = useMemo(() => {
    return terminatedEmployees.filter(employee => {
      const searchLower = searchTerm.toLowerCase();
      return (
        employee.firstName.toLowerCase().includes(searchLower) ||
        employee.lastName.toLowerCase().includes(searchLower) ||
        (employee.cardNumber && employee.cardNumber.toLowerCase().includes(searchLower))
      );
    });
  }, [terminatedEmployees, searchTerm]);

  if (isLoading) return <div>Ładowanie...</div>;

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Pracownicy zwolnieni"
        description="Archiwum pracowników, którzy zakończyli współpracę."
      />
      
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Szukaj..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="flex-grow overflow-auto rounded-lg border">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/50">
            <TableRow>
              <TableHead>Nazwisko i imię</TableHead>
              <TableHead>Data zatrudnienia</TableHead>
              <TableHead>Data zwolnienia</TableHead>
              <TableHead>Stanowisko</TableHead>
              <TableHead>Dział</TableHead>
              <TableHead>Nr karty</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map(employee => (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">{employee.lastName} {employee.firstName}</TableCell>
                <TableCell>{employee.hireDate}</TableCell>
                <TableCell className="text-destructive">{employee.terminationDate}</TableCell>
                <TableCell>{employee.jobTitle}</TableCell>
                <TableCell>{employee.department}</TableCell>
                <TableCell>{employee.cardNumber}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
