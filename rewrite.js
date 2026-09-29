const fs = require('fs');

let content = fs.readFileSync('src/app/(app)/harmonogram/page.tsx', 'utf8');

// We will replace usePublicZapotrzebowaniaStats and PublicZapotrzebowaniaView entirely
const startIdx = content.indexOf('function usePublicZapotrzebowaniaStats(data: HarmonogramData) {');
const endIdx = content.indexOf('export default function PlanowaniePage() {');

if (startIdx !== -1 && endIdx !== -1) {
    const newCode = `function usePublicZapotrzebowaniaStats(data: HarmonogramData) {
  return useMemo(() => {
    const today = startOfDay(new Date());
    const headcountByDept = new Map<string, number>();
    const headcountByDeptJob = new Map<string, number>();
    const terminationsByDeptJob = new Map<string, number>();
    const potrzebyByDeptJob = new Map<string, number>();
    const jobTitlesByDept = new Map<string, { jobTitle: string; count: number; terminations: number }>();

    if (data.potrzebyByManager) {
      Object.entries(data.potrzebyByManager).forEach(([key, val]) => {
        const parts = key.split('___');
        if (parts.length === 3) {
          const dept = parts[0];
          const job = parts[2];
          const deptJobKey = dept + '|' + job;
          potrzebyByDeptJob.set(deptJobKey, (potrzebyByDeptJob.get(deptJobKey) ?? 0) + val);
        }
      });
    }

    const ensure = (dept: string) => {
      let entries = jobTitlesByDept.get(dept);
      if (!entries) {
        entries = [];
        jobTitlesByDept.set(dept, entries);
      }
      return entries;
    };

    const isPlannedTerm = (date?: string) => {
      const planned = date ? startOfDay(new Date(date)) : null;
      return !!planned && !Number.isNaN(planned.getTime()) && planned.getTime() >= today.getTime();
    };

    data.employees.forEach(e => {
      headcountByDept.set(e.department, (headcountByDept.get(e.department) ?? 0) + 1);
      const key = \`\${e.department}|\${e.jobTitle}\`;
      headcountByDeptJob.set(key, (headcountByDeptJob.get(key) ?? 0) + 1);
      const terminating = isPlannedTerm(e.plannedTerminationDate);
      if (terminating) terminationsByDeptJob.set(key, (terminationsByDeptJob.get(key) ?? 0) + 1);
      
      if (!e.department || !e.jobTitle) return;
      const entries = ensure(e.department);
      const existing = entries.find(x => x.jobTitle === e.jobTitle);
      if (existing) {
        existing.count += 1;
        if (terminating) existing.terminations += 1;
      } else {
        entries.push({
          jobTitle: e.jobTitle,
          count: 1,
          terminations: terminating ? 1 : 0,
        });
      }
    });

    // Ensure all jobs that have potrzeby are also in jobTitlesByDept
    potrzebyByDeptJob.forEach((val, key) => {
      const [dept, job] = key.split('|');
      const entries = ensure(dept);
      if (!entries.find(x => x.jobTitle === job)) {
        entries.push({ jobTitle: job, count: 0, terminations: 0 });
      }
    });

    jobTitlesByDept.forEach(entries =>
      entries.sort((a, b) => b.count - a.count || a.jobTitle.localeCompare(b.jobTitle, 'pl'))
    );

    return { headcountByDept, headcountByDeptJob, terminationsByDeptJob, jobTitlesByDept, potrzebyByDeptJob };
  }, [data]);
}

function PublicZapotrzebowaniaView({ data, setData }: { data: HarmonogramData, setData: React.Dispatch<React.SetStateAction<HarmonogramData | null>> }) {
  const { headcountByDeptJob, terminationsByDeptJob, jobTitlesByDept, potrzebyByDeptJob } = usePublicZapotrzebowaniaStats(data);
  const { isAdmin } = useAppContext();
  
  const [newArrivalDate, setNewArrivalDate] = useState<Record<string, string>>({});
  const [newArrivalCount, setNewArrivalCount] = useState<Record<string, string>>({});

  const getMissing = (dept: string, jobTitle: string) => {
    const key = \`\${dept}|\${jobTitle}\`;
    const potrzeby = potrzebyByDeptJob.get(key) || 0;
    const obecnie = headcountByDeptJob.get(key) || 0;
    const zwalnia = terminationsByDeptJob.get(key) || 0;
    return Math.max(0, potrzeby - (obecnie - zwalnia));
  };

  const getPlannedForJob = (dept: string, jobTitle: string) => {
    if (!data.planowanePrzyjecia) return [];
    return Object.values(data.planowanePrzyjecia).filter(p => p.department === dept && p.jobTitle === jobTitle);
  };

  const getPlannedTotalForJob = (dept: string, jobTitle: string) => {
    return getPlannedForJob(dept, jobTitle).reduce((sum, p) => sum + p.count, 0);
  };

  let totalMissing = 0;
  jobTitlesByDept.forEach((jobs, dept) => {
    jobs.forEach(job => {
      totalMissing += getMissing(dept, job.jobTitle);
    });
  });

  const totalPlanned = data.planowanePrzyjecia ? Object.values(data.planowanePrzyjecia).reduce((sum, p) => sum + p.count, 0) : 0;

  const handleAddArrival = async (dept: string, jobTitle: string) => {
    const key = \`\${dept}|\${jobTitle}\`;
    const date = newArrivalDate[key];
    const count = parseInt(newArrivalCount[key] || '0', 10);
    if (!date || count <= 0) return;

    const db = getDB();
    if (!db) return;

    try {
      const newRef = push(dbRef(db, 'planowanePrzyjecia'));
      const arrivalData = {
        department: dept,
        jobTitle,
        date,
        count
      };
      await set(newRef, arrivalData);
      
      // Update local state
      setData(prev => {
        if (!prev) return prev;
        const current = prev.planowanePrzyjecia || {};
        return {
          ...prev,
          planowanePrzyjecia: {
            ...current,
            [newRef.key as string]: { id: newRef.key as string, ...arrivalData }
          }
        };
      });

      setNewArrivalDate(prev => ({ ...prev, [key]: '' }));
      setNewArrivalCount(prev => ({ ...prev, [key]: '' }));
    } catch (err) {
      console.error('Failed to add arrival:', err);
    }
  };

  const handleRemoveArrival = async (id: string) => {
    const db = getDB();
    if (!db) return;
    try {
      await remove(dbRef(db, \`planowanePrzyjecia/\${id}\`));
      setData(prev => {
        if (!prev) return prev;
        const current = { ...(prev.planowanePrzyjecia || {}) };
        delete current[id];
        return { ...prev, planowanePrzyjecia: current };
      });
    } catch (err) {
      console.error('Failed to remove arrival:', err);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm tabular-nums">
          <UserPlus className="h-4 w-4" />
          Łącznie brakuje: {Math.max(0, totalMissing - totalPlanned)}
        </Badge>
        <Badge
          variant="outline"
          className="gap-1.5 border-blue-500/60 px-3 py-1.5 text-sm text-blue-700 tabular-nums dark:text-blue-400"
        >
          <CalendarPlus className="h-4 w-4" />
          Zaplanowane przyjęcia: {totalPlanned}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {Array.from(jobTitlesByDept.entries())
          .sort(([deptA], [deptB]) => deptA.localeCompare(deptB, 'pl'))
          .map(([dept, jobs]) => {
            const deptMissing = jobs.reduce((sum, job) => sum + getMissing(dept, job.jobTitle), 0);
            const deptPlanned = jobs.reduce((sum, job) => sum + getPlannedTotalForJob(dept, job.jobTitle), 0);
            const netMissing = Math.max(0, deptMissing - deptPlanned);

            return (
              <Card key={dept}>
                <CardHeader className="pb-3">
                  <div className="space-y-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <CardTitle className="text-base truncate">{dept}</CardTitle>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {netMissing > 0 ? (
                        <Badge variant="destructive" className="tabular-nums text-xs font-semibold px-2 py-0.5">
                          Brakuje: {netMissing}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-emerald-500/60 text-emerald-700 tabular-nums dark:text-emerald-400 text-xs">
                          Komplet
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Stanowiska i braki:</p>
                    {jobs.length === 0 ? (
                      <p className="rounded-md border border-dashed px-3 py-3 text-center text-xs text-muted-foreground">
                        Brak stanowisk.
                      </p>
                    ) : (
                      jobs.map((job, i) => {
                        const jobMissing = getMissing(dept, job.jobTitle);
                        const jobPlanned = getPlannedForJob(dept, job.jobTitle);
                        const jobPlannedTotal = getPlannedTotalForJob(dept, job.jobTitle);
                        const jobNetMissing = Math.max(0, jobMissing - jobPlannedTotal);
                        const key = \`\${dept}|\${job.jobTitle}\`;
                        const potrzeby = potrzebyByDeptJob.get(key) || 0;
                        const obecnie = headcountByDeptJob.get(key) || 0;
                        const zwalnia = terminationsByDeptJob.get(key) || 0;

                        if (potrzeby === 0 && obecnie === 0) return null; // Skip empty combinations

                        return (
                          <div key={key} className="flex flex-col gap-2 rounded-md border bg-background/50 px-3 py-3 text-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground hidden sm:block" />
                                <span className="font-medium">{job.jobTitle}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  Potrzeby: <strong className="text-emerald-600">{potrzeby} os.</strong> (jest {obecnie}, zwalnia {zwalnia})
                                </span>
                                {jobNetMissing > 0 && (
                                  <Badge variant="destructive" className="text-xs px-1.5 py-0">Brakuje {jobNetMissing}</Badge>
                                )}
                              </div>
                            </div>

                            {/* Planowane przyjęcia dla tego stanowiska */}
                            {jobMissing > 0 && isAdmin && (
                                <div className="mt-2 flex flex-col gap-2 border-t pt-2">
                                  {jobPlanned.length > 0 && (
                                    <div className="flex flex-col gap-1">
                                      <span className="text-xs font-medium text-muted-foreground">Zaplanowane przyjazdy:</span>
                                      {jobPlanned.map(p => (
                                        <div key={p.id} className="flex items-center justify-between bg-muted/50 rounded px-2 py-1 text-xs">
                                          <span>📅 {format(new Date(p.date), 'dd.MM.yyyy')} — <strong>{p.count} os.</strong></span>
                                          <Button type="button" variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => handleRemoveArrival(p.id)}>
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <Input
                                      type="date"
                                      className="h-8 text-xs flex-1"
                                      value={newArrivalDate[key] || ''}
                                      onChange={e => setNewArrivalDate(prev => ({ ...prev, [key]: e.target.value }))}
                                    />
                                    <Input
                                      type="number"
                                      min="1"
                                      placeholder="Ilość"
                                      className="h-8 w-20 text-xs"
                                      value={newArrivalCount[key] || ''}
                                      onChange={e => setNewArrivalCount(prev => ({ ...prev, [key]: e.target.value }))}
                                    />
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="h-8 text-xs"
                                      onClick={() => handleAddArrival(dept, job.jobTitle)}
                                      disabled={!newArrivalDate[key] || !newArrivalCount[key]}
                                    >
                                      Dodaj
                                    </Button>
                                  </div>
                                </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </>
  );
}
`;

    content = content.substring(0, startIdx) + newCode + content.substring(endIdx);
    fs.writeFileSync('src/app/(app)/harmonogram/page.tsx', content);
    console.log('Replaced successfully');
} else {
    console.log('Could not find boundaries');
}
