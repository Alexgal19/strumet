import type React from 'react';
import type { HarmonogramData } from '@/lib/harmonogram';

/** Stan i akcje wspólne dla kart działów w Zapotrzebowaniach. */
export type DemandRenderContext = {
  isAdmin: boolean;
  todayYmd: string;
  plus7: string;
  plus30: string;
  comments: HarmonogramData['komentarzeZapotrzebowania'];
  collapsedDepts: Record<string, boolean>;
  expandedJobs: Record<string, boolean>;
  expandedTerminations: Record<string, boolean>;
  newArrivalDate: Record<string, string>;
  newArrivalCount: Record<string, string>;
  commentDrafts: Record<string, string>;
  editingComment: Record<string, boolean>;
  toggleDept: (dept: string) => void;
  toggleJob: (key: string) => void;
  toggleTermination: (key: string) => void;
  setNewArrivalDate: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setNewArrivalCount: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  startComment: (cKey: string, savedText: string | undefined) => void;
  setCommentDraft: (cKey: string, value: string) => void;
  cancelComment: (cKey: string) => void;
  saveComment: (dept: string, jobTitle: string) => void;
  commitPotrzeby: (dept: string, manager: string, jobTitle: string, amount: number) => void;
  addArrival: (dept: string, jobTitle: string) => void;
  updateArrival: (id: string, date: string, count: number) => Promise<boolean>;
  removeArrival: (id: string) => void;
};
