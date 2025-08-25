'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { MoreHorizontal, PlusCircle, Trash2, Edit, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { Employee, FingerprintAppointment } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/firebase';
import { ref, set, push, remove } from 'firebase/database';
import { useConfig } from '@/context/config-context';


export default function FingerprintAppointmentsPage() {
    const { employees, fingerprintAppointments: appointments, isLoading } = useConfig();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<FingerprintAppointment | null>(null);

    const handleSave = async (appointmentData: Omit<FingerprintAppointment, 'id'>) => {
        try {
            if (editingAppointment) {
                const appointmentRef = ref(db, `fingerprintAppointments/${editingAppointment.id}`);
                await set(appointmentRef, appointmentData);
            } else {
                const newAppointmentRef = push(ref(db, 'fingerprintAppointments'));
                await set(newAppointmentRef, appointmentData);
            }
            setIsFormOpen(false);
            setEditingAppointment(null);
        } catch(error) {
            console.error("Failed to save appointment", error);
        }
    };

    const handleEdit = (appointment: FingerprintAppointment) => {
        setEditingAppointment(appointment);
        setIsFormOpen(true);
    };
    
    const handleAddNew = () => {
        setEditingAppointment(null);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if(window.confirm('Czy na pewno chcesz usunąć ten termin?')) {
            try {
                const appointmentRef = ref(db, `fingerprintAppointments/${id}`);
                await remove(appointmentRef);
            } catch(error) {
                console.error("Failed to delete appointment", error);
            }
        }
    };

    const getEmployeeName = (id: string) => {
        const emp = employees.find(e => e.id === id);
        return emp ? `${emp.lastName} ${emp.firstName}` : 'Nieznany';
    }
    
    const activeEmployees = employees.filter(e => e.status === 'aktywny');

    if (isLoading) return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div>
            <PageHeader
                title="Terminy na odciski palców"
                description="Zarządzaj terminami wizyt pracowników."
            >
                <Button onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Dodaj termin
                </Button>
            </PageHeader>
            <AppointmentForm
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                appointment={editingAppointment}
                onSave={handleSave}
                employees={activeEmployees}
            />
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Pracownik</TableHead>
                            <TableHead>Data wizyty</TableHead>
                            <TableHead className="text-right">Akcje</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {appointments.length > 0 ? appointments.map(appt => (
                            <TableRow key={appt.id}>
                                <TableCell className="font-medium">{getEmployeeName(appt.employeeId)}</TableCell>
                                <TableCell>{format(new Date(appt.appointmentDate), 'PPP', { locale: pl })}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(appt)}><Edit className="h-4 w-4 mr-2" />Edytuj</Button>
                                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(appt.id)}><Trash2 className="h-4 w-4 mr-2" />Usuń</Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    Brak zaplanowanych terminów.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

interface AppointmentFormProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    appointment: FingerprintAppointment | null;
    onSave: (appointment: Omit<FingerprintAppointment, 'id'>) => void;
    employees: Employee[];
}

function AppointmentForm({ isOpen, onOpenChange, appointment, onSave, employees }: AppointmentFormProps) {
    const [employeeId, setEmployeeId] = useState('');
    const [appointmentDate, setAppointmentDate] = useState<Date | undefined>();

    React.useEffect(() => {
        if (appointment) {
            setEmployeeId(appointment.employeeId);
            setAppointmentDate(new Date(appointment.appointmentDate));
        } else {
            setEmployeeId('');
            setAppointmentDate(undefined);
        }
    }, [appointment, isOpen]);

    const handleSubmit = () => {
        if (employeeId && appointmentDate) {
            onSave({ employeeId, appointmentDate: appointmentDate.toISOString() });
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{appointment ? 'Edytuj termin' : 'Dodaj nowy termin'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="employeeId">Pracownik</Label>
                        <Select onValueChange={setEmployeeId} value={employeeId}>
                            <SelectTrigger><SelectValue placeholder="Wybierz pracownika" /></SelectTrigger>
                            <SelectContent>
                                {employees.map(e => (
                                    <SelectItem key={e.id} value={e.id}>{e.lastName} {e.firstName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="appointmentDate">Data wizyty</Label>
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn("w-full justify-start text-left font-normal", !appointmentDate && "text-muted-foreground")}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {appointmentDate ? format(appointmentDate, "PPP", { locale: pl }) : <span>Wybierz datę</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={appointmentDate} onSelect={setAppointmentDate} initialFocus locale={pl} />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Anuluj</Button></DialogClose>
                    <Button onClick={handleSubmit}>Zapisz</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
