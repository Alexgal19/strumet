'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Edit, PlusCircle, Trash2 } from 'lucide-react';
import type { ConfigItem, ConfigType } from '@/lib/types';
import { configLabels, type ConfigView } from './config-meta';

type ListsTabProps = {
  configLists: { type: ConfigType; items: ConfigItem[] }[];
  isAdmin: boolean;
  onAdd: (type: ConfigType) => void;
  onEdit: (type: ConfigType, item: ConfigItem) => void;
  onRemove: (type: ConfigType, itemId: string) => void;
};

export function ListsTab({ configLists, isAdmin, onAdd, onEdit, onRemove }: ListsTabProps) {
  return (
    <Card className="flex-grow flex flex-col">
      <CardHeader>
        <CardTitle>Listy Konfiguracyjne</CardTitle>
        <CardDescription>Zarządzaj listami działów, stanowisk, etc.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
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
                        {isAdmin && (
                          <div className="flex items-center gap-2 shrink-0">
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-11 w-11" onClick={() => onEdit(type, item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-11 w-11" onClick={() => onRemove(type, item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                    {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Brak zdefiniowanych elementów.</p>}
                  </div>
                  {isAdmin && (
                    <Button className="mt-2 w-full" variant="secondary" onClick={() => onAdd(type)}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Dodaj nowe
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
