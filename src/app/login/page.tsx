"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database, Download, Loader2, Share, PlusSquare, User } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getFirebaseServices } from "@/lib/firebase";
import { signInWithEmailAndPassword, type Auth } from "firebase/auth";
import { useI18n } from "@/lib/i18n";
import { LanguageToggle } from "@/components/language-toggle";


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
  const { t } = useI18n();
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
          title: t('auth.criticalError'),
          description: e.message || t('auth.firebaseFailed'),
        })
      } finally {
        setIsLoading(false);
      }
    }
    initFirebase();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check for iOS
    const iosCheck = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iosCheck);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setError(t('auth.authNotReady'));
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: t('common.success'), description: t('auth.loggedIn') });
      router.push("/");
    } catch (error: any) {
      let errorMessage = t('auth.loginError');
      // Simplified error handling
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = t('auth.wrongCredentials');
            break;
          case 'auth/invalid-email':
            errorMessage = t('auth.invalidEmail');
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
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('auth.installUnavailable'),
      });
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast({ title: t('common.success'), description: t('auth.installed') });
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="relative flex min-h-dvh w-full items-start justify-center bg-background p-4 pt-[12vh] sm:items-center sm:pt-4">
      {/* Animated Background Blobs — odseparowane, aby nie powodowały scrolla */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      <div className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] z-20">
        <LanguageToggle />
      </div>

      <div className="z-10 w-full max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-500">
        <Card className="w-full border-0 bg-card/50 backdrop-blur-xl shadow-2xl ring-1 ring-border">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-600 shadow-lg shadow-primary/30 animate-in zoom-in-75 fade-in duration-300 delay-200">
              <Database className="h-10 w-10 text-white" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">Baza-ST</CardTitle>
              <CardDescription className="text-muted-foreground text-base">{t('auth.subtitle')}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium ml-1">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium ml-1">{t('auth.password')}</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-11"
                />
              </div>
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm font-medium text-destructive animate-in fade-in duration-200">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg shadow-primary/25 transition-all text-base font-medium"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="animate-spin" /> : t('auth.login')}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-muted-foreground">{t('auth.or')}</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11"
              onClick={() => router.push('/harmonogram')}
            >
              <User className="mr-2 h-4 w-4" />
              {t('auth.guest')}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">{t('auth.noAccount')} </span>
              <Link href="/register" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                {t('auth.register')}
              </Link>
            </div>

            {(deferredPrompt || isIOS) && (
              <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Button variant="outline" className="w-full h-11" onClick={handleInstallClick}>
                  <Download className="mr-2 h-4 w-4" />
                  {t('auth.install')}
                </Button>
              </div>
            )}

            <Dialog open={isIOSOpen} onOpenChange={setIsIOSOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t('auth.iosTitle')}</DialogTitle>
                  <DialogDescription>
                    {t('auth.iosIntro')}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col space-y-4 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Share className="h-5 w-5" />
                    </div>
                    <div className="text-sm">
                      {t('auth.ios1a')} <span className="font-semibold">{t('auth.ios1b')}</span> {t('auth.ios1c')}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <PlusSquare className="h-5 w-5" />
                    </div>
                    <div className="text-sm">
                      {t('auth.ios2a')} <span className="font-semibold">{t('auth.ios2b')}</span>{t('auth.ios2c')}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <span className="font-bold">3</span>
                    </div>
                    <div className="text-sm">
                      {t('auth.ios3a')} <span className="font-semibold">{t('auth.ios3b')}</span> {t('auth.ios3c')}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
