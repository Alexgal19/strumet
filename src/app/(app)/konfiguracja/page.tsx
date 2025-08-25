'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { onValue, ref } from 'firebase/database';
import { db } from '@/lib/firebase';

interface ConfigListProps {
  title: string;
  items: ConfigItem[];
  configType: ConfigType;
  updateLocalItems: (items: ConfigItem[]) => void;
}

const ConfigList: React.FC<ConfigListProps> = ({ title, items, configType, updateLocalItems }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  const handleAddItem = () => {
    if (newItemName.trim()) {
      const newItem: ConfigItem = {
        id: `${configType.slice(0, 2)}-${Date.now()}`, 
        name: newItemName.trim(),
      };
      updateLocalItems([...items, newItem]);
      setNewItemName('');
      setIsDialogOpen(false);
    }
  };

  const handleDeleteItem = (id: string) => {
    updateLocalItems(items.filter(item => item.id !== id));
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
    const { fetchConfig, updateConfig } = useFirebaseData();
    const [isLoading, setIsLoading] = useState(true);
    const [localConfig, setLocalConfig] = useState({
      departments: [] as ConfigItem[], 
      jobTitles: [] as ConfigItem[], 
      managers: [] as ConfigItem[], 
      nationalities: [] as ConfigItem[], 
      clothingItems: [] as ConfigItem[]
    });
    
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const [depts, jobs, mgrs, nats, clothes] = await Promise.all([
                fetchConfig('departments'),
                fetchConfig('jobTitles'),
                fetchConfig('managers'),
                fetchConfig('nationalities'),
                fetchConfig('clothingItems'),
            ]);
            setLocalConfig({
                departments: depts,
                jobTitles: jobs,
                managers: mgrs,
                nationalities: nats,
                clothingItems: clothes
            });
            setIsLoading(false);
        };
        loadData();

        const configRef = ref(db, 'config');
        const unsubscribe = onValue(configRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                 setLocalConfig({
                    departments: data.departments ? Object.keys(data.departments).map(key => ({ id: key, ...data.departments[key] })) : [],
                    jobTitles: data.jobTitles ? Object.keys(data.jobTitles).map(key => ({ id: key, ...data.jobTitles[key] })) : [],
                    managers: data.managers ? Object.keys(data.managers).map(key => ({ id: key, ...data.managers[key] })) : [],
                    nationalities: data.nationalities ? Object.keys(data.nationalities).map(key => ({ id: key, ...data.nationalities[key] })) : [],
                    clothingItems: data.clothingItems ? Object.keys(data.clothingItems).map(key => ({ id: key, ...data.clothingItems[key] })) : [],
                });
            }
        });

        return () => unsubscribe();
    }, [fetchConfig]);

    const handleUpdate = useCallback((configType: ConfigType, newItems: ConfigItem[]) => {
      setLocalConfig(prev => ({ ...prev, [configType]: newItems }));
      updateConfig(configType, newItems);
    }, [updateConfig]);

    if (isLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="flex h-full flex-col">
        <PageHeader
            title="Konfiguracja"
            description="Zarządzaj listami używanymi w całej aplikacji."
        />
        <Tabs defaultValue="departments" className="flex flex-col flex-grow">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
            <TabsTrigger value="departments">Działy</TabsTrigger>
            <TabsTrigger value="jobTitles">Stanowiska</TabsTrigger>
            <TabsTrigger value="managers">Kierownicy</TabsTrigger>
            <TabsTrigger value="nationalities">Narodowości</TabsTrigger>
            <TabsTrigger value="clothingItems">Odzież</TabsTrigger>
            </TabsList>
            <TabsContent value="departments" className="mt-4 flex flex-col flex-grow">
                <ConfigList title="Działy" items={localConfig.departments} configType='departments' updateLocalItems={(items) => handleUpdate('departments', items)} />
            </TabsContent>
            <TabsContent value="jobTitles" className="mt-4 flex flex-col flex-grow">
                <ConfigList title="Miejsca pracy" items={localConfig.jobTitles} configType='jobTitles' updateLocalItems={(items) => handleUpdate('jobTitles', items)} />
            </TabsContent>
            <TabsContent value="managers" className="mt-4 flex flex-col flex-grow">
                <ConfigList title="Kierownicy" items={localConfig.managers} configType='managers' updateLocalItems={(items) => handleUpdate('managers', items)} />
            </TabsContent>
            <TabsContent value="nationalities" className="mt-4 flex flex-col flex-grow">
                <ConfigList title="Narodowości" items={localConfig.nationalities} configType='nationalities' updateLocalItems={(items) => handleUpdate('nationalities', items)} />
            </TabsContent>
            <TabsContent value="clothingItems" className="mt-4 flex flex-col flex-grow">
                <ConfigList title="Elementy odzieży" items={localConfig.clothingItems} configType='clothingItems' updateLocalItems={(items) => handleUpdate('clothingItems', items)} />
            </TabsContent>
        </Tabs>
        </div>
    );
}

const ConfigurationPage = React.memo(ConfigurationPageComponent);
export default ConfigurationPage;
