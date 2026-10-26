import type { ForecastRow } from '@/lib/braki-prognoza';
import type { HarmonogramData } from '@/lib/harmonogram';

export type JobStat = {
  jobTitle: string;
  obecnie: number;
  potrzeby: number;
  zwalnia: number;
  zwalniani: { date: string; count: number; names: string[] }[];
  managers: { manager: string; potrzeby: number; obecnie: number; zwalnia: number }[];
};

export type JobTitlesByDept = Map<string, JobStat[]>;

export type PlannedArrival = NonNullable<HarmonogramData['planowanePrzyjecia']>[string];

export type JobDemandModel = {
  job: JobStat;
  planned: PlannedArrival[];
  forecast: ForecastRow[];
  now: number;
  in7: number;
  in30: number;
  plannedTotal: number;
  net: number;
};

export type DeptAgg = {
  potrzeby: number;
  obecnie: number;
  zwalnia: number;
  now: number;
  in7: number;
  in30: number;
  planned: number;
  net: number;
};

export type DeptDemandModel = {
  dept: string;
  agg: DeptAgg;
  jobs: JobDemandModel[];
};

export type BulkOptions = Map<string, { jobTitle: string; net: number }[]>;
