'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-context';
import { sendEmail } from '@/ai/tools';

export function useEmailSettings() {
  const { config, handleSaveGmailCredentials, handleSaveSmtpSettings, updateRecipientEmails } = useAppContext();
  const { toast } = useToast();

  const [gmailUser, setGmailUser] = useState('');
  const [gmailAppPassword, setGmailAppPassword] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [fromName, setFromName] = useState('Strumet HR');
  const [recipientEmails, setRecipientEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setGmailUser(config.gmailUser || '');
    setGmailAppPassword(config.gmailAppPassword || '');
    setRecipientEmails(config.recipientEmails || []);
    setSmtpHost(config.smtpHost || '');
    setSmtpPort(config.smtpPort ? String(config.smtpPort) : '587');
    setSmtpSecure(config.smtpSecure ?? false);
    setSmtpUser(config.smtpUser || '');
    setSmtpPass(config.smtpPass || '');
    setFromName(config.fromName || 'Strumet HR');
  }, [config.gmailUser, config.gmailAppPassword, config.recipientEmails, config.smtpHost, config.smtpPort, config.smtpSecure, config.smtpUser, config.smtpPass, config.fromName]);

  const onSaveGmailCredentials = async () => {
    await handleSaveGmailCredentials(gmailUser, gmailAppPassword);
  };

  const onSaveSmtpSettings = async () => {
    await handleSaveSmtpSettings({
      host: smtpHost.trim(),
      port: Number(smtpPort) || 587,
      secure: smtpSecure,
      user: smtpUser.trim(),
      pass: smtpPass,
      fromName: fromName.trim() || 'Strumet HR',
    });
  };

  const addEmail = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    if (!email.includes('@')) {
      toast({ variant: 'destructive', title: 'Błąd', description: 'Podaj prawidłowy adres email.' });
      return;
    }
    if (recipientEmails.includes(email)) {
      toast({ variant: 'destructive', title: 'Błąd', description: 'Ten adres już istnieje.' });
      return;
    }
    const newList = [...recipientEmails, email];
    await updateRecipientEmails(newList);
    setRecipientEmails(newList);
    setNewEmail('');
  };

  const removeEmail = async (emailToRemove: string) => {
    const newList = recipientEmails.filter(e => e !== emailToRemove);
    await updateRecipientEmails(newList);
    setRecipientEmails(newList);
  };

  const handleSendTestEmail = async () => {
    if (recipientEmails.length === 0) {
      toast({ variant: 'destructive', title: 'Błąd', description: 'Brak adresów email do wysłania.' });
      return;
    }
    setIsSendingTest(true);
    try {
      const result = await sendEmail({
        subject: 'Test powiadomienia – Strumet HR',
        body: '<p>To jest testowa wiadomość z systemu <strong>Strumet HR</strong>.</p><p>Powiadomienia email działają poprawnie.</p>',
        gmailUser: gmailUser,
        gmailAppPassword: gmailAppPassword,
        recipientEmails: recipientEmails,
      });
      if (result.success) {
        toast({ title: 'Sukces', description: result.message });
      } else {
        toast({ variant: 'destructive', title: 'Błąd wysyłki', description: result.message });
      }
    } catch (error: any) {
      console.error("Test email error:", error);
      toast({ variant: 'destructive', title: 'Błąd', description: error?.message || 'Wystąpił nieoczekiwany błąd serwera.' });
    } finally {
      setIsSendingTest(false);
    }
  };

  return {
    gmailUser, setGmailUser,
    gmailAppPassword, setGmailAppPassword,
    showPassword, setShowPassword,
    onSaveGmailCredentials,
    smtpHost, setSmtpHost,
    smtpPort, setSmtpPort,
    smtpSecure, setSmtpSecure,
    smtpUser, setSmtpUser,
    smtpPass, setSmtpPass,
    fromName, setFromName,
    onSaveSmtpSettings,
    recipientEmails,
    newEmail, setNewEmail,
    isSendingTest,
    addEmail,
    removeEmail,
    handleSendTestEmail,
  };
}

export type EmailSettings = ReturnType<typeof useEmailSettings>;
