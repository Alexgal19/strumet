'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export const RecruitmentPageHeader = ({
  canExport,
  onExport,
}: {
  canExport: boolean;
  onExport: () => void;
}) => {
  return (
    <PageHeader
      title="Obsada"
      description="Zaplanuj, ile osób trzeba zrekrutować do każdego działu i kiedy mają przyjść."
    >
      <Button
        onClick={onExport}
        variant="outline"
        disabled={!canExport}
        className="gap-2 border-primary/20 bg-white/50 text-primary hover:bg-primary/5 dark:bg-black/50"
      >
        <Download className="h-4 w-4" />
        Eksportuj do Excel
      </Button>
    </PageHeader>
  );
};
