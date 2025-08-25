'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { PlusCircle, Trash2, Loader2 } from 'lucide-react';
import type { ConfigItem } from '@/lib/types';
import { useFirebaseData, type ConfigType } from '@/context/config-context';
import { set, ref } from 'firebase/database';
import { db } from '@/lib/firebase';


interface ConfigListProps {
  title: string;
  items: ConfigItem[];
  configType: ConfigType;
  onUpdate: (configType: ConfigType, items: ConfigItem[]) => void;
}

const ConfigList: React.FC<ConfigListProps> = ({ title, items, configType, onUpdate }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  const handleAddItem = () => {
    if (newItemName.trim()) {
      const newItem: ConfigItem = {
        id: `${configType.slice(0, 2)}-${Date.now()}`, 
        name: newItemName.trim(),
      };
      onUpdate(configType, [...items, newItem]);
      setNewItemName('');
      setIsDialogOpen(false);
    }
  };

  const handleDeleteItem = (id: string) => {
    onUpdate(configType, items.filter(item => item.id !== id));
  };
  
  return (
    <Card className="flex flex-col flex-grow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
           <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <Button asChild variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
                  <span><PlusCircle className="mr-2 h-4 w-4" />Dodaj</span>
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dodaj nową pozycję do: {title}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Input 
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Wprowadź nazwę..."
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Anuluj</Button>
                  </DialogClose>
                  <Button onClick={handleAddItem}>Zapisz</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto">
        <div className="rounded-md border h-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nazwa</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};


function ConfigurationPageComponent() {
    const { config, isLoading, updateConfig } = useFirebaseData();
    
    const { departments, jobTitles, managers, nationalities, clothingItems } = config;

    const handleUpdate = useCallback(async (configType: ConfigType, newItems: ConfigItem[]) => {
      try {
        const newObject = newItems.reduce((acc, item) => {
          const { id, ...rest } = item;
          acc[id] = rest;
          return acc;
        }, {} as Record<string, {name: string}>);

        await set(ref(db, `config/${configType}`), newObject);
      } catch (error) {
          console.error("Failed to save config to Firebase", error);
      }
    }, []);

    if (isLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="flex h-full flex-col">
        <PageHeader
            title="Konfiguracja"
            description="Zarządzaj listami używanymi w całej aplikacji."
        />
        <Tabs defaultValue="departments" className="mt-4 flex flex-col flex-grow">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
            <TabsTrigger value="departments">Działy</TabsTrigger>
            <TabsTrigger value="jobTitles">Stanowiska</TabsTrigger>
            <TabsTrigger value="managers">Kierownicy</TabsTrigger>
            <TabsTrigger value="nationalities">Narodowości</TabsTrigger>
            <TabsTrigger value="clothingItems">Odzież</TabsTrigger>
            </TabsList>
            <TabsContent value="departments" className="mt-4 flex flex-col flex-grow">
                <ConfigList title="Działy" items={departments} configType='departments' onUpdate={handleUpdate} />
            </TabsContent>
            <TabsContent value="jobTitles" className="mt-4 flex flex-col flex-grow">
                <ConfigList title="Miejsca pracy" items={jobTitles} configType='jobTitles' onUpdate={handleUpdate} />
            </TabsContent>
            <TabsContent value="managers" className="mt-4 flex flex-col flex-grow">
                <ConfigList title="Kierownicy" items={managers} configType='managers' onUpdate={handleUpdate} />
            </TabsContent>
            <TabsContent value="nationalities" className="mt-4 flex flex-col flex-grow">
                <ConfigList title="Narodowości" items={nationalities} configType='nationalities' onUpdate={handleUpdate} />
            </TabsContent>
            <TabsContent value="clothingItems" className="mt-4 flex flex-col flex-grow">
                <ConfigList title="Elementy odzieży" items={clothingItems} configType='clothingItems' onUpdate={handleUpdate} />
            </TabsContent>
        </Tabs>
        </div>
    );
}

const ConfigurationPage = React.memo(ConfigurationPageComponent);
export default ConfigurationPage;
