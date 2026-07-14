'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { PlusCircle } from 'lucide-react';
import type { Car } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { useAppContext } from '@/context/app-context';
import { CarTable } from './car-table';
import { CarForm } from '@/components/car-form';
import { useIsMobile } from '@/hooks/use-mobile';

export default function AutaPage() {
  const { cars, employees, isLoading: isContextLoading, handleSaveCar, handleTerminateCar, handleDeleteCarPermanently } = useAppContext();
  
  const [editingCar, setEditingCar] = useState<Car | 'new' | null>(null);
  const [terminatingCar, setTerminatingCar] = useState<Car | null>(null);
  const [deletingCar, setDeletingCar] = useState<Car | null>(null);
  
  const isMobile = useIsMobile();

  const activeCars = cars.filter(c => c.status === 'active');

  const handleEditCar = (car: Car) => {
    setEditingCar(car);
  };

  const handleAddNew = () => {
    setEditingCar('new');
  };

  const handleSave = async (car: Car) => {
    const success = await handleSaveCar(car);
    if (success) {
      setEditingCar(null);
    }
  };

  const onTerminate = async (id: string) => {
    await handleTerminateCar(id);
    setTerminatingCar(null);
  };

  const onDeletePermanently = async (id: string) => {
    await handleDeleteCarPermanently(id);
    setDeletingCar(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader title="Auta Aktywne" description="Zarządzaj aktywnymi autami i kierowcami w firmie." />
        <Button onClick={handleAddNew} className="w-full sm:w-auto h-11">
          <PlusCircle className="mr-2 h-4 w-4" />
          Dodaj Auto
        </Button>
      </div>

      <CarTable 
        data={activeCars} 
        isLoading={isContextLoading} 
        status="active" 
        onEdit={handleEditCar}
        onTerminate={setTerminatingCar}
        onDelete={setDeletingCar}
      />

      {/* Responsive Form: Dialog on desktop, Sheet on mobile */}
      {!isMobile ? (
        <Dialog open={editingCar !== null} onOpenChange={(open) => !open && setEditingCar(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCar === 'new' ? 'Dodaj Nowe Auto' : 'Edytuj Auto'}</DialogTitle>
            </DialogHeader>
            <div className="pt-4 max-h-[80vh] overflow-y-auto px-1 custom-scrollbar">
              <CarForm 
                car={editingCar === 'new' ? null : editingCar} 
                onSave={handleSave} 
                onCancel={() => setEditingCar(null)} 
                employees={employees}
              />
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <Sheet open={editingCar !== null} onOpenChange={(open) => !open && setEditingCar(null)}>
          <SheetContent side="bottom" className="h-[90dvh] pt-10 pb-0 px-0 flex flex-col rounded-t-xl">
             <SheetHeader className="px-6 pb-2 border-b text-left">
              <SheetTitle>{editingCar === 'new' ? 'Dodaj Nowe Auto' : 'Edytuj Auto'}</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
               <CarForm 
                car={editingCar === 'new' ? null : editingCar} 
                onSave={handleSave} 
                onCancel={() => setEditingCar(null)} 
                employees={employees}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Terminate confirmation */}
      <AlertDialog open={terminatingCar !== null} onOpenChange={(open) => !open && setTerminatingCar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz przenieść to auto do historii?</AlertDialogTitle>
            <AlertDialogDescription>
              Auto <span className="font-semibold text-foreground">{terminatingCar?.registrationNumber}</span> 
              zostanie przeniesione do historii z dzisiejszą datą zakończenia ("Do kiedy").
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => terminatingCar && onTerminate(terminatingCar.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Przenieś do historii
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete permanently confirmation */}
      <AlertDialog open={deletingCar !== null} onOpenChange={(open) => !open && setDeletingCar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć to auto trwale?</AlertDialogTitle>
            <AlertDialogDescription>
              Tej operacji nie można cofnąć. Auto <span className="font-semibold text-foreground">{deletingCar?.registrationNumber}</span> zostanie trwale usunięte z bazy danych.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingCar && onDeletePermanently(deletingCar.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Usuń trwale
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
