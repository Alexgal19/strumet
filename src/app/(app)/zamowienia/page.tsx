
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Loader2, Edit, Trash2, ChevronsUpDown, CheckIcon } from 'lucide-react';
import { useAppContext } from '@/context/app-context';
import type { Order, Employee } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';


const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};

export default function ZamowieniaPage() {
    const { config, employees, addOrder, updateOrder, deleteOrder, isLoading: isAppLoading } = useAppContext();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(true);

    // State for "New Employee" form
    const [newOrderDepartment, setNewOrderDepartment] = useState('');
    const [newOrderJobTitle, setNewOrderJobTitle] = useState('');
    const [newOrderQuantity, setNewOrderQuantity] = useState(1);

    // State for "Replacement" form
    const [replacementEmployeeId, setReplacementEmployeeId] = useState('');
    const [isComboboxOpen, setIsComboboxOpen] = useState(false);

    // State for editing
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [editFormData, setEditFormData] = useState<{ department: string; jobTitle: string; quantity: number; realizedQuantity: number; } | null>(null);
    
    useEffect(() => {
      const ordersRef = ref(db, 'orders');
      const unsubscribe = onValue(ordersRef, (snapshot) => {
        setOrders(objectToArray(snapshot.val()));
        setIsLoadingOrders(false);
      });
      return () => unsubscribe();
    }, []);

    const handleAddNewOrder = async () => {
        if (!newOrderDepartment || !newOrderJobTitle || newOrderQuantity < 1) {
            return;
        }
        await addOrder({
            department: newOrderDepartment,
            jobTitle: newOrderJobTitle,
            quantity: newOrderQuantity,
            realizedQuantity: 0,
            type: 'new',
        });
        setNewOrderDepartment('');
        setNewOrderJobTitle('');
        setNewOrderQuantity(1);
    };

    const handleAddReplacementOrder = async () => {
        const employeeToReplace = employees.find(e => e.id === replacementEmployeeId);
        if (!employeeToReplace) return;

        await addOrder({
            department: employeeToReplace.department,
            jobTitle: employeeToReplace.jobTitle,
            quantity: 1,
            realizedQuantity: 0,
            type: 'replacement',
            replacesEmployeeInfo: {
                id: employeeToReplace.id,
                fullName: employeeToReplace.fullName
            }
        });
        setReplacementEmployeeId('');
    };

    const handleOpenEditDialog = (order: Order) => {
        setEditingOrder(order);
        setEditFormData({ department: order.department, jobTitle: order.jobTitle, quantity: order.quantity, realizedQuantity: order.realizedQuantity || 0 });
        setIsEditDialogOpen(true);
    };
    
    const handleUpdateOrder = async () => {
        if (!editingOrder || !editFormData) return;
        await updateOrder({ ...editingOrder, ...editFormData });
        setIsEditDialogOpen(false);
        setEditingOrder(null);
    };

    const groupedOrders = useMemo(() => {
        return orders.reduce((acc, order) => {
            if (!acc[order.department]) {
                acc[order.department] = [];
            }
            acc[order.department].push(order);
            return acc;
        }, {} as Record<string, Order[]>);
    }, [orders]);

    const isLoading = isAppLoading || isLoadingOrders;

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    const selectedEmployeeForReplacement = employees.find(e => e.id === replacementEmployeeId);


    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title="Zamówienia na personel"
                description="Zarządzaj zapotrzebowaniem na nowych pracowników i zastępstwa."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <Tabs defaultValue="new" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="new">Nowy pracownik</TabsTrigger>
                            <TabsTrigger value="replacement">Zastępstwo</TabsTrigger>
                        </TabsList>
                        <TabsContent value="new">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Zamówienie na nowego pracownika</CardTitle>
                                    <CardDescription>Wypełnij formularz, aby utworzyć nowe zamówienie.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1">
                                        <Label>Dział</Label>
                                        <Select value={newOrderDepartment} onValueChange={setNewOrderDepartment}>
                                            <SelectTrigger><SelectValue placeholder="Wybierz dział" /></SelectTrigger>
                                            <SelectContent>
                                                {config.departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Stanowisko</Label>
                                        <Select value={newOrderJobTitle} onValueChange={setNewOrderJobTitle}>
                                            <SelectTrigger><SelectValue placeholder="Wybierz stanowisko" /></SelectTrigger>
                                            <SelectContent>
                                                {config.jobTitles.map(j => <SelectItem key={j.id} value={j.name}>{j.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Ilość</Label>
                                        <Input
                                            type="number"
                                            value={newOrderQuantity}
                                            onChange={(e) => setNewOrderQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                            min="1"
                                        />
                                    </div>
                                    <Button onClick={handleAddNewOrder} className="w-full">
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Dodaj zamówienie
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="replacement">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Zamówienie na zastępstwo</CardTitle>
                                    <CardDescription>Wybierz pracownika, którego ma dotyczyć zastępstwo.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                      <Label>Pracownik do zastąpienia</Label>
                                      <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                                        <PopoverTrigger asChild>
                                          <Button variant="outline" role="combobox" aria-expanded={isComboboxOpen} className="w-full justify-between">
                                            {selectedEmployeeForReplacement ? selectedEmployeeForReplacement.fullName : "Wybierz pracownika..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                          <Command>
                                            <CommandInput placeholder="Szukaj pracownika..." />
                                            <CommandList>
                                                <CommandEmpty>Nie znaleziono pracownika.</CommandEmpty>
                                                <CommandGroup>
                                                    {employees.map((employee) => (
                                                        <CommandItem
                                                            key={employee.id}
                                                            value={employee.fullName}
                                                            onSelect={() => {
                                                                setReplacementEmployeeId(employee.id);
                                                                setIsComboboxOpen(false);
                                                            }}
                                                        >
                                                            <CheckIcon className={cn("mr-2 h-4 w-4", replacementEmployeeId === employee.id ? "opacity-100" : "opacity-0")} />
                                                            {employee.fullName}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                          </Command>
                                        </PopoverContent>
                                      </Popover>
                                    </div>
                                    {selectedEmployeeForReplacement && (
                                        <div className="text-sm text-muted-foreground p-2 border rounded-md">
                                            <p><strong>Dział:</strong> {selectedEmployeeForReplacement.department}</p>
                                            <p><strong>Stanowisko:</strong> {selectedEmployeeForReplacement.jobTitle}</p>
                                        </div>
                                    )}
                                    <Button onClick={handleAddReplacementOrder} disabled={!replacementEmployeeId} className="w-full">
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Utwórz zastępstwo
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Aktywne zamówienia</CardTitle>
                            <CardDescription>Lista aktualnych zapotrzebowań na personel.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {Object.keys(groupedOrders).length > 0 ? (
                               <Accordion type="multiple" className="w-full">
                                   {Object.entries(groupedOrders).map(([dept, orderList]) => (
                                       <AccordionItem value={dept} key={dept}>
                                           <AccordionTrigger>
                                                <div className='flex justify-between w-full pr-4 items-center'>
                                                    <span className='font-bold text-base'>{dept}</span>
                                                    <span className='text-muted-foreground text-sm font-normal'>
                                                        {orderList.reduce((sum, o) => sum + o.quantity, 0)} os.
                                                    </span>
                                                </div>
                                           </AccordionTrigger>
                                           <AccordionContent>
                                                <div className="space-y-2 pl-4">
                                                    {orderList.map(order => {
                                                        const realized = order.realizedQuantity || 0;
                                                        const remaining = order.quantity - realized;
                                                        return (
                                                            <div key={order.id} className="flex items-start justify-between p-3 rounded-md border">
                                                                <div>
                                                                    <p className="font-medium">{order.jobTitle}</p>
                                                                    <div className="text-xs text-muted-foreground mt-1">
                                                                        {order.type === 'replacement' && order.replacesEmployeeInfo ? (
                                                                            <p>Zastępstwo za: <span className="font-semibold">{order.replacesEmployeeInfo.fullName}</span></p>
                                                                        ) : (
                                                                            <p>Nowe stanowisko</p>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground space-y-1 mt-2">
                                                                        <p>Ilość: <span className='font-semibold'>{order.quantity}</span></p>
                                                                        <p>Zrealizowano: <span className='font-semibold text-green-500'>{realized}</span></p>
                                                                        <p>Pozostało: <span className='font-semibold text-orange-500'>{remaining}</span></p>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(order)}>
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" onClick={() => deleteOrder(order.id)}>
                                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                           </AccordionContent>
                                       </AccordionItem>
                                   ))}
                               </Accordion>
                            ) : (
                                <p className="text-center text-muted-foreground py-10">Brak aktywnych zamówień.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edytuj zamówienie</DialogTitle>
                        <DialogDescription>
                            Zmień dane dotyczące zapotrzebowania na personel.
                        </DialogDescription>
                    </DialogHeader>
                    {editFormData && (
                       <div className="grid gap-4 py-4">
                           {editingOrder?.type === 'new' && (
                               <>
                                <div className="space-y-1">
                                    <Label>Dział</Label>
                                    <Select 
                                        value={editFormData.department} 
                                        onValueChange={(value) => setEditFormData(d => d ? {...d, department: value} : null)}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Wybierz dział" /></SelectTrigger>
                                        <SelectContent>
                                            {config.departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Stanowisko</Label>
                                    <Select 
                                        value={editFormData.jobTitle} 
                                        onValueChange={(value) => setEditFormData(d => d ? {...d, jobTitle: value} : null)}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Wybierz stanowisko" /></SelectTrigger>
                                        <SelectContent>
                                            {config.jobTitles.map(j => <SelectItem key={j.id} value={j.name}>{j.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                               </>
                           )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label>Ilość zamówiona</Label>
                                    <Input 
                                        type="number"
                                        value={editFormData.quantity}
                                        onChange={(e) => setEditFormData(d => d ? {...d, quantity: Math.max(1, parseInt(e.target.value, 10) || 1)} : null)}
                                        min="1"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label>Ilość zrealizowano</Label>
                                    <Input 
                                        type="number"
                                        value={editFormData.realizedQuantity}
                                        onChange={(e) => setEditFormData(d => d ? {...d, realizedQuantity: Math.max(0, parseInt(e.target.value, 10) || 0)} : null)}
                                        min="0"
                                    />
                                </div>
                            </div>
                       </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Anuluj</Button>
                        <Button onClick={handleUpdateOrder}>Zapisz zmiany</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}