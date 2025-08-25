import React from 'react';
import AppSidebar, { SidebarTrigger } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ConfigProvider } from '@/context/config-context';
import { PageHeader } from '@/components/page-header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ConfigProvider>
        <div className="flex h-full flex-col md:flex-row">
          <AppSidebar />
          <main className="flex flex-1 flex-col overflow-hidden bg-background">
             <div className="flex items-center justify-between border-b p-2 md:hidden">
                {/* Mobile Header */}
                <div className="flex items-center gap-2">
                   <SidebarTrigger />
                   <span className="font-semibold">Kadry Online</span>
                </div>
            </div>
            <div className="flex-grow overflow-auto p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </ConfigProvider>
    </SidebarProvider>
  );
}
