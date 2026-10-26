'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff, KeyRound, Save } from 'lucide-react';
import type { EmailSettings } from './use-email-settings';

type SmtpSettingsCardProps = {
  settings: EmailSettings;
};

export function SmtpSettingsCard({ settings }: SmtpSettingsCardProps) {
  const {
    smtpHost, setSmtpHost,
    smtpPort, setSmtpPort,
    smtpSecure, setSmtpSecure,
    smtpUser, setSmtpUser,
    smtpPass, setSmtpPass,
    fromName, setFromName,
    onSaveSmtpSettings,
    gmailUser, setGmailUser,
    gmailAppPassword, setGmailAppPassword,
    showPassword, setShowPassword,
    onSaveGmailCredentials,
  } = settings;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <KeyRound className="h-6 w-6" />
          E-mail — wysyłka (SMTP)
        </CardTitle>
        <CardDescription>
          Skonfiguruj firmową skrzynkę Outlook/M365 lub dowolny serwer SMTP. Gmail działa też — zostaw host pusty.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border p-4 space-y-4">
          <p className="text-sm font-semibold">Serwer SMTP (Outlook / firmowy)</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Label htmlFor="smtp-host">Serwer (host)</Label>
              <Input
                id="smtp-host"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="smtp.office365.com"
              />
            </div>
            <div>
              <Label htmlFor="smtp-port">Port</Label>
              <Input
                id="smtp-port"
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                placeholder="587"
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="smtp-secure" className="text-sm">SSL/TLS (port 465)</Label>
              <p className="text-xs text-muted-foreground">Wyłącz dla portu 587 (STARTTLS) — Outlook/M365</p>
            </div>
            <Switch
              id="smtp-secure"
              checked={smtpSecure}
              onCheckedChange={setSmtpSecure}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="smtp-user">E-mail (login i nadawca)</Label>
              <Input
                id="smtp-user"
                type="email"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                placeholder="o.holiadynets@swl.com.pl"
              />
            </div>
            <div>
              <Label htmlFor="smtp-pass">Hasło</Label>
              <Input
                id="smtp-pass"
                type="password"
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
                placeholder="hasło skrzynki"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="from-name">Nazwa nadawcy</Label>
            <Input
              id="from-name"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="Strumet HR"
            />
          </div>
          <Button onClick={onSaveSmtpSettings} disabled={!smtpHost || !smtpUser || !smtpPass}>
            <Save className="mr-2 h-4 w-4" />
            Zapisz ustawienia SMTP
          </Button>
        </div>

        <div className="relative py-2 text-center">
          <span className="relative z-10 bg-background px-3 text-xs uppercase tracking-wider text-muted-foreground">lub Gmail (bez hosta)</span>
          <div className="absolute inset-0 top-1/2 h-px bg-border" />
        </div>

        <div>
          <Label htmlFor="gmail-user">Adres Gmail</Label>
          <Input
            id="gmail-user"
            type="email"
            value={gmailUser}
            onChange={(e) => setGmailUser(e.target.value)}
            placeholder="twoj-email@gmail.com"
          />
        </div>
        <div>
          <Label htmlFor="gmail-app-password">Hasło Aplikacji</Label>
          <div className="relative">
            <Input
              id="gmail-app-password"
              type={showPassword ? "text" : "password"}
              value={gmailAppPassword}
              onChange={(e) => setGmailAppPassword(e.target.value)}
              placeholder="xxxx xxxx xxxx xxxx"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span className="sr-only">
                {showPassword ? "Ukryj hasło" : "Pokaż hasło"}
              </span>
            </Button>
          </div>
        </div>
        <Button onClick={onSaveGmailCredentials}>
          <Save className="mr-2 h-4 w-4" />
          Zapisz poświadczenia
        </Button>
      </CardContent>
    </Card>
  );
}
