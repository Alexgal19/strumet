'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, PlusCircle, Send, Trash2 } from 'lucide-react';
import type { EmailSettings } from './use-email-settings';

type RecipientEmailsCardProps = {
  settings: EmailSettings;
};

export function RecipientEmailsCard({ settings }: RecipientEmailsCardProps) {
  const {
    recipientEmails,
    newEmail, setNewEmail,
    isSendingTest,
    addEmail,
    removeEmail,
    handleSendTestEmail,
  } = settings;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-3">
              <Mail className="h-6 w-6" />
              Adresy email do powiadomień
            </CardTitle>
            <CardDescription className="mt-1.5">
              Dodaj adresy, na które będą wysyłane powiadomienia email.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendTestEmail}
            disabled={isSendingTest || recipientEmails.length === 0}
            className="shrink-0"
          >
            {isSendingTest ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Wyślij test
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="email@example.com"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addEmail();
              }
            }}
          />
          <Button onClick={addEmail} variant="secondary">
            <PlusCircle className="mr-2 h-4 w-4" />
            Dodaj
          </Button>
        </div>
        <div className="space-y-2">
          {recipientEmails.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Brak adresów email. Dodaj pierwszy.</p>
          ) : (
            recipientEmails.map(email => (
              <div key={email} className="flex items-center justify-between rounded-md border p-3">
                <span className="font-medium text-sm">{email}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive h-11 w-11"
                  onClick={() => removeEmail(email)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
