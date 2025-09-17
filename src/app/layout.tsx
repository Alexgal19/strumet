
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import ClientSideEffect from '@/components/client-side-effect';

// This metadata is now static and won't be used by the PWA manifest directly
// But it's good practice to keep it for SEO and browser tabs.
export const metadata: Metadata = {
  title: 'HOL manager',
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#209cee" />
      </head>
      <body className="font-body antialiased">
        <ClientSideEffect />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
