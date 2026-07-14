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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { PlusCircle } from 'lucide-react';
import type { Car } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { useAppContext } from '@/context/app-context';
import { CarTable } from './car-table';
import { CarForm } from '@/components/car-form';
import { useIsMobile } from '@/hooks/use-mobile';

export default function AutaPage() {
  const { cars, employees, isLoading: isContextLoading, handleSaveCar, handleTerminateCar, handleRestoreCar, handleDeleteCarPermanently } = useAppContext();
  
  const [activeTab, setActiveTab] = useState<string>('active');
  const [editingCar, setEditingCar] = useState<Car | 'new' | null>(null);
  const [terminatingCar, setTerminatingCar] = useState<Car | null>(null);
  const [restoringCar, setRestoringCar] = useState<Car | null>(null);
  const [deletingCar, setDeletingCar] = useState<Car | null>(null);
  
  const isMobile = useIsMobile();

  const activeCars = cars.filter(c => c.status === 'active');
  const historyCars = cars.filter(c => c.status === 'history');

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
        <PageHeader title="Pojazdy" description="Zarządzaj autami, kierowcami i historią floty w firmie." />
        <Button onClick={handleAddNew} className="w-full sm:w-auto h-11">
          <PlusCircle className="mr-2 h-4 w-4" />
          Dodaj Auto
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
          <TabsTrigger value="active">Aktywne ({activeCars.length})</TabsTrigger>
          <TabsTrigger value="history">Historia ({historyCars.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-6">
          <CarTable 
            data={activeCars} 
            isLoading={isContextLoading} 
            status="active" 
            onEdit={handleEditCar}
            onTerminate={setTerminatingCar}
            onDelete={setDeletingCar}
          />
        </TabsContent>
        
        <TabsContent value="history" className="mt-6">
          <CarTable 
            data={historyCars} 
            isLoading={isContextLoading} 
            status="history" 
            onEdit={handleEditCar}
            onRestore={setRestoringCar}
            onDelete={setDeletingCar}
          />
        </TabsContent>
      </Tabs>

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
