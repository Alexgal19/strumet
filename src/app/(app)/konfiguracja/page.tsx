

'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, Loader2, Edit, Save, KeyRound, Users, ShieldCheck } from 'lucide-react';
import type { ConfigItem, ConfigType, JobTitle, JobTitleClothingSet, User, UserRole } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useHasMounted } from '@/hooks/use-mobile';
import { useAppContext } from '@/context/app-context';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';


const objectToArray = (obj: Record<string, any> | undefined | null): any[] => {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
};


type ConfigView = 'departments' | 'jobTitles' | 'managers' | 'nationalities' | 'clothingItems' | 'jobTitleClothingSets';

const configLabels: Record<ConfigView, string> = {
  departments: 'Działy',
  jobTitles: 'Stanowiska',
  managers: 'Kierownicy',
  nationalities: 'Narodowości',
  clothingItems: 'Odzież',
  jobTitleClothingSets: 'Zestawy odzieży'
};

const JobTitleClothingSetsTab = () => {
    const { config, handleSaveJobTitleClothingSet } = useAppContext();
    const { jobTitles } = config;
    const [jobTitleClothingSets, setJobTitleClothingSets] = useState<JobTitleClothingSet[]>([]);
    const [isLoadingSets, setIsLoadingSets] = useState(true);

    const [descriptions, setDescriptions] = useState<Record<string, string>>({});

    useEffect(() => {
      const setsRef = ref(db, 'config/jobTitleClothingSets');
      const unsubscribe = onValue(setsRef, (snapshot) => {
        setJobTitleClothingSets(objectToArray(snapshot.val()));
        setIsLoadingSets(false);
      });
      return () => unsubscribe();
    }, []);

    useEffect(() => {
        const initialDescriptions: Record<string, string> = {};
        jobTitles.forEach(jt => {
            const set = jobTitleClothingSets.find(s => s.id === jt.id);
            initialDescriptions[jt.id] = set ? set.description : '';
        });
        setDescriptions(initialDescriptions);
    }, [jobTitles, jobTitleClothingSets]);

    const handleSave = async (jobTitleId: string) => {
        await handleSaveJobTitleClothingSet(jobTitleId, descriptions[jobTitleId] || '');
    };

    if (isLoadingSets) {
        return (
            <Card className="h-full flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </Card>
        );
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Zestawy odzieży dla stanowisk</CardTitle>
                <CardDescription>Przypisz domyślne zestawy odzieży do poszczególnych stanowisk.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto">
                <Accordion type="multiple" className="w-full">
                    {jobTitles.map((jobTitle) => (
                        <AccordionItem value={jobTitle.id} key={jobTitle.id}>
                            <AccordionTrigger>{jobTitle.name}</AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-4 p-2">
                                     <Textarea
                                        placeholder="Wpisz pełny komplet odzieży, np. Spodnie, koszula, buty (rozmiar 42)..."
                                        value={descriptions[jobTitle.id] || ''}
                                        onChange={(e) => {
                                            setDescriptions(prev => ({ ...prev, [jobTitle.id]: e.target.value }));
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="min-h-[100px]"
                                    />
                                    <Button onClick={(e) => { e.stopPropagation(); handleSave(jobTitle.id); }}>
                                        <Save className="mr-2 h-4 w-4" />
                                        Zapisz zestaw
                                    </Button>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    );
};

const UserManagementTab = () => {
    const { users, currentUser, handleUpdateUserRole } = useAppContext();
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

    const handleRoleChange = (user: User, newRole: UserRole) => {
        if (user.id === currentUser?.uid) {
            alert("Nie można zmienić własnej roli.");
            return;
        }
        setUpdatingUserId(user.id);
        handleUpdateUserRole(user.id, newRole).finally(() => {
            setUpdatingUserId(null);
        });
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Zarządzanie Użytkownikami</CardTitle>
                <CardDescription>
                    Przeglądaj użytkowników i zarządzaj ich uprawnieniami.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead className="w-[150px] text-center">Rola</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.email}</TableCell>
                                    <TableCell className="text-center">
                                       <div className="flex items-center justify-center space-x-2">
                                           <Label htmlFor={`role-switch-${user.id}`} className={cn("text-muted-foreground", user.role === 'guest' && "text-foreground font-semibold")}>
                                             Gość
                                           </Label>
                                            <Switch
                                                id={`role-switch-${user.id}`}
                                                checked={user.role === 'admin'}
                                                onCheckedChange={(checked) => handleRoleChange(user, checked ? 'admin' : 'guest')}
                                                disabled={user.id === currentUser?.uid || updatingUserId === user.id}
                                                aria-label="Przełącz rolę"
                                            />
                                            <Label htmlFor={`role-switch-${user.id}`} className={cn("text-muted-foreground", user.role === 'admin' && "text-foreground font-semibold")}>
                                              Admin
                                            </Label>
                                       </div>
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
  const { config, isLoading, addConfigItems, updateConfigItem, removeConfigItem, handleSaveResendApiKey, isAdmin } = useAppContext();
  const hasMounted = useHasMounted();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [currentConfigType, setCurrentConfigType] = useState<ConfigType | null>(null);
  const [newItemsText, setNewItemsText] = useState('');
  
  const [editingItem, setEditingItem] = useState<{ id: string; name: string } | null>(null);
  const [editedItemName, setEditedItemName] = useState('');
  
  const [resendApiKey, setResendApiKey] = useState('');

  const { toast } = useToast();
  
  useEffect(() => {
    setResendApiKey(config.resendApiKey || '');
  }, [config.resendApiKey]);


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

  const onSaveApiKey = async () => {
    await handleSaveResendApiKey(resendApiKey);
  };

  const configLists: { type: ConfigType; items: ConfigItem[] }[] = [
    { type: 'departments', items: config.departments },
    { type: 'jobTitles', items: config.jobTitles },
    { type: 'managers', items: config.managers },
    { type: 'nationalities', items: config.nationalities },
    { type: 'clothingItems', items: config.clothingItems },
  ];

  if (isLoading || !hasMounted) return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="flex h-full flex-col">
      <PageHeader 
        title="Konfiguracja"
        description="Zarządzaj opcjami dostępnymi w systemie."
      />
      
      <Tabs defaultValue="lists" className="flex-grow flex flex-col">
         <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="lists">Listy</TabsTrigger>
            <TabsTrigger value="clothing_sets">Zestawy odzieży</TabsTrigger>
            <TabsTrigger value="api_keys">Klucze API</TabsTrigger>
            {isAdmin && <TabsTrigger value="users">Użytkownicy</TabsTrigger>}
        </TabsList>

        <TabsContent value="lists" className="flex-grow mt-6">
            <Card className="flex-grow flex flex-col">
               <CardHeader>
                    <CardTitle>Listy Konfiguracyjne</CardTitle>
                    <CardDescription>Zarządzaj listami działów, stanowisk, etc.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow overflow-y-auto">
                     <Accordion type="multiple" className="w-full">
                        {configLists.map(({ type, items }) => (
                            <AccordionItem value={type} key={type}>
                                <AccordionTrigger>{configLabels[type as Exclude<ConfigView, 'jobTitleClothingSets'>]}</AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-3 p-2">
                                      <div className="space-y-2">
                                        {items.map((item) => (
                                          <div key={item.id} className="flex items-center justify-between rounded-md border p-3 gap-2">
                                            <span className="flex-1 break-words font-medium text-sm">{item.name}</span>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8" onClick={() => openEditDialog(type, item)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8" onClick={() => handleRemoveItem(type, item.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                          </div>
                                        ))}
                                        {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Brak zdefiniowanych elementów.</p>}
                                      </div>
                                      <Button className="mt-2 w-full" variant="secondary" onClick={() => openAddDialog(type)}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Dodaj nowe
                                      </Button>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                     </Accordion>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="clothing_sets" className="flex-grow mt-6">
            <JobTitleClothingSetsTab />
        </TabsContent>

        <TabsContent value="api_keys" className="flex-grow mt-6">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <KeyRound className="h-6 w-6" />
                        Klucz API Resend
                    </CardTitle>
                    <CardDescription>
                        Wprowadź klucz API do wysyłania powiadomień email.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="resend-api-key">Klucz API</Label>
                        <Input 
                            id="resend-api-key"
                            type="password"
                            value={resendApiKey}
                            onChange={(e) => setResendApiKey(e.target.value)}
                            placeholder="re_xxxxxxxx_xxxxxxxxxxxx"
                        />
                    </div>
                    <Button onClick={onSaveApiKey}>
                        <Save className="mr-2 h-4 w-4" />
                        Zapisz klucz
                    </Button>
                </CardContent>
            </Card>
        </TabsContent>

        {isAdmin && (
            <TabsContent value="users" className="flex-grow mt-6">
                <UserManagementTab />
            </TabsContent>
        )}

      </Tabs>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj nowe {currentConfigType ? configLabels[currentConfigType as Exclude<ConfigView, 'jobTitleClothingSets'>].toLowerCase() : ''}</DialogTitle>
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
            <DialogTitle>Edytuj {currentConfigType ? configLabels[currentConfigType as Exclude<ConfigView, 'jobTitleClothingSets'>].toLowerCase().slice(0, -1) + 'ę' : ''}</DialogTitle>
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
