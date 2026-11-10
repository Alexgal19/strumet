'use client';

import type React from 'react';
import { ArrowRight, GitCompareArrows } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date';

import { t } from '@/lib/i18n';
const DiffBadge = ({ diff }: { diff: number }) => (
    <Badge variant={diff >= 0 ? 'default' : 'destructive'} className={cn(diff >= 0 && "bg-green-500 hover:bg-green-600")}>
        {diff > 0 ? `+${diff}` : diff}
    </Badge>
);

export const PeriodChangeCard = ({ title, data }: { title: string, data: { name: string, from: number, to: number, diff: number }[] }) => (
    <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
        <CardContent>
            <div className="space-y-3">
                {data.length > 0 ? data.map(item => (
                    <div key={item.name} className="flex justify-between items-center text-sm">
                        <span>{item.name || t('stats.none')}</span>
                        <div className="flex items-center gap-2 font-mono">
                            <span>{item.from}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span className="font-bold">{item.to}</span>
                            <DiffBadge diff={item.diff} />
                        </div>
                    </div>
                )) : <p className="text-sm text-muted-foreground text-center">{t('stats.noChanges')}</p>}
            </div>
        </CardContent>
    </Card>
);

export const SingleDayReportCard = ({ title, data }: { title: string, data: { name: string, to: number }[] }) => (
    <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
        <CardContent>
            <div className="space-y-3">
                {data.length > 0 ? data.map(item => (
                    <div key={item.name} className="flex justify-between items-center text-sm">
                        <span>{item.name || t('stats.none')}</span>
                        <span className="font-bold font-mono">{item.to}</span>
                    </div>
                )) : <p className="text-sm text-muted-foreground text-center">{t('stats.noData')}</p>}
            </div>
        </CardContent>
    </Card>
);

export const EmployeeChangeList = ({ title, employees, icon, emptyText }: { title: string, employees: any[], icon: React.ReactNode, emptyText: string }) => {
    const list = (
        <div className="space-y-4 pr-4">
            {employees.map((emp, index) => (
                <div key={index} className="flex items-center gap-4 p-2 rounded-lg bg-muted/50">
                    <div className="flex-grow">
                        <p className="font-semibold">{emp.fullName}</p>
                        <p className="text-xs text-muted-foreground">{emp.jobTitle}, {emp.department}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                        <p>{formatDate(emp.date, 'dd.MM.yyyy')}</p>
                    </div>
                </div>
            ))}
        </div>
    );
    return (
        <Card className="flex flex-col glass-card">
            <CardHeader>
                <div className="flex items-center gap-3">
                    {icon}
                    <div>
                        <CardTitle className="text-lg">{title}</CardTitle>
                        <CardDescription>{t('stats.countEmployees', { count: employees.length })}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                {employees.length > 0 ? (
                    <>
                        <div className="hidden sm:block"><ScrollArea className="h-80">{list}</ScrollArea></div>
                        <div className="sm:hidden">{list}</div>
                    </>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">{emptyText}</p>
                )}
            </CardContent>
        </Card>
    );
};

const changeUnitLabel = (type: string): string =>
    ({ department: t('stats.departments'), jobTitle: t('stats.jobTitles'), nationality: t('stats.nationalities') } as Record<string, string>)[type] ?? t('stats.categories');

export const FieldChangeList = ({ changes }: { changes: any[] }) => {
    const groupedChanges = changes.reduce((acc, change) => {
        if (!acc[change.type]) acc[change.type] = [];
        acc[change.type].push(change);
        return acc;
    }, {} as Record<string, any[]>);

    if (changes.length === 0) return null;

    return (
        <Card className="glass-card">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <GitCompareArrows className="h-6 w-6 text-blue-500" />
                    <div>
                        <CardTitle className="text-lg">{t('stats.changesInEmployeeData')}</CardTitle>
                        <CardDescription>{t('stats.countRecordedChanges', { count: changes.length })}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Accordion type="multiple" defaultValue={Object.keys(groupedChanges)}>
                    {Object.entries(groupedChanges).map(([type, items]) => {
                        const list = (
                            <div className="space-y-4 pr-4">
                                {(items as any[]).map((item, index) => (
                                    <div key={index} className="flex items-center gap-4 p-2 rounded-lg bg-muted/50">
                                        <div className="flex-grow">
                                            <p className="font-semibold">{item.fullName}</p>
                                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                <span>{item.from}</span>
                                                <ArrowRight className="h-3 w-3" />
                                                <span className="font-bold">{item.to}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                        return (
                            <AccordionItem value={type} key={type}>
                                <AccordionTrigger>{t('stats.changesUnitCount', { unit: changeUnitLabel(type), count: (items as any[]).length })}</AccordionTrigger>
                                <AccordionContent>
                                    <div className="hidden sm:block"><ScrollArea className="max-h-80">{list}</ScrollArea></div>
                                    <div className="sm:hidden">{list}</div>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </CardContent>
        </Card>
    )
}
