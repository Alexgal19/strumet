'use client';

import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppContext } from '@/context/app-context';
import { useEmployees } from '@/hooks/use-employees';
import { HiresAndFiresTab } from '@/components/statystyki/hires-and-fires-tab';
import { OrdersTab } from '@/components/statystyki/orders-tab';
import { ReportTab } from '@/components/statystyki/report-tab';

export default function StatisticsPage() {
    const { isLoading: isContextLoading } = useAppContext();
    const { employees: activeEmployees, isLoading: isEmployeesLoading } = useEmployees('aktywny');
    const isLoading = isContextLoading || isEmployeesLoading;

    return (
        <div className="min-h-full flex flex-col w-full">
            <PageHeader
                title="Statystyki i Planowanie"
                description="Kluczowe wskaźniki i zapotrzebowanie na personel."
            />
            {isLoading && activeEmployees.length === 0 ? (
                <div className="flex h-full w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <Tabs defaultValue="report" className="flex-grow flex flex-col">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="report" className="text-xs sm:text-sm">Raport</TabsTrigger>
                        <TabsTrigger value="hires_fires" className="text-xs sm:text-sm">Analiza</TabsTrigger>
                        <TabsTrigger value="orders" className="text-xs sm:text-sm">Zamówienia</TabsTrigger>
                    </TabsList>
                    <TabsContent value="report" className="flex-grow mt-6">
                        <ReportTab />
                    </TabsContent>
                    <TabsContent value="hires_fires" className="flex-grow mt-6">
                        <HiresAndFiresTab />
                    </TabsContent>
                    <TabsContent value="orders" className="flex-grow mt-6">
                        <OrdersTab />
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
