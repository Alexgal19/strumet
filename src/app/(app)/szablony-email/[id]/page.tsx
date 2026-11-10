'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import type {
  EmailTemplate,
  EmailTriggerType,
  EmailTriggerEvent,
  EmailTriggerConfig,
} from '@/lib/types';

import { t } from '@/lib/i18n';
const TRIGGER_TYPES: { value: EmailTriggerType; label: string }[] = [
  { value: 'manual', get label() { return t('email.manual'); } },
  { value: 'scheduled', get label() { return t('email.scheduled'); } },
  { value: 'event', get label() { return t('email.eventBased'); } },
];

const TRIGGER_EVENTS: { value: EmailTriggerEvent; label: string }[] = [
  { value: 'contractExpiry', get label() { return t('email.contractExpiry'); } },
  { value: 'fingerprintReminder', get label() { return t('email.fingerprintReminder'); } },
  { value: 'newHire', get label() { return t('email.newEmployee'); } },
  { value: 'plannedTermination', get label() { return t('email.plannedTermination'); } },
  { value: 'legalisationWarning', get label() { return t('email.legalisationWarning'); } },
];

const TEMPLATE_VARIABLES = [
  '{employeeFullName}',
  '{contractEndDate}',
  '{daysUntilExpiry}',
  '{department}',
  '{jobTitle}',
  '{managerName}',
  '{hireDate}',
  '{companyName}',
];

export default function EmailTemplateFormPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'nowy';
  const { emailTemplates, addEmailTemplate, updateEmailTemplate } = useAppContext();
  const { toast } = useToast();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    subject: '',
    body: '',
    triggerType: 'manual' as EmailTriggerType,
    event: 'contractExpiry' as EmailTriggerEvent,
    daysBefore: '7',
    active: true,
  });

  useEffect(() => {
    if (!isNew && params.id) {
      const template = emailTemplates.find(t => t.id === params.id);
      if (template) {
        setForm({
          name: template.name || '',
          subject: template.subject || '',
          body: template.body || '',
          triggerType: template.triggerType || 'manual',
          event: template.triggerConfig?.event || 'contractExpiry',
          daysBefore: String(template.triggerConfig?.daysBefore || '7'),
          active: template.triggerConfig?.active ?? true,
        });
      }
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [isNew, params.id, emailTemplates]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (saving) return;
    setSaving(true);

    try {
      const triggerConfig: EmailTriggerConfig = {
        event: form.event as EmailTriggerEvent,
        daysBefore: parseInt(form.daysBefore || '7', 10),
        active: form.active,
      };

      const templateData = {
        name: form.name,
        subject: form.subject,
        body: form.body,
        triggerType: form.triggerType,
        triggerConfig,
        createdAt: new Date().toISOString(),
        createdBy: 'admin',
      };

      if (isNew) {
        await addEmailTemplate(templateData);
      } else if (params.id) {
        await updateEmailTemplate(params.id as string, templateData);
      }

      router.push('/szablony-email');
    } catch (error) {
      console.error('Save error:', error);
      toast({ variant: 'destructive', title: t('email.error'), description: t('email.couldNotSaveTheTemplate') });
    } finally {
      setSaving(false);
    }
  }

  function insertVariable(variable: string) {
    const textarea = document.getElementById('body-field') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newBody = form.body.slice(0, start) + variable + form.body.slice(end);
      setForm(f => ({ ...f, body: newBody }));
      setTimeout(() => textarea.focus(), 0);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/szablony-email')}>
          {t('email.back')}
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          {isNew ? t('email.newTemplate') : t('email.editTemplate')}
        </h1>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">{t('email.loading')}</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('email.templateName')}</Label>
              <Input
                id="name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="np. Przypomnienie o kontrakcie"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">{t('email.messageSubject')}</Label>
              <Input
                id="subject"
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="np. {employeeFullName} — kontrakt wygasa za {daysUntilExpiry} dni"
                required
              />
              <p className="text-xs text-muted-foreground">
                Użyj zmiennych: {TEMPLATE_VARIABLES.join(' | ')}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="body-field">{t('email.messageBody')}</Label>
                <div className="flex gap-1 flex-wrap">
                  {TEMPLATE_VARIABLES.map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v)}
                      className="text-xs px-2 py-1 bg-muted rounded hover:bg-muted/80 font-mono"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                id="body-field"
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder="Szanowny {employeeFullName},&#10;&#10;Twój kontrakt wygasa za {daysUntilExpiry} dni..."
                className="min-h-[200px] font-mono text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('email.triggerType')}</Label>
                <Select
                  value={form.triggerType}
                  onValueChange={(v: EmailTriggerType) => setForm(f => ({ ...f, triggerType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map(tt => (
                      <SelectItem key={tt.value} value={tt.value}>
                        {tt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('email.event')}</Label>
                <Select
                  value={form.event}
                  onValueChange={(v: EmailTriggerEvent) => setForm(f => ({ ...f, event: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_EVENTS.map(e => (
                      <SelectItem key={e.value} value={e.value}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="daysBefore">{t('email.daysBeforeTheEvent')}</Label>
                <Input
                  id="daysBefore"
                  type="number"
                  min="1"
                  max="365"
                  value={form.daysBefore}
                  onChange={e => setForm(f => ({ ...f, daysBefore: e.target.value }))}
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/szablony-email')}
            >
              {t('email.cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t('email.saving') : t('email.saveTemplate')}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}