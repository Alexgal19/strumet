'use client';

import React, { useState } from 'react';
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
import { PlusCircle, Trash2 } from 'lucide-react';
import type { ConfigItem } from '@/lib/types';
import { useConfig, type ConfigType } from '@/context/config-context';

interface ConfigManagerProps {
  title: string;
  items: ConfigItem[];
  onItemsChange: (newItems: ConfigItem[]) => void;
  configType: ConfigType;
}

const ConfigList: React.FC<ConfigManagerProps> = ({ title, items, onItemsChange, configType }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  const handleAddItem = () => {
    if (newItemName.trim()) {
      const newItem: ConfigItem = {
        // Temporary ID, Firebase will generate the real one
        id: `${configType.slice(0, 2)}-${Date.now()}`, 
        name: newItemName.trim(),
      };
      onItemsChange([...items, newItem]);
      setNewItemName('');
      setIsDialogOpen(false);
    }
  };

  const handleDeleteItem = (id: string) => {
    onItemsChange(items.filter(item => item.id !== id));
  };
  
  return (
    <Card>
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
      <CardContent>
        <div className="rounded-md border">
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


export default function ConfigurationPage() {
    const { departments, jobTitles, managers, nationalities, clothingItems, updateConfig, isLoading } = useConfig();

  const handleItemsChange = (configType: ConfigType) => (newItems: ConfigItem[]) => {
    updateConfig(configType, newItems);
  };

  if (isLoading) {
    return <div>Ładowanie konfiguracji...</div>;
  }

  return (
    <div>
      <PageHeader
        title="Konfiguracja"
        description="Zarządzaj listami używanymi w całej aplikacji."
      />
      <Tabs defaultValue="departments">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
          <TabsTrigger value="departments">Działy</TabsTrigger>
          <TabsTrigger value="jobTitles">Stanowiska</TabsTrigger>
          <TabsTrigger value="managers">Kierownicy</TabsTrigger>
          <TabsTrigger value="nationalities">Narodowości</TabsTrigger>
          <TabsTrigger value="clothingItems">Odzież</TabsTrigger>
        </TabsList>
        <TabsContent value="departments" className="mt-4">
            <ConfigList title="Działy" items={departments} onItemsChange={handleItemsChange('departments')} configType='departments' />
        </TabsContent>
        <TabsContent value="jobTitles" className="mt-4">
            <ConfigList title="Miejsca pracy" items={jobTitles} onItemsChange={handleItemsChange('jobTitles')} configType='jobTitles' />
        </TabsContent>
        <TabsContent value="managers" className="mt-4">
            <ConfigList title="Kierownicy" items={managers} onItemsChange={handleItemsChange('managers')} configType='managers' />
        </TabsContent>
        <TabsContent value="nationalities" className="mt-4">
            <ConfigList title="Narodowości" items={nationalities} onItemsChange={handleItemsChange('nationalities')} configType='nationalities' />
        </TabsContent>
        <TabsContent value="clothingItems" className="mt-4">
            <ConfigList title="Elementy odzieży" items={clothingItems} onItemsChange={handleItemsChange('clothingItems')} configType='clothingItems' />
        </TabsContent>
      </Tabs>
    </div>
  );
}
