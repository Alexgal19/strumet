import React from 'react';
import { ConfigProvider } from '@/context/config-context';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider>
      {children}
    </ConfigProvider>
  );
}
