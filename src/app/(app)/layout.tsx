import React from 'react';
import { ConfigProvider } from '@/context/config-context';
import MainLayout from '@/components/main-layout';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider>
      <MainLayout />
    </ConfigProvider>
  );
}
