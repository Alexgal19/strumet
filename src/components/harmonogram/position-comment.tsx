'use client';

import { format } from 'date-fns';
import { Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MAX_COMMENT_LEN } from '@/lib/komentarze-validation';

import { t } from '@/lib/i18n';
export function PositionComment({ saved, draft, isEditing, onStartEdit, onDraftChange, onCancel, onSave }: {
  saved?: { text: string; author?: string; updatedAt?: string };
  draft: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onDraftChange: (v: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (isEditing) {
    return (
      <div className="flex flex-col gap-1.5 mt-1">
        <Textarea
          className="min-h-[60px] text-sm"
          maxLength={MAX_COMMENT_LEN + 1}
          placeholder={t('schedule.commentEmptySaveDelete')}
          value={draft}
          onChange={e => onDraftChange(e.target.value)}
        />
        <div className="flex items-center gap-1.5">
          <Button type="button" size="sm" className=" text-sm" onClick={onSave}>{t('schedule.save')}</Button>
          <Button type="button" variant="ghost" size="sm" className=" text-sm" onClick={onCancel}>{t('schedule.cancel')}</Button>
        </div>
      </div>
    );
  }
  if (saved?.text) {
    return (
      <div className="rounded-md bg-muted/50 px-2 py-1.5 text-sm mt-1">
        <div className="flex items-start justify-between gap-2">
          <p className="whitespace-pre-wrap text-foreground">💬 {saved.text}</p>
          <Button type="button" variant="ghost" size="icon" title={t('schedule.editComment')} className="h-5 w-5 shrink-0 text-blue-600 hover:text-blue-700" onClick={onStartEdit}>
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
        {(saved.author || saved.updatedAt) && (
          <p className="mt-0.5 text-sm text-foreground">
            {saved.author}
            {saved.updatedAt ? ` • ${format(new Date(saved.updatedAt), 'dd.MM.yyyy')}` : ''}
          </p>
        )}
      </div>
    );
  }
  return (
    <Button type="button" variant="ghost" size="sm" className="mt-1 gap-1 text-sm text-foreground" onClick={onStartEdit}>
      <Plus className="h-3 w-3" /> Dodaj komentarz
    </Button>
  );
}
