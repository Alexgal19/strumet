'use client';

import type { Recruitment } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';
import { RecruitmentCard } from './recruitment-card';

export const RecruitmentList = ({
  sortedRecruitments,
  departments,
  jobTitles,
  headcountByDepartment,
  headcountByDeptJob,
  terminationsByDeptJob,
  jobTitlesByDepartment,
  onUpdateDepartment,
  onDelete,
}: {
  sortedRecruitments: Recruitment[];
  departments: { id: string; name: string }[];
  jobTitles: { id: string; name: string }[];
  headcountByDepartment: Map<string, number>;
  headcountByDeptJob: Map<string, number>;
  terminationsByDeptJob: Map<string, number>;
  jobTitlesByDepartment: Map<
    string,
    { jobTitle: string; count: number; toRecruit: number; terminations: number }[]
  >;
  onUpdateDepartment: (recruitment: Recruitment, department: string) => Promise<boolean>;
  onDelete: (recruitment: Recruitment) => void;
}) => {
  if (sortedRecruitments.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          <UserPlus className="mx-auto mb-3 h-8 w-8 opacity-40" />
          Brak danych — wybierz dział i stanowiska powyżej, aby zaplanować rekrutację.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {sortedRecruitments.map(recruitment => (
        <RecruitmentCard
          key={recruitment.id}
          recruitment={recruitment}
          departments={departments}
          jobTitles={jobTitles}
          departmentHeadcount={headcountByDepartment.get(recruitment.department) ?? 0}
          headcountByDeptJob={headcountByDeptJob}
          terminationsByDeptJob={terminationsByDeptJob}
          jobTitleStats={jobTitlesByDepartment.get(recruitment.department) ?? []}
          onUpdateDepartment={onUpdateDepartment}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
