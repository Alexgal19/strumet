"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Component, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Mock validation
    if (email === 'admin@example.com' && password === 'password') {
      toast({ title: 'Sukces', description: 'Zalogowano pomyślnie.' });
      router.push("/");
    } else {
      setError("Nieprawidłowy email lub hasło.");
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: 'Nie można zainstalować aplikacji w tym momencie.',
      });
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast({ title: 'Sukces', description: 'Aplikacja została zainstalowana.' });
    } else {
      toast({ title: 'Anulowano', description: 'Instalacja aplikacji została anulowana.' });
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm bg-background/80">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Component className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold">HOL manager</CardTitle>
          <CardDescription>Zaloguj się, aby zarządzać personelem</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Hasło</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            <div className="space-y-2 pt-2">
                <Button type="submit" className="w-full">
                  Zaloguj się
                </Button>
            </div>
          </form>
           <div className="mt-4 text-center text-sm">
            Nie masz konta?{" "}
            <Link href="/register" className="underline font-bold">
              Zarejestruj się
            </Link>
          </div>
          <div className="mt-4">
            <Button variant="outline" className="w-full" onClick={handleInstallClick}>
              <Download className="mr-2 h-4 w-4" />
              Zainstaluj aplikację
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
