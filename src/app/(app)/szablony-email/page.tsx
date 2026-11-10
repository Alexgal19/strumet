'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Send, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import type { EmailTemplate, EmailTriggerType } from '@/lib/types';

import { t } from '@/lib/i18n';
const TRIGGER_LABELS: Record<EmailTriggerType, string> = {
  get manual() { return t('email.manual'); },
  get scheduled() { return t('email.scheduled'); },
  get event() { return t('email.eventBased'); },
};

export default function EmailTemplatesPage() {
  const { emailTemplates, deleteEmailTemplate } = useAppContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sendTestId, setSendTestId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setLoading(true);
    try {
      await deleteEmailTemplate(id);
    } finally {
      setLoading(false);
      setDeleteId(null);
    }
  }

  async function handleSendTest(id: string) {
    toast({ title: t('email.test'), description: t('email.testSendingIsNotAvailable') });
    setSendTestId(null);
  }

  const filteredTemplates = filter === 'all'
    ? emailTemplates
    : emailTemplates.filter(t => t.triggerType === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('email.emailTemplates')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('email.manageEmailTemplatesForAutomatic')}
          </p>
        </div>
        <Button asChild>
          <Link href="/szablony-email/nowy">
            <Plus className="mr-2 h-4 w-4" />
            {t('email.newTemplate')}
          </Link>
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('email.filter')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('email.all')}</SelectItem>
            <SelectItem value="manual">{t('email.manual2')}</SelectItem>
            <SelectItem value="scheduled">{t('email.scheduled2')}</SelectItem>
            <SelectItem value="event">{t('email.eventBased2')}</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {t('email.totalCountTemplates', { count: emailTemplates.length })}
        </span>
      </div>

      {filteredTemplates.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">{t('email.noTemplatesCreateTheFirst')}</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTemplates.map(template => (
            <Card key={template.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold truncate">{template.name}</h3>
                    <Badge variant="secondary">
                      {TRIGGER_LABELS[template.triggerType]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    <strong>{t('email.subject')}</strong> {template.subject}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    <strong>{t('email.body')}</strong> {template.body.slice(0, 100)}...
                  </p>
                  {template.triggerConfig?.event && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Event: {template.triggerConfig.event}
                      {template.triggerConfig.daysBefore && ` · ${template.triggerConfig.daysBefore} dni przed`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    title={t('email.edit')}
                  >
                    <Link href={`/szablony-email/${template.id}`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title={t('email.sendTest')}
                    onClick={() => setSendTestId(template.id)}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title={t('email.delete')}
                    onClick={() => setDeleteId(template.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('email.deleteTemplate')}</DialogTitle>
          </DialogHeader>
          <p>{t('email.deleteThisTemplateThisCannot')}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>{t('email.cancel')}</Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={loading}
            >
              {t('email.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Test Dialog */}
      <Dialog open={!!sendTestId} onOpenChange={() => setSendTestId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('email.sendATestEmail')}</DialogTitle>
          </DialogHeader>
          <p>
            {t('email.theTestEmailWillBe')}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendTestId(null)}>{t('email.cancel')}</Button>
            <Button onClick={() => sendTestId && handleSendTest(sendTestId)}>
              {t('email.sendTest')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}