'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { t } from '@/lib/i18n';
type EditItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  value: string;
  onValueChange: (value: string) => void;
  onConfirm: () => void;
};

export function EditItemDialog({ open, onOpenChange, title, value, onValueChange, onConfirm }: EditItemDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {t('settings.renamingWillUpdateTheData')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="edit-item-name">{t('settings.newName')}</Label>
            <Input
              id="edit-item-name"
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">{t('settings.cancel')}</Button>
          </DialogClose>
          <Button onClick={onConfirm}>{t('settings.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
