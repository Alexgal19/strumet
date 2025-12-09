
'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, Loader2, Edit, Save } from 'lucide-react';
import type { ConfigItem, ConfigType, ClothingSet } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useHasMounted } from '@/hooks/use-mobile';
import { useAppContext } from '@/context/app-context';
import { MultiSelect, OptionType } from '@/components/ui/multi-select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


type ConfigView = 'departments' | 'jobTitles' | 'managers' | 'nationalities' | 'clothingItems' | 'clothingSets';

const configLabels: Record<ConfigView, string> = {
  departments: 'Działy',
  jobTitles: 'Stanowiska',
  managers: 'Kierownicy',
  nationalities: 'Narodowości',
  clothingItems: 'Odzież',
  clothingSets: 'Zestawy odzieży'
};

const ClothingSetsTab = () => {
  const { config, addConfigItems, updateConfigItem, removeConfigItem, updateClothingSet } = useAppContext();
  const clothingSets = config.clothingSets;
  const { toast } = useToast();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<ClothingSet | null>(null);

  const [newItemName, setNewItemName] = useState('');
  const [editedName, setEditedName] = useState('');

  const [selectedClothing, setSelectedClothing] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const initialSelection: Record<string, string[]> = {};
    clothingSets.forEach(set => {
      initialSelection[set.id] = set.clothingItemIds || [];
    });
    setSelectedClothing(initialSelection);
  }, [clothingSets]);

  const clothingOptions = useMemo<OptionType[]>(() => 
    config.clothingItems.map(item => ({ value: item.id, label: item.name })),
    [config.clothingItems]
  );
  
  const handleOpenAddDialog = () => {
    setNewItemName('');
    setIsAddDialogOpen(true);
  };
  
  const handleOpenEditDialog = (set: ClothingSet) => {
    setEditingSet(set);
    setEditedName(set.name);
    setIsEditDialogOpen(true);
  };

  const handleAddSet = async () => {
    if (!newItemName.trim()) {
        toast({ variant: 'destructive', title: 'Błąd', description: 'Nazwa zestawu nie może być pusta.' });
        return;
    }
    await addConfigItems('clothingSets', [newItemName.trim()]);
    toast({ title: 'Sukces', description: 'Nowy zestaw odzieży został dodany.'});
    setIsAddDialogOpen(false);
  };

  const handleUpdateSetName = async () => {
    if (!editingSet || !editedName.trim()) return;
    await updateConfigItem('clothingSets', editingSet.id, editedName.trim());
    setIsEditDialogOpen(false);
  };
  
  const handleUpdateSetItems = async (setId: string) => {
    await updateClothingSet(setId, selectedClothing[setId] || []);
  };
  
  const handleRemoveSet = (setId: string) => {
      if (window.confirm('Czy na pewno chcesz usunąć ten zestaw odzieży?')) {
        removeConfigItem('clothingSets', setId);
      }
  }
  
  return (
     <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Zestawy odzieży</CardTitle>
          <CardDescription>Twórz i zarządzaj szablonami odzieży dla nowych pracowników.</CardDescription>
        </CardHeader>
        <CardContent>
           <Accordion type="multiple" className="w-full">
            {clothingSets.map((set) => (
              <AccordionItem value={set.id} key={set.id}>
                <AccordionTrigger>
                  <div className="flex justify-between items-center w-full pr-2">
                    <span className="font-medium text-base">{set.name}</span>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8" onClick={(e) => {e.stopPropagation(); handleOpenEditDialog(set);}}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8" onClick={(e) => {e.stopPropagation(); handleRemoveSet(set.id)}}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 p-2">
                    <MultiSelect
                      title="Wybierz odzież..."
                      options={clothingOptions}
                      selected={selectedClothing[set.id] || []}
                      onChange={(selectedIds) => {
                        setSelectedClothing(prev => ({ ...prev, [set.id]: selectedIds }));
                      }}
                    />
                    <Button onClick={() => handleUpdateSetItems(set.id)} size="sm">
                      <Save className="mr-2 h-4 w-4" />
                      Zapisz zestaw
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
           <Button className="mt-4" onClick={handleOpenAddDialog}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Dodaj nowy zestaw
          </Button>
        </CardContent>
      </Card>
      
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj nowy zestaw odzieży</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="new-set-name">Nazwa zestawu</Label>
            <Input id="new-set-name" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="Np. Zestaw dla spawacza" />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="secondary">Anuluj</Button></DialogClose>
            <Button onClick={handleAddSet}>Dodaj</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edytuj nazwę zestawu</DialogTitle>
          </DialogHeader>
          <div className="py-4">
             <Label htmlFor="edit-set-name">Nowa nazwa</Label>
             <Input id="edit-set-name" value={editedName} onChange={e => setEditedName(e.target.value)} />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="secondary">Anuluj</Button></DialogClose>
            <Button onClick={handleUpdateSetName}>Zapisz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ConfigurationPage() {
  const { config, employees, isLoading, addConfigItems, updateConfigItem, removeConfigItem } = useAppContext();
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

  const handleAddMultipleItems = async () => {
    if (!currentConfigType || !newItemsText.trim()) return;

    const itemsToAdd = newItemsText
      .split('\n')
      .map(name => name.trim())
      .filter(name => name !== '');
    
    if (itemsToAdd.length === 0) return;

    await addConfigItems(currentConfigType, itemsToAdd);

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
      
      await updateConfigItem(currentConfigType, editingItem.id, newName);
      
      setIsEditDialogOpen(false);
      setEditingItem(null);
      setCurrentConfigType(null);
      setEditedItemName('');
  };

  const handleRemoveItem = (configType: ConfigType, itemId: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten element?')) {
      removeConfigItem(configType, itemId);
    }
  };

  const renderConfigList = (configType: ConfigType, items: ConfigItem[]) => (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{configLabels[configType as ConfigView]}</CardTitle>
          <CardDescription>Zarządzaj listą dostępnych {configLabels[configType as ConfigView].toLowerCase()}.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-md border p-3 gap-2">
                <span className="flex-1 break-words font-medium text-sm">{item.name}</span>
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
            <TabsTrigger value="clothingSets">Zestawy odzieży</TabsTrigger>
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
        <TabsContent value="clothingSets" className="flex-grow">
          <ClothingSetsTab />
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
