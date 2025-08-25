'use client';

import React, { useState } from 'react';
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
import { MoreHorizontal, PlusCircle, Trash2, Edit, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { activeEmployees } from '@/lib/mock-data';
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

export default function FingerprintAppointmentsPage() {
    const [appointments, setAppointments] = useState<FingerprintAppointment[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<FingerprintAppointment | null>(null);

    const handleSave = (appointment: Omit<FingerprintAppointment, 'id'>) => {
        if (editingAppointment) {
            setAppointments(prev => prev.map(a => a.id === editingAppointment.id ? { ...a, ...appointment } : a));
        } else {
            setAppointments(prev => [...prev, { ...appointment, id: `fa-${Date.now()}` }]);
        }
        setIsFormOpen(false);
        setEditingAppointment(null);
    };

    const handleEdit = (appointment: FingerprintAppointment) => {
        setEditingAppointment(appointment);
        setIsFormOpen(true);
    };
    
    const handleAddNew = () => {
        setEditingAppointment(null);
        setIsFormOpen(true);
    };

    const handleDelete = (id: string) => {
        setAppointments(prev => prev.filter(a => a.id !== id));
    };

    const getEmployeeName = (id: string) => {
        const emp = activeEmployees.find(e => e.id === id);
        return emp ? `${emp.lastName} ${emp.firstName}` : 'Nieznany';
    }

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
}

function AppointmentForm({ isOpen, onOpenChange, appointment, onSave }: AppointmentFormProps) {
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
                                {activeEmployees.map(e => (
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
