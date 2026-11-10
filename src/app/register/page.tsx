"use client";

import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getFirebaseServices } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, get, set } from "firebase/database";
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

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t('auth.passwordsMismatch'));
      return;
    }
    setError('');
    setIsLoading(true);

    const services = getFirebaseServices();
    if (!services) {
        setError("Firebase services are not initialized.");
        setIsLoading(false);
        return;
    }
    const { auth, db } = services;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);
      const isFirstUser = !snapshot.exists() || snapshot.val() === null;
      const role = isFirstUser ? 'admin' : 'guest';
      
      await set(ref(db, `users/${user.uid}`), {
          email: user.email,
          role: role,
      });

      toast({
        title: t('auth.registered'),
        description: t('auth.registeredDesc', { role }),
      });
      router.push("/login");
    } catch (error: any) {
      let errorMessage = t('auth.registerError');
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = t('auth.emailInUse');
          break;
        case 'auth/invalid-email':
          errorMessage = t('auth.invalidEmail');
          break;
        case 'auth/weak-password':
          errorMessage = t('auth.weakPassword');
          break;
        default:
           errorMessage = error.message || errorMessage;
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
        title: t('common.error'),
        description: t('auth.installUnavailableShort'),
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
    <div className="relative flex h-full w-full items-center justify-center bg-background p-4">
      <div className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))]">
        <LanguageToggle />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Database className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold">{t('auth.createAccount')}</CardTitle>
          <CardDescription>{t('auth.registerSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t('auth.confirmPassword')}</Label>
              <Input 
                id="confirm-password" 
                type="password"                  
                required 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            <div className="space-y-2 pt-2">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : t('auth.register')}
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            {t('auth.haveAccount')}{" "}
            <Link href="/login" className="underline font-bold">
              {t('auth.login')}
            </Link>
          </div>
           {deferredPrompt && (
            <div className="mt-6 border-t pt-4">
              <Button variant="outline" className="w-full" onClick={handleInstallClick}>
                <Download className="mr-2 h-4 w-4" />
                {t('auth.install')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
