'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, Loader2, Edit } from 'lucide-react';
import type { ConfigItem, ConfigType, AllConfig, Employee } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, set, push, remove, update } from 'firebase/database';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useHasMounted } from '@/hooks/use-mobile';

type ConfigView = 'departments' | 'jobTitles' | 'managers' | 'nationalities' | 'clothingItems';

const configLabels: Record<ConfigView, string> = {
  departments: 'Działy',
  jobTitles: 'Stanowiska',
  managers: 'Kierownicy',
  nationalities: 'Narodowości',
  clothingItems: 'Odzież',
};

const configTypeToEmployeeField: Record<ConfigType, keyof Employee> = {
  departments: 'department',
  jobTitles: 'jobTitle',
  managers: 'manager',
  nationalities: 'nationality',
  clothingItems: 'fullName', // Not directly linked to an employee field
};

interface ConfigurationPageProps {
  config: AllConfig;
  employees: Employee[];
  isLoading: boolean;
}

export default function ConfigurationPage({ config, employees, isLoading }: ConfigurationPageProps) {
  const hasMounted = useHasMounted();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [currentConfigType, setCurrentConfigType] = useState<ConfigType | null>(null);
  const [newItemsText, setNewItemsText] = useState('');
  
  const [editingItem, setEditingItem] = useState<{ id: string; name: string } | null>(null);
  const [editedItemName, setEditedItemName] = useState('');

  const { toast } = useToast();

  const openAddDialog = (configType: ConfigType) => {
    setCurrentConfigType(configType);
    setNewItemsText('');
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (configType: ConfigType, item: ConfigItem) => {
    setCurrentConfigType(configType);
    setEditingItem(item);
    setEditedItemName(item.name);
    setIsEditDialogOpen(true);
  }

  const handleAddMultipleItems = () => {
    if (!currentConfigType || !newItemsText.trim()) return;

    const itemsToAdd = newItemsText
      .split('\n')
      .map(name => name.trim())
      .filter(name => name !== '');
    
    if (itemsToAdd.length === 0) return;

    const configRef = ref(db, `config/${currentConfigType}`);
    itemsToAdd.forEach(itemName => {
      const newItemRef = push(configRef);
      set(newItemRef, { name: itemName });
    });

    toast({ title: "Sukces", description: `${itemsToAdd.length} ${itemsToAdd.length > 1 ? 'elementy zostały' : 'element został'} dodane.`});
    setIsAddDialogOpen(false);
    setNewItemsText('');
    setCurrentConfigType(null);
  };
  
  const handleUpdateItem = async () => {
      if (!editingItem || !currentConfigType || !editedItemName.trim()) return;
      
      const oldName = editingItem.name;
      const newName = editedItemName.trim();
      
      if (oldName === newName) {
          setIsEditDialogOpen(false);
          return;
      }
      
      try {
          const updates: Record<string, any> = {};
          
          // 1. Update the config item itself
          updates[`/config/${currentConfigType}/${editingItem.id}/name`] = newName;
          
          // 2. Find and update all employees using the old value
          const employeeFieldToUpdate = configTypeToEmployeeField[currentConfigType];
          if (employeeFieldToUpdate && currentConfigType !== 'clothingItems') {
              employees.forEach(employee => {
                  if (employee[employeeFieldToUpdate] === oldName) {
                      updates[`/employees/${employee.id}/${employeeFieldToUpdate}`] = newName;
                  }
              });
          }
          
          await update(ref(db), updates);
          
          toast({ title: "Sukces", description: "Element został zaktualizowany."});
      } catch (error) {
          console.error("Error updating item:", error);
          toast({ variant: 'destructive', title: "Błąd", description: "Nie udało się zaktualizować elementu."});
      } finally {
          setIsEditDialogOpen(false);
          setEditingItem(null);
          setCurrentConfigType(null);
          setEditedItemName('');
      }
  };

  const handleRemoveItem = (configType: ConfigType, itemId: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten element?')) {
      const itemRef = ref(db, `config/${configType}/${itemId}`);
      remove(itemRef);
      toast({ title: "Sukces", description: "Element został usunięty."});
    }
  };

  const renderConfigList = (configType: ConfigType, items: ConfigItem[]) => (
    <div className="mt-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{configLabels[configType as ConfigView]}</CardTitle>
          <CardDescription>Zarządzaj listą dostępnych {configLabels[configType as ConfigView].toLowerCase()}.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-md border p-3 gap-2">
                <span className="font-medium flex-1 break-words min-w-0">{item.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8" onClick={() => openEditDialog(configType, item)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8" onClick={() => handleRemoveItem(configType, item.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
              </div>
            ))}
            {items.length === 0 && <p className="text-sm text-muted-foreground">Brak zdefiniowanych elementów.</p>}
          </div>
          <Button className="mt-4" onClick={() => openAddDialog(configType)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Dodaj nowe
          </Button>
        </CardContent>
      </Card>
    </div>
  );
  
  if (isLoading || !hasMounted) return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="flex h-full flex-col">
      <PageHeader 
        title="Konfiguracja"
        description="Zarządzaj opcjami dostępnymi w systemie."
      />
      
      <Tabs defaultValue="departments" className="flex h-full w-full flex-col">
        <div className="flex justify-center">
            <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="departments">Działy</TabsTrigger>
            <TabsTrigger value="jobTitles">Stanowiska</TabsTrigger>
            <TabsTrigger value="managers">Kierownicy</TabsTrigger>
            <TabsTrigger value="nationalities">Narodowości</TabsTrigger>
            <TabsTrigger value="clothingItems">Odzież</TabsTrigger>
            </TabsList>
        </div>
        <TabsContent value="departments" className="flex-grow">
          {renderConfigList('departments', config.departments)}
        </TabsContent>
        <TabsContent value="jobTitles" className="flex-grow">
          {renderConfigList('jobTitles', config.jobTitles)}
        </TabsContent>
        <TabsContent value="managers" className="flex-grow">
          {renderConfigList('managers', config.managers)}
        </TabsContent>
        <TabsContent value="nationalities" className="flex-grow">
          {renderConfigList('nationalities', config.nationalities)}
        </TabsContent>
         <TabsContent value="clothingItems" className="flex-grow">
          {renderConfigList('clothingItems', config.clothingItems)}
        </TabsContent>
      </Tabs>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj nowe {currentConfigType ? configLabels[currentConfigType as ConfigView].toLowerCase() : ''}</DialogTitle>
            <DialogDescription>
              Wprowadź nazwy, każdą w nowej linii. Puste linie zostaną zignorowane.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="new-items-text">Nazwy</Label>
              <Textarea 
                id="new-items-text" 
                placeholder="Nazwa 1\nNazwa 2\nNazwa 3..." 
                value={newItemsText}
                onChange={(e) => setNewItemsText(e.target.value)}
                className="h-32"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Anuluj</Button>
            </DialogClose>
            <Button onClick={handleAddMultipleItems}>Dodaj</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edytuj {currentConfigType ? configLabels[currentConfigType as ConfigView].toLowerCase().slice(0, -1) + 'ę' : ''}</DialogTitle>
             <DialogDescription>
                Zmiana nazwy spowoduje aktualizację danych u wszystkich przypisanych pracowników.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="edit-item-name">Nowa nazwa</Label>
              <Input
                id="edit-item-name"
                value={editedItemName}
                onChange={(e) => setEditedItemName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Anuluj</Button>
            </DialogClose>
            <Button onClick={handleUpdateItem}>Zapisz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}