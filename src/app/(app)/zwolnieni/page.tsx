'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { useConfig } from '@/context/config-context';

function TerminatedEmployeesPageComponent() {
  const { employees, isLoading } = useConfig();
  const [searchTerm, setSearchTerm] = useState('');

  const terminatedEmployees = useMemo(() => employees.filter(e => e.status === 'zwolniony'), [employees]);

  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return terminatedEmployees;
    
    const searchLower = searchTerm.toLowerCase();
    return terminatedEmployees.filter(employee => {
      return (
        employee.firstName.toLowerCase().includes(searchLower) ||
        employee.lastName.toLowerCase().includes(searchLower) ||
        (employee.cardNumber && employee.cardNumber.toLowerCase().includes(searchLower))
      );
    });
  }, [terminatedEmployees, searchTerm]);

  if (isLoading) return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

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

const TerminatedEmployeesPage = React.memo(TerminatedEmployeesPageComponent);
export default TerminatedEmployeesPage;
