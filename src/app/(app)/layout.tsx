
'use client';

import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app-sidebar';
import AppBottomNav from '@/components/app-bottom-nav';
import { Loader2 } from 'lucide-react';
import { AppProvider, useAppContext } from '@/context/app-context';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'next/navigation';


const CenteredLoader = ({ isLoading }: { isLoading: boolean }) => (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-300',
        isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
);

const AppContent = ({ children }: { children: React.ReactNode }) => {
    const { isLoading, isAdmin } = useAppContext();
    const pathname = usePathname();
    
    return (
        <SidebarProvider>
            <div className="flex h-full flex-col md:flex-row bg-transparent">
                <AppSidebar pathname={pathname} />
                <SidebarInset className="m-0 flex flex-1 flex-col min-w-0 md:m-2 md:p-4 sm:p-6 lg:p-8 pb-28 md:pb-8 md:rounded-lg bg-card/80">
                   <CenteredLoader isLoading={isLoading} />
                    <div className={cn('h-full', isLoading && 'opacity-0')}>
                        {children}
                    </div>
                </SidebarInset>
                <AppBottomNav pathname={pathname} />
            </div>
        </SidebarProvider>
    );
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppContent>
        {children}
    </AppContent>
  );
}
