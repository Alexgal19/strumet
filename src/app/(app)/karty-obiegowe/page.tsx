'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmployeeCombobox } from '@/components/employee-combobox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Printer, History } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { GenericExcelExportButton } from '@/components/generic-excel-export-button';
import { CirculationCard } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { formatDateTime } from '@/lib/date';
import { CirculationCardPrintForm } from '@/components/circulation-card-print-form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppContext } from '@/context/app-context';
import { useEmployees } from '@/hooks/use-employees';


import { t } from '@/lib/i18n';
export default function CirculationCardsPage() {
  const { isLoading: isAppLoading, circulationCards, addCirculationCard } = useAppContext();
  const { employees, isLoading: isEmployeesLoading } = useEmployees(); // Fetch all employees

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  
  const [printingCard, setPrintingCard] = useState<CirculationCard | null>(null);
  const printComponentRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();

  const selectedEmployee = useMemo(() => {
    return employees.find(e => e.id === selectedEmployeeId) ?? null;
  }, [selectedEmployeeId, employees]);

  const employeeCardHistory = useMemo(() => {
    if (!selectedEmployeeId) return [];
    return circulationCards
        .filter(card => card.employeeId === selectedEmployeeId)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [circulationCards, selectedEmployeeId]);

  const handlePrint = async (cardToPrint?: CirculationCard) => {
    let card: CirculationCard | null = cardToPrint || null;
    if (!card) {
        if (!selectedEmployee) {
            toast({
                variant: 'destructive',
                title: t('ops.error'),
                description: t('ops.pleaseSelectAnEmployee'),
            });
            return;
        }
        card = await addCirculationCard(selectedEmployee.id, selectedEmployee.fullName);
    }
    
    if(card) {
        setPrintingCard(card);
        document.body.classList.add('printing');
        requestAnimationFrame(() => {
            window.print();
            document.body.classList.remove('printing');
            setPrintingCard(null);
        });
    }
  };

  const isLoading = isAppLoading || isEmployeesLoading;

  const selectedEmployeeForPrint = printingCard
    ? employees.find(e => e.id === printingCard.employeeId) 
    : null;

  return (
    <>
      <div className="main-content-container h-full flex-col flex">
        {isLoading ? (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : (
        <>
            <PageHeader
            title={t('ops.clearanceForms')}
            description={t('ops.generateAndPrintClearanceForms')}
            />

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
                <Card>
                <CardHeader>
                    <CardTitle>{t('ops.createANewForm')}</CardTitle>
                    <CardDescription>{t('ops.selectAnEmployeeActiveOr')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                    <label className="text-sm font-medium">{t('ops.employee')}</label>
                    <EmployeeCombobox
                        employees={employees}
                        value={selectedEmployeeId}
                        onValueChange={setSelectedEmployeeId}
                    />
                    </div>

                    <Button onClick={() => handlePrint()} disabled={!selectedEmployee} className="w-full">
                    <Printer className="mr-2 h-4 w-4" />
                    {t('ops.printForm')}
                    </Button>
                </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-2">
                <Card className="h-full">
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                    <History className="h-6 w-6" />
                    <div>
                        <CardTitle>{t('ops.clearanceFormHistory')}</CardTitle>
                        <CardDescription>
                        {selectedEmployee ? `dla ${selectedEmployee.fullName}` : t('ops.selectAnEmployeeToSee')}
                        </CardDescription>
                    </div>
                    </div>
                    {selectedEmployee && employeeCardHistory.length > 0 && (
                        <GenericExcelExportButton
                            data={employeeCardHistory.map(c => ({ ...c, nationality: selectedEmployee.nationality ?? '' }))}
                            columns={[
                                { key: 'date', name: t('ops.generatedOn') },
                                { key: 'employeeFullName', name: t('ops.employee') },
                                { key: 'nationality', name: t('employee.nationality') },
                            ]}
                            fileName="historia_kart_obiegowych"
                        />
                    )}
                    </div>
                </CardHeader>
                <CardContent>
                    {selectedEmployee ? (
                    employeeCardHistory.length > 0 ? (
                        <>
                        <ScrollArea className="hidden md:block max-h-96 rounded-lg border">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>{t('ops.generatedOn')}</TableHead>
                                <TableHead className="text-right">{t('ops.actions')}</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {employeeCardHistory.map(card => (
                                <TableRow key={card.id}>
                                <TableCell className="font-medium">{formatDateTime(card.date, "dd.MM.yyyy HH:mm")}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handlePrint(card)}>
                                    <Printer className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                        </ScrollArea>
                        <div className="md:hidden flex flex-col gap-4">
                            {employeeCardHistory.map(card => (
                                <Card key={card.id} className="bg-card">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-muted-foreground">{t('ops.generatedOn')}</span>
                                            <span className="font-medium">{formatDateTime(card.date, "dd.MM.yyyy HH:mm")}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handlePrint(card)}>
                                            <Printer className="h-4 w-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-10">{t('ops.noFormHistoryForThis')}</p>
                    )
                    ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-center py-10">
                        {t('ops.selectAnEmployeeToSee')}
                    </div>
                    )}
                </CardContent>
                </Card>
            </div>
            </div>
        </>
        )}
      </div>
      <div className="print-only">
        {printingCard && selectedEmployeeForPrint && (
            <CirculationCardPrintForm 
                ref={printComponentRef}
                employee={selectedEmployeeForPrint}
                card={printingCard}
            />
        )}
      </div>
    </>
  );
}
