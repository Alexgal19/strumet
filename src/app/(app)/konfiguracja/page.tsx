'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useFirebaseData } from '@/context/config-context';
import type { ConfigItem, ConfigType } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, set, push, remove } from 'firebase/database';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type ConfigView = 'departments' | 'jobTitles' | 'managers' | 'nationalities' | 'clothingItems';

const configLabels: Record<ConfigView, string> = {
  departments: 'Działy',
  jobTitles: 'Stanowiska',
  managers: 'Kierownicy',
  nationalities: 'Narodowości',
  clothingItems: 'Odzież',
};

export default function ConfigurationPage() {
  const { config } = useFirebaseData();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentConfigType, setCurrentConfigType] = useState<ConfigType | null>(null);
  const [newItemsText, setNewItemsText] = useState('');

  const openAddDialog = (configType: ConfigType) => {
    setCurrentConfigType(configType);
    setNewItemsText('');
    setIsAddDialogOpen(true);
  };

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

    setIsAddDialogOpen(false);
    setNewItemsText('');
    setCurrentConfigType(null);
  };

  const handleRemoveItem = (configType: ConfigType, itemId: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten element?')) {
      const itemRef = ref(db, `config/${configType}/${itemId}`);
      remove(itemRef);
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
              <div key={item.id} className="flex items-center justify-between rounded-md border p-3">
                <span className="font-medium">{item.name}</span>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleRemoveItem(configType, item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
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

  return (
    <div className="flex h-full flex-col">
      <PageHeader 
        title="Konfiguracja"
        description="Zarządzaj opcjami dostępnymi w systemie."
      />
      
      <Tabs defaultValue="departments" className="flex h-full w-full flex-col">
        <TabsList className="flex-wrap h-auto justify-start">
          <TabsTrigger value="departments">Działy</TabsTrigger>
          <TabsTrigger value="jobTitles">Stanowiska</TabsTrigger>
          <TabsTrigger value="managers">Kierownicy</TabsTrigger>
          <TabsTrigger value="nationalities">Narodowości</TabsTrigger>
          <TabsTrigger value="clothingItems">Odzież</TabsTrigger>
        </TabsList>
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

    </div>
  );
}
