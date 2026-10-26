'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Save } from 'lucide-react';
import type { JobTitleClothingSet } from '@/lib/types';
import { getDB } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { useAppContext } from '@/context/app-context';
import { objectToArray } from '@/lib/utils';

export const JobTitleClothingSetsTab = () => {
    const { config, handleSaveJobTitleClothingSet, isAdmin } = useAppContext();
    const { jobTitles } = config;
    const [jobTitleClothingSets, setJobTitleClothingSets] = useState<JobTitleClothingSet[]>([]);
    const [isLoadingSets, setIsLoadingSets] = useState(true);

    const [descriptions, setDescriptions] = useState<Record<string, string>>({});

    useEffect(() => {
      const db = getDB();
      if (!db) return;

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
                                        disabled={!isAdmin}
                                    />
                                    {isAdmin && (
                                        <Button onClick={(e) => { e.stopPropagation(); handleSave(jobTitle.id); }}>
                                            <Save className="mr-2 h-4 w-4" />
                                            Zapisz zestaw
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
};
