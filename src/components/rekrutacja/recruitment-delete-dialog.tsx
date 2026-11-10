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

import { t } from '@/lib/i18n';
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
          <AlertDialogTitle>{t('recruit.deleteThisRequest')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('recruit.theRequestForDepartmentDepartment', { department: toDelete?.department ?? '', count: toDelete?.positions.length ?? 0 })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('recruit.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isDeleting} className="gap-2">
            {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('recruit.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
