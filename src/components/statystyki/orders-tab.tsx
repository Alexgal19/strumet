'use client';

import { useEffect, useMemo, useState } from 'react';
import { onValue, ref as dbRef } from 'firebase/database';
import { Edit, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { getDB } from '@/lib/firebase';
import { objectToArray } from '@/lib/utils';
import type { Order } from '@/lib/types';

export const OrdersTab = () => {
    const { config, addOrder, updateOrder, deleteOrder, isLoading: isAppLoading, isAdmin } = useAppContext();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(true);
    const { toast } = useToast();

    const [newOrderDepartment, setNewOrderDepartment] = useState('');
    const [newOrderJobTitle, setNewOrderJobTitle] = useState('');
    const [newOrderQuantity, setNewOrderQuantity] = useState(1);

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [editFormData, setEditFormData] = useState<{ department: string; jobTitle: string; quantity: number; realizedQuantity: number; } | null>(null);

    useEffect(() => {
        const db = getDB();
        if (!db) return;

        const ordersRef = dbRef(db, 'orders');
        const unsubscribe = onValue(ordersRef, (snapshot) => {
            setOrders(objectToArray(snapshot.val()));
            setIsLoadingOrders(false);
        });
        return () => unsubscribe();
    }, []);

    const resetForm = () => {
        setNewOrderDepartment('');
        setNewOrderJobTitle('');
        setNewOrderQuantity(1);
    }

    const handleAddNewOrder = async (type: 'new' | 'replacement') => {
        if (!newOrderDepartment || !newOrderJobTitle || newOrderQuantity < 1) {
            toast({ variant: 'destructive', title: 'Błąd walidacji', description: 'Wszystkie pola muszą być wypełnione.' });
            return;
        }
        await addOrder({
            department: newOrderDepartment,
            jobTitle: newOrderJobTitle,
            quantity: newOrderQuantity,
            realizedQuantity: 0,
            type: type,
        });
        resetForm();
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

    return (
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
            {isAdmin && (
                <div className="order-2 lg:order-1 lg:col-span-1">
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
                                    <Button onClick={() => handleAddNewOrder('new')} className="w-full">
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
                                    <CardDescription>Wypełnij formularz, aby utworzyć zamówienie na zastępstwo.</CardDescription>
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
                                    <Button onClick={() => handleAddNewOrder('replacement')} className="w-full">
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Dodaj zastępstwo
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            )}
            <div className={isAdmin ? "order-1 lg:order-2 lg:col-span-2" : "order-1 lg:order-2 lg:col-span-3"}>
                <Card>
                    <CardHeader>
                        <CardTitle>Aktywne zamówienia</CardTitle>
                        <CardDescription>Lista aktualnych zapotrzebowań na personel.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {Object.keys(groupedOrders).length > 0 ? (
                            <Accordion type="multiple" className="w-full">
                                {Object.entries(groupedOrders).map(([dept, orderList]) => {
                                    const hasNewOrders = orderList.some(o => o.type === 'new');
                                    const hasReplacementOrders = orderList.some(o => o.type === 'replacement');

                                    return (
                                        <AccordionItem value={dept} key={dept}>
                                            <AccordionTrigger>
                                                <div className='flex justify-between w-full pr-4 items-center'>
                                                    <div className="flex items-center gap-2">
                                                        <span className='font-bold text-base'>{dept}</span>
                                                        {hasNewOrders && <Badge variant="outline">Nowe</Badge>}
                                                        {hasReplacementOrders && <Badge variant="secondary" className="border-orange-500/80 text-orange-800">Zastępstwo</Badge>}
                                                    </div>
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
                                                                    <div className="text-xs text-muted-foreground space-y-1 mt-2">
                                                                        <p>Ilość: <span className='font-semibold'>{order.quantity}</span></p>
                                                                        <p>Zrealizowano: <span className='font-semibold text-green-500'>{realized}</span></p>
                                                                        <p>Pozostało: <span className='font-semibold text-orange-500'>{remaining}</span></p>
                                                                    </div>
                                                                </div>
                                                                {isAdmin && <div>
                                                                    <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => handleOpenEditDialog(order)}>
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => deleteOrder(order.id)}>
                                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                                    </Button>
                                                                </div>}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    )
                                })}
                            </Accordion>
                        ) : (
                            <p className="text-center text-muted-foreground py-10">Brak aktywnych zamówień.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-lg">
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
                                            onValueChange={(value) => setEditFormData(d => d ? { ...d, department: value } : null)}
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
                                            onValueChange={(value) => setEditFormData(d => d ? { ...d, jobTitle: value } : null)}
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
                                        onChange={(e) => setEditFormData(d => d ? { ...d, quantity: Math.max(1, parseInt(e.target.value, 10) || 1) } : null)}
                                        min="1"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label>Ilość zrealizowano</Label>
                                    <Input
                                        type="number"
                                        value={editFormData.realizedQuantity}
                                        onChange={(e) => setEditFormData(d => d ? { ...d, realizedQuantity: Math.max(0, parseInt(e.target.value, 10) || 0) } : null)}
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
    )
}
