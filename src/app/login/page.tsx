
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

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
  const [isLoading, setIsLoading] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('SW registered: ', registration);
        }).catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
        });
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      console.log('beforeinstallprompt event fired and stored');
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Sukces', description: 'Zalogowano pomyślnie.' });
      router.push("/");
    } catch (error: any) {
      let errorMessage = "Wystąpił błąd podczas logowania.";
       switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'Nieprawidłowy email lub hasło.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Nieprawidłowy format adresu email.';
          break;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
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
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm bg-background/80">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Database className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold">Baza - ST</CardTitle>
          <CardDescription>Zaloguj się, aby zarządzać personelem</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="email@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Hasło</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            <div className="space-y-2 pt-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : "Zaloguj się"}
                </Button>
            </div>
          </form>
           <div className="mt-4 text-center text-sm">
            Nie masz konta?{" "}
            <Link href="/register" className="underline font-bold">
              Zarejestruj się
            </Link>
          </div>
          {deferredPrompt && (
            <div className="mt-4">
              <Button variant="outline" className="w-full" onClick={handleInstallClick}>
                <Download className="mr-2 h-4 w-4" />
                Zainstaluj aplikację
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
