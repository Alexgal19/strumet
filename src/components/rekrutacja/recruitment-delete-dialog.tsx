'use client';

import type { Recruitment } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

export const RecruitmentDeleteDialog = ({
  toDelete,
  isDeleting,
  onConfirm,
  onOpenChange,
}: {
  toDelete: Recruitment | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}) => {
  return (
    <AlertDialog open={!!toDelete} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Usunąć zapotrzebowanie?</AlertDialogTitle>
          <AlertDialogDescription>
            Zapotrzebowanie dla działu „{toDelete?.department}” ({toDelete?.positions.length ?? 0}{' '}
            pozycji) zostanie usunięte razem z liczbami osób i wszystkimi datami przyjęć. Tej
            operacji nie można cofnąć.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Anuluj</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isDeleting} className="gap-2">
            {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Usuń
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
