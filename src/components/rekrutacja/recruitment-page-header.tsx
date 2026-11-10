'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

import { t } from '@/lib/i18n';
export const RecruitmentPageHeader = ({
  canExport,
  onExport,
}: {
  canExport: boolean;
  onExport: () => void;
}) => {
  return (
    <PageHeader
      title={t('recruit.staffing')}
      description={t('recruit.planHowManyPeopleEach')}
    >
      <Button
        onClick={onExport}
        variant="outline"
        disabled={!canExport}
        className="gap-2 border-primary/20 bg-white/50 text-primary hover:bg-primary/5 dark:bg-black/50"
      >
        <Download className="h-4 w-4" />
        {t('recruit.exportToExcel')}
      </Button>
    </PageHeader>
  );
};
