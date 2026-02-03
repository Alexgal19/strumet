"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database, Download, Loader2, Share, PlusSquare } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getFirebaseServices } from "@/lib/firebase";
import { signInWithEmailAndPassword, type Auth } from "firebase/auth";
import { motion } from "framer-motion";


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
  const [isLoading, setIsLoading] = useState(true);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isIOSOpen, setIsIOSOpen] = useState(false);

  useEffect(() => {
    async function initFirebase() {
      try {
        const firebaseServices = getFirebaseServices();
        if (!firebaseServices) {
          throw new Error("Firebase services are not initialized.");
        }
        const { auth: firebaseAuth } = firebaseServices;
        setAuth(firebaseAuth);
      } catch (e: any) {
        setError(e.message || "Failed to initialize Firebase services.");
        toast({
          variant: "destructive",
          title: "Błąd krytyczny",
          description: e.message || "Nie udało się połączyć z usługami Firebase.",
        })
      } finally {
        setIsLoading(false);
      }
    }
    initFirebase();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      console.log('✅ beforeinstallprompt event fired and stored', e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check for iOS
    const iosCheck = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iosCheck);
    console.log('iOS detected:', iosCheck);
    console.log('beforeinstallprompt listener attached');

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setError("Usługi uwierzytelniania nie są gotowe. Spróbuj ponownie za chwilę.");
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Sukces', description: 'Zalogowano pomyślnie.' });
      router.push("/");
    } catch (error: any) {
      let errorMessage = "Wystąpił błąd podczas logowania.";
      // Simplified error handling
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'Nieprawidłowy email lub hasło.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Nieprawidłowy format adresu email.';
            break;
          default:
            errorMessage = error.message || errorMessage;
            break;
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setIsIOSOpen(true);
      return;
    }

    if (!deferredPrompt) {
      // In development, show helpful message
      if (process.env.NODE_ENV === 'development') {
        toast({
          title: 'Tryb dev',
          description: 'Na localhost zainstaluj aplikację ręcznie z menu przeglądarki (⋯ → Zainstaluj aplikację).',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Błąd',
          description: 'Nie można zainstalować aplikacji w tym momencie. Spróbuj otworzyć stronę w Chrome lub Edge.',
        });
      }
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
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background p-4 overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-sm"
      >
        <Card className="w-full border-0 bg-card/50 backdrop-blur-xl shadow-2xl ring-1 ring-white/10">
          <CardHeader className="text-center space-y-4 pb-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-600 shadow-lg shadow-primary/30"
            >
              <Database className="h-10 w-10 text-white" />
            </motion.div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">Baza - ST</CardTitle>
              <CardDescription className="text-muted-foreground/80 text-base">Zaloguj się, aby zarządzać personelem</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium ml-1">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="bg-background/50 border-white/10 focus:ring-primary h-11 transition-all hover:bg-background/80"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium ml-1">Hasło</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-background/50 border-white/10 focus:ring-primary h-11 transition-all hover:bg-background/80"
                />
              </div>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm font-medium text-destructive"
                >
                  {error}
                </motion.div>
              )}
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg shadow-primary/25 transition-all text-base font-medium"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="animate-spin" /> : "Zaloguj się"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-muted-foreground">Lub</span>
              </div>
            </div>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Nie masz konta? </span>
              <Link href="/register" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                Zarejestruj się
              </Link>
            </div>

            {(deferredPrompt || isIOS || process.env.NODE_ENV === 'development') && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-2"
              >
                <Button variant="outline" className="w-full h-11 border-white/10 hover:bg-white/5" onClick={handleInstallClick}>
                  <Download className="mr-2 h-4 w-4" />
                  Zainstaluj aplikację
                </Button>
              </motion.div>
            )}

            <Dialog open={isIOSOpen} onOpenChange={setIsIOSOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Instalacja na iOS</DialogTitle>
                  <DialogDescription>
                    Aby zainstalować aplikację na swoim urządzeniu iOS, wykonaj następujące kroki:
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col space-y-4 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Share className="h-5 w-5" />
                    </div>
                    <div className="text-sm">
                      1. Kliknij przycisk <span className="font-semibold">Udostępnij</span> w pasku nawigacji Safari.
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <PlusSquare className="h-5 w-5" />
                    </div>
                    <div className="text-sm">
                      2. Wybierz opcję <span className="font-semibold">Do ekranu początkowego</span>.
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <span className="font-bold">3</span>
                    </div>
                    <div className="text-sm">
                      3. Kliknij <span className="font-semibold">Dodaj</span> w prawym górnym rogu.
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
