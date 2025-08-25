'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { activeEmployees } from '@/lib/mock-data';
import type { Employee } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { CalendarIcon, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NoLoginFormPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [incidentDate, setIncidentDate] = useState<Date | undefined>(new Date());

  const handleEmployeeSelect = (employeeId: string) => {
    const employee = activeEmployees.find(e => e.id === employeeId);
    setSelectedEmployee(employee || null);
  };
  
  return (
    <div>
      <PageHeader
        title="Formularz braku logowania"
        description="Wygeneruj i wydrukuj formularz dotyczący incydentu braku logowania."
      >
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Drukuj formularz
        </Button>
      </PageHeader>
      
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
              <CardTitle>Formularz</CardTitle>
              <CardDescription>Wypełnij pola, aby wygenerować dokument.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="space-y-2">
                  <Label>Wybierz pracownika</Label>
                  <Select onValueChange={handleEmployeeSelect}>
                      <SelectTrigger>
                          <SelectValue placeholder="Wybierz pracownika..." />
                      </SelectTrigger>
                      <SelectContent>
                      <SelectGroup>
                          <SelectLabel>Pracownicy aktywni</SelectLabel>
                          {activeEmployees.map(e => (
                              <SelectItem key={e.id} value={e.id}>{e.lastName} {e.firstName}</SelectItem>
                          ))}
                      </SelectGroup>
                      </SelectContent>
                  </Select>
              </div>

              {selectedEmployee && (
                  <Card className="bg-muted/50">
                      <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
                          <div><span className="font-semibold">Imię i nazwisko:</span> {selectedEmployee.firstName} {selectedEmployee.lastName}</div>
                          <div><span className="font-semibold">Dział:</span> {selectedEmployee.department}</div>
                      </CardContent>
                  </Card>
              )}
            
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                      <Label>Data incydentu</Label>
                      <Popover>
                      <PopoverTrigger asChild>
                          <Button
                          variant={"outline"}
                          className={cn("w-full justify-start text-left font-normal", !incidentDate && "text-muted-foreground")}
                          disabled={!selectedEmployee}
                          >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {incidentDate ? format(incidentDate, "PPP", { locale: pl }) : <span>Wybierz datę</span>}
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                          <Calendar
                              mode="single"
                              selected={incidentDate}
                              onSelect={setIncidentDate}
                              initialFocus
                              locale={pl}
                          />
                      </PopoverContent>
                      </Popover>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="managerSignature">Podpis kierownika</Label>
                      <Input id="managerSignature" placeholder="Miejsce na podpis..." disabled={!selectedEmployee} />
                  </div>
              </div>
              
              <Button className="w-full" disabled={!selectedEmployee}>Zapisz incydent</Button>

          </CardContent>
        </Card>
    </div>
  );
}
