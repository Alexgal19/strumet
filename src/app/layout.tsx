import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ConfigProvider } from '@/context/config-context';

export const metadata: Metadata = {
  title: 'Kadry Online',
  description: 'System do zarządzania pracownikami',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/font-geist/latest/geist.css" />
      </head>
      <body className="font-body antialiased">
        <ConfigProvider>
          {children}
        </ConfigProvider>
        <Toaster />
      </body>
    </html>
  );
}
