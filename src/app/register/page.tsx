
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Hasła nie pasują do siebie.");
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast({
        title: "Rejestracja pomyślna",
        description: "Teraz możesz się zalogować.",
      });
      router.push("/login");
    } catch (error: any) {
      let errorMessage = "Wystąpił błąd podczas rejestracji.";
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Ten adres email jest już zajęty.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Nieprawidłowy format adresu email.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Hasło jest zbyt słabe. Powinno mieć co najmniej 6 znaków.';
          break;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm bg-background/80">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Database className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold">Utwórz konto</CardTitle>
          <CardDescription>Wprowadź swoje dane, aby się zarejestrować.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="password">Hasło</Label>
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
              <Label htmlFor="confirm-password">Potwierdź hasło</Label>
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
                {isLoading ? <Loader2 className="animate-spin" /> : "Zarejestruj się"}
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Masz już konto?{" "}
            <Link href="/login" className="underline font-bold">
              Zaloguj się
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
