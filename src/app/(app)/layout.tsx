import React from 'react';
import AppSidebar from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppBottomNav from '@/components/app-bottom-nav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-full flex-col md:flex-row">
        <AppSidebar />
        <main className="flex flex-1 flex-col overflow-hidden bg-background">
          <div className="flex-grow overflow-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
            {children}
          </div>
        </main>
        <AppBottomNav />
      </div>
    </SidebarProvider>
  );
}
