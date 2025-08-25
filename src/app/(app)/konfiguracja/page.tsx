'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useFirebaseData } from '@/context/config-context';
import type { ConfigItem, ConfigType } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, set, push, remove } from 'firebase/database';


type ConfigView = 'departments' | 'jobTitles' | 'managers' | 'nationalities' | 'clothingItems';

const configLabels: Record<ConfigView, string> = {
  departments: 'Działy',
  jobTitles: 'Stanowiska',
  managers: 'Kierownicy',
  nationalities: 'Narodowości',
  clothingItems: 'Odzież',
};

export default function ConfigurationPage() {
  const { config, isLoading } = useFirebaseData();

  const handleAddItem = (configType: ConfigType) => {
    const newItemName = prompt(`Wprowadź nazwę dla nowego elementu w "${configLabels[configType as ConfigView]}":`);
    if (newItemName && newItemName.trim() !== '') {
      const configRef = ref(db, `config/${configType}`);
      const newItemRef = push(configRef);
      set(newItemRef, { name: newItemName.trim() });
    }
  };
  
  const handleRemoveItem = (configType: ConfigType, itemId: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten element?')) {
      const itemRef = ref(db, `config/${configType}/${itemId}`);
      remove(itemRef);
    }
  };

  const renderConfigList = (configType: ConfigType, items: ConfigItem[]) => (
    <div className="mt-16 space-y-4">
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
          <Button className="mt-4" onClick={() => handleAddItem(configType)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Dodaj nowy
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div>
      <PageHeader 
        title="Konfiguracja"
        description="Zarządzaj opcjami dostępnymi w systemie."
      />
      
      <Tabs defaultValue="departments" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
          <TabsTrigger value="departments">Działy</TabsTrigger>
          <TabsTrigger value="jobTitles">Stanowiska</TabsTrigger>
          <TabsTrigger value="managers">Kierownicy</TabsTrigger>
          <TabsTrigger value="nationalities">Narodowości</TabsTrigger>
          <TabsTrigger value="clothingItems">Odzież</TabsTrigger>
        </TabsList>
        <TabsContent value="departments">
          {renderConfigList('departments', config.departments)}
        </TabsContent>
        <TabsContent value="jobTitles">
          {renderConfigList('jobTitles', config.jobTitles)}
        </TabsContent>
        <TabsContent value="managers">
          {renderConfigList('managers', config.managers)}
        </TabsContent>
        <TabsContent value="nationalities">
          {renderConfigList('nationalities', config.nationalities)}
        </TabsContent>
         <TabsContent value="clothingItems">
          {renderConfigList('clothingItems', config.clothingItems)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
