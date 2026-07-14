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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import type { Car } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { useAppContext } from '@/context/app-context';
import { CarTable } from '../auta/car-table';
import { CarForm } from '@/components/car-form';
import { useIsMobile } from '@/hooks/use-mobile';

export default function AutaHistoriaPage() {
  const { cars, employees, isLoading: isContextLoading, handleSaveCar, handleRestoreCar, handleDeleteCarPermanently } = useAppContext();
  
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [restoringCar, setRestoringCar] = useState<Car | null>(null);
  const [deletingCar, setDeletingCar] = useState<Car | null>(null);
  
  const isMobile = useIsMobile();

  const historyCars = cars.filter(c => c.status === 'history');

  const handleEditCar = (car: Car) => {
    setEditingCar(car);
  };

  const handleSave = async (car: Car) => {
    const success = await handleSaveCar(car);
    if (success) {
      setEditingCar(null);
    }
  };

  const onRestore = async (id: string) => {
    await handleRestoreCar(id);
    setRestoringCar(null);
  };

  const onDeletePermanently = async (id: string) => {
    await handleDeleteCarPermanently(id);
    setDeletingCar(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader title="Historia Aut" description="Przeglądaj auta wycofane z użytku lub przeniesione do historii." />
      </div>

      <CarTable 
        data={historyCars} 
        isLoading={isContextLoading} 
        status="history" 
        onEdit={handleEditCar}
        onRestore={setRestoringCar}
        onDelete={setDeletingCar}
      />

      {/* Responsive Form: Dialog on desktop, Sheet on mobile */}
      {!isMobile ? (
        <Dialog open={editingCar !== null} onOpenChange={(open) => !open && setEditingCar(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edytuj Auto (Historia)</DialogTitle>
            </DialogHeader>
            <div className="pt-4 max-h-[80vh] overflow-y-auto px-1 custom-scrollbar">
              <CarForm 
                car={editingCar} 
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
              <SheetTitle>Edytuj Auto (Historia)</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
               <CarForm 
                car={editingCar} 
                onSave={handleSave} 
                onCancel={() => setEditingCar(null)} 
                employees={employees}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Restore confirmation */}
      <AlertDialog open={restoringCar !== null} onOpenChange={(open) => !open && setRestoringCar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz przywrócić to auto?</AlertDialogTitle>
            <AlertDialogDescription>
              Auto <span className="font-semibold text-foreground">{restoringCar?.registrationNumber}</span> 
              zostanie ponownie oznaczone jako aktywne.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => restoringCar && onRestore(restoringCar.id)}
            >
              Przywróć
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
