'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type AddItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  value: string;
  onValueChange: (value: string) => void;
  onConfirm: () => void;
};

export function AddItemDialog({ open, onOpenChange, title, value, onValueChange, onConfirm }: AddItemDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Wprowadź nazwy, każdą w nowej linii. Puste linie zostaną zignorowane.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="new-items-text">Nazwy</Label>
            <Textarea
              id="new-items-text"
              placeholder="Nazwa 1\nNazwa 2\nNazwa 3..."
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              className="h-32"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Anuluj</Button>
          </DialogClose>
          <Button onClick={onConfirm}>Dodaj</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
