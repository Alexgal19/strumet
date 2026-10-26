'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import type { ConfigItem, ConfigType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useHasMounted, useIsMobile } from '@/hooks/use-mobile';
import { useAppContext } from '@/context/app-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditLogList } from '@/components/audit-log-list';
import { BackupCard } from '@/components/backup-card';
import { cn } from '@/lib/utils';
import { configLabels, CONFIG_CATEGORIES, type ConfigView } from '@/components/konfiguracja/config-meta';
import { JobTitleClothingSetsTab } from '@/components/konfiguracja/job-title-clothing-sets-tab';
import { UserManagementTab } from '@/components/konfiguracja/user-management-tab';
import { ListsTab } from '@/components/konfiguracja/lists-tab';
import { MobileCategoryHub } from '@/components/konfiguracja/mobile-category-hub';
import { SmtpSettingsCard } from '@/components/konfiguracja/smtp-settings-card';
import { RecipientEmailsCard } from '@/components/konfiguracja/recipient-emails-card';
import { AddItemDialog } from '@/components/konfiguracja/add-item-dialog';
import { EditItemDialog } from '@/components/konfiguracja/edit-item-dialog';
import { DeleteItemDialog } from '@/components/konfiguracja/delete-item-dialog';
import { useEmailSettings } from '@/components/konfiguracja/use-email-settings';

export default function ConfigurationPage() {
  const { config, isLoading, addConfigItems, updateConfigItem, removeConfigItem, isAdmin } = useAppContext();
  const hasMounted = useHasMounted();
  const isMobile = useIsMobile();
  const [hubOpen, setHubOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('lists');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [currentConfigType, setCurrentConfigType] = useState<ConfigType | null>(null);
  const [newItemsText, setNewItemsText] = useState('');

  const [editingItem, setEditingItem] = useState<{ id: string; name: string } | null>(null);
  const [editedItemName, setEditedItemName] = useState('');
  const [itemToDelete, setItemToDelete] = useState<{ configType: ConfigType; itemId: string } | null>(null);

  const emailSettings = useEmailSettings();
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
    // Potwierdzenie przeniesione do AlertDialog (window.confirm blokuje wątek UI i nie ma dark-mode)
    setItemToDelete({ configType, itemId });
  };

  const configLists: { type: ConfigType; items: ConfigItem[] }[] = [
    { type: 'departments', items: config.departments },
    { type: 'jobTitles', items: config.jobTitles },
    { type: 'managers', items: config.managers },
    { type: 'nationalities', items: config.nationalities },
    { type: 'clothingItems', items: config.clothingItems },
  ];

  const visibleCategories = useMemo(
    () => CONFIG_CATEGORIES.filter((category) => !category.adminOnly || isAdmin),
    [isAdmin]
  );
  const activeCategory = visibleCategories.find((category) => category.value === activeTab);

  const addDialogTitle = `Dodaj nowe ${currentConfigType ? configLabels[currentConfigType as Exclude<ConfigView, 'jobTitleClothingSets'>].toLowerCase() : ''}`;
  const editDialogTitle = `Edytuj ${currentConfigType ? configLabels[currentConfigType as Exclude<ConfigView, 'jobTitleClothingSets'>].toLowerCase().slice(0, -1) + 'ę' : ''}`;

  return (
    <div className="flex h-full flex-col">
      {isLoading || !hasMounted ? (
        <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        ) : (
        <>
            <PageHeader
                title="Konfiguracja"
                description="Zarządzaj opcjami dostępnymi w systemie."
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col">
                {!isMobile && (
                    <TabsList className={cn("grid w-full", isAdmin ? "grid-cols-2 sm:grid-cols-4 lg:grid-cols-7" : "grid-cols-2")}>
                        <TabsTrigger value="lists">Listy</TabsTrigger>
                        <TabsTrigger value="clothing_sets">Zestawy odzieży</TabsTrigger>
                        {isAdmin && <TabsTrigger value="api_keys">E-mail (SMTP)</TabsTrigger>}
                        {isAdmin && <TabsTrigger value="emails">Adresy email</TabsTrigger>}
                        {isAdmin && <TabsTrigger value="users">Użytkownicy</TabsTrigger>}
                        {isAdmin && <TabsTrigger value="audit">Historia</TabsTrigger>}
                        {isAdmin && <TabsTrigger value="backup">Dane</TabsTrigger>}
                    </TabsList>
                )}

                {isMobile && hubOpen && (
                    <MobileCategoryHub
                        categories={visibleCategories}
                        onSelect={(value) => {
                            setActiveTab(value);
                            setHubOpen(false);
                        }}
                    />
                )}

                {isMobile && !hubOpen && (
                    <div className="mt-1 flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-11 w-11 shrink-0"
                            onClick={() => setHubOpen(true)}
                            aria-label="Wróć do listy ustawień"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <span className="min-w-0 truncate font-semibold">
                            {activeCategory ? activeCategory.label : 'Konfiguracja'}
                        </span>
                    </div>
                )}

                {isAdmin && (
                    <TabsContent value="audit" className={cn('flex-grow mt-6', isMobile && hubOpen && 'hidden')}>
                        <AuditLogList />
                    </TabsContent>
                )}

                {isAdmin && (
                    <TabsContent value="backup" className={cn('flex-grow mt-6', isMobile && hubOpen && 'hidden')}>
                        <BackupCard />
                    </TabsContent>
                )}

                <TabsContent value="lists" className={cn('flex-grow mt-6', isMobile && hubOpen && 'hidden')}>
                    <ListsTab
                        configLists={configLists}
                        isAdmin={isAdmin}
                        onAdd={openAddDialog}
                        onEdit={openEditDialog}
                        onRemove={handleRemoveItem}
                    />
                </TabsContent>

                <TabsContent value="clothing_sets" className={cn('flex-grow mt-6', isMobile && hubOpen && 'hidden')}>
                    <JobTitleClothingSetsTab />
                </TabsContent>

                {isAdmin && (
                    <TabsContent value="api_keys" className={cn('flex-grow mt-6', isMobile && hubOpen && 'hidden')}>
                        <SmtpSettingsCard settings={emailSettings} />
                    </TabsContent>
                )}

                {isAdmin && (
                    <TabsContent value="emails" className={cn('flex-grow mt-6', isMobile && hubOpen && 'hidden')}>
                        <RecipientEmailsCard settings={emailSettings} />
                    </TabsContent>
                )}

                {isAdmin && (
                    <TabsContent value="users" className={cn('flex-grow mt-6', isMobile && hubOpen && 'hidden')}>
                        <UserManagementTab />
                    </TabsContent>
                )}

            </Tabs>
        </>
        )}

      <AddItemDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        title={addDialogTitle}
        value={newItemsText}
        onValueChange={setNewItemsText}
        onConfirm={handleAddMultipleItems}
      />

      <EditItemDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title={editDialogTitle}
        value={editedItemName}
        onValueChange={setEditedItemName}
        onConfirm={handleUpdateItem}
      />

      <DeleteItemDialog
        open={itemToDelete !== null}
        onOpenChange={(open) => { if (!open) setItemToDelete(null); }}
        onConfirm={() => {
          if (itemToDelete) removeConfigItem(itemToDelete.configType, itemToDelete.itemId);
          setItemToDelete(null);
        }}
      />

    </div>
  );
}
