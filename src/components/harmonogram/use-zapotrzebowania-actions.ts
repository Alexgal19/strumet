'use client';

import type React from 'react';
import { ref as dbRef, push, remove, set, update } from 'firebase/database';
import { getDB } from '@/lib/firebase';
import { commentKey, MAX_COMMENT_LEN } from '@/lib/komentarze-validation';
import { formatYmdPl } from '@/lib/date';
import type { HarmonogramData } from '@/lib/harmonogram';
import type { useToast } from '@/hooks/use-toast';

import { t } from '@/lib/i18n';
type ToastFn = ReturnType<typeof useToast>['toast'];

/** Zapis komentarzy i przyjęć — gość przez publiczne API, admin przez Client SDK. */
export function useZapotrzebowaniaActions({
  data,
  setData,
  onUpdatePotrzeby,
  isAdmin,
  currentUserEmail,
  logAudit,
  toast,
  newArrivalDate,
  newArrivalCount,
  commentDrafts,
  setEditingComment,
  setNewArrivalDate,
  setNewArrivalCount,
}: {
  data: HarmonogramData;
  setData: React.Dispatch<React.SetStateAction<HarmonogramData | null>>;
  onUpdatePotrzeby?: (dept: string, mgr: string, job: string, newAmount: number) => void | boolean | Promise<boolean | void>;
  isAdmin: boolean;
  currentUserEmail?: string | null;
  logAudit: (action: string, details: string) => Promise<void>;
  toast: ToastFn;
  newArrivalDate: Record<string, string>;
  newArrivalCount: Record<string, string>;
  commentDrafts: Record<string, string>;
  setEditingComment: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setNewArrivalDate: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setNewArrivalCount: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const saveComment = async (dept: string, jobTitle: string) => {
    const cKey = commentKey(dept, jobTitle);
    const text = (commentDrafts[cKey] ?? '').trim();
    if (text.length > MAX_COMMENT_LEN) {
      toast({ variant: 'destructive', title: t('schedule.notSaved'), description: t('schedule.aCommentCanHaveAt', { max: MAX_COMMENT_LEN }) });
      return;
    }
    const applyLocal = (saved: { text: string; author: string; updatedAt: string } | null) => {
      setData(prev => {
        if (!prev) return prev;
        const current = { ...(prev.komentarzeZapotrzebowania || {}) };
        if (saved) current[cKey] = saved;
        else delete current[cKey];
        return { ...prev, komentarzeZapotrzebowania: current };
      });
      setEditingComment(prev => ({ ...prev, [cKey]: false }));
    };

    // Gość — przez publiczny API-rote (walidacja + audit po stronie serwera).
    if (!isAdmin) {
      try {
        const res = await fetch('/api/public/komentarze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ department: dept, jobTitle, text }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast({ variant: 'destructive', title: t('schedule.notSaved'), description: json.error || t('schedule.savingFailedPleaseTryAgain') });
          return;
        }
        if (json.removed) {
          applyLocal(null);
          toast({ title: t('schedule.commentDeleted') });
        } else {
          applyLocal({ text, author: 'Gość', updatedAt: new Date().toISOString() });
          toast({ title: t('schedule.commentSaved') });
        }
      } catch (err) {
        console.error('Failed to save comment (guest):', err);
        toast({ variant: 'destructive', title: t('schedule.notSaved'), description: t('schedule.noConnectionPleaseTryAgain') });
      }
      return;
    }

    // Admin — przez Client SDK (bez zmian w uprawnieniach).
    const db = getDB();
    if (!db) return;
    try {
      const nodeRef = dbRef(db, `komentarzeZapotrzebowania/${cKey}`);
      if (!text) {
        await remove(nodeRef);
        void logAudit('Usunięto komentarz zapotrzebowania', `${dept} / ${jobTitle}`);
        applyLocal(null);
      } else {
        const saved = { text, author: currentUserEmail || 'admin', updatedAt: new Date().toISOString() };
        await set(nodeRef, saved);
        void logAudit('Zapisano komentarz zapotrzebowania', `${dept} / ${jobTitle}`);
        applyLocal(saved);
      }
    } catch (err) {
      console.error('Failed to save comment:', err);
    }
  };

  /** Zapis jednego przyjęcia. Zwraca null (sukces) albo komunikat błędu. */
  const addArrival = async (dept: string, jobTitle: string, date: string, count: number, silent = false): Promise<string | null> => {
    const arrivalData = { department: dept, jobTitle, date, count };
    const applyLocal = (id: string) => {
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          planowanePrzyjecia: { ...(prev.planowanePrzyjecia || {}), [id]: { id, ...arrivalData } },
        };
      });
    };
    const fail = (message: string) => {
      if (!silent) toast({ variant: 'destructive', title: t('schedule.notSaved'), description: message });
      return message;
    };

    // Gość (także bez logowania) zapisuje przez publiczny API-rote — zapis/client-SDK jest dla niego zablokowany regułami.
    if (!isAdmin) {
      try {
        const res = await fetch('/api/public/przyjecia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(arrivalData),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) return fail(json.error || t('schedule.savingFailedPleaseTryAgain'));
        applyLocal(json.id as string);
        if (!silent) toast({ title: t('schedule.saved'), description: t('schedule.arrivalDateCountPpl', { date: formatYmdPl(date), count }) });
        return null;
      } catch (err) {
        console.error('Failed to add arrival (guest):', err);
        return fail(t('schedule.noConnectionPleaseTryAgain'));
      }
    }

    // Admin — przez Client SDK.
    const db = getDB();
    if (!db) return fail(t('schedule.noDatabaseConnection'));
    try {
      const newRef = push(dbRef(db, 'planowanePrzyjecia'));
      await set(newRef, arrivalData);
      void logAudit('Dodano planowane przyjęcie', `${dept} / ${jobTitle} — ${date} — ${count} os.`);
      applyLocal(newRef.key as string);
      return null;
    } catch (err) {
      console.error('Failed to add arrival:', err);
      return fail(t('schedule.savingFailedPleaseTryAgain'));
    }
  };

  const addArrivalFromInputs = async (dept: string, jobTitle: string) => {
    const key = `${dept}|${jobTitle}`;
    const date = newArrivalDate[key];
    const count = parseInt(newArrivalCount[key] || '0', 10);
    if (!date || count <= 0) return;
    const error = await addArrival(dept, jobTitle, date, count);
    if (error === null) {
      setNewArrivalDate(prev => ({ ...prev, [key]: '' }));
      setNewArrivalCount(prev => ({ ...prev, [key]: '' }));
    }
  };

  const commitPotrzeby = async (dept: string, mgr: string, job: string, amount: number) => {
    if (!isAdmin || !onUpdatePotrzeby) return;
    const saved = await onUpdatePotrzeby(dept, mgr, job, amount);
    if (saved !== false) void logAudit('Zmieniono potrzeby obsady', `${dept} / ${mgr} / ${job} → ${amount}`);
  };

  const updateArrival = async (id: string, newDate: string, newCount: number): Promise<boolean> => {
    if (!newDate || !Number.isInteger(newCount) || newCount <= 0) {
      toast({ variant: 'destructive', title: t('schedule.notSaved'), description: t('schedule.enterAValidDateAnd') });
      return false;
    }

    // Gość — przez publiczny API-rote (ta sama walidacja co przy dodawaniu).
    if (!isAdmin) {
      try {
        const res = await fetch('/api/public/przyjecia', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, date: newDate, count: newCount }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast({
            variant: 'destructive',
            title: t('schedule.notSaved'),
            description: json.error || t('schedule.savingFailedPleaseTryAgain'),
          });
          return false;
        }
        setData(prev => {
          if (!prev) return prev;
          const current = { ...(prev.planowanePrzyjecia || {}) };
          if (current[id]) {
            current[id] = { ...current[id], date: json.date, count: json.count };
          }
          return { ...prev, planowanePrzyjecia: current };
        });
        toast({ title: t('schedule.saved'), description: t('schedule.arrivalDateCountPpl', { date: formatYmdPl(json.date), count: json.count }) });
        return true;
      } catch (err) {
        console.error('Failed to update arrival (guest):', err);
        toast({ variant: 'destructive', title: t('schedule.notSaved'), description: t('schedule.noConnectionPleaseTryAgain') });
        return false;
      }
    }

    // Admin — dotychczasowa ścieżka przez Client SDK (bez zmian).
    const db = getDB();
    if (!db) return false;
    try {
      await update(dbRef(db, `planowanePrzyjecia/${id}`), { date: newDate, count: newCount });
      const target = data.planowanePrzyjecia?.[id];
      void logAudit('Edytowano planowane przyjęcie', `${target?.department ?? ''} / ${target?.jobTitle ?? ''} — ${newDate} — ${newCount} os.`);
      setData(prev => {
        if (!prev) return prev;
        const current = { ...(prev.planowanePrzyjecia || {}) };
        if (current[id]) {
          current[id] = { ...current[id], date: newDate, count: newCount };
        }
        return { ...prev, planowanePrzyjecia: current };
      });
      return true;
    } catch (err) {
      console.error('Failed to update arrival:', err);
      return false;
    }
  };

  const removeArrival = async (id: string) => {
    const db = getDB();
    if (!db) return;
    try {
      const target = data.planowanePrzyjecia?.[id];
      await remove(dbRef(db, `planowanePrzyjecia/${id}`));
      void logAudit('Usunięto planowane przyjęcie', `${target?.department ?? ''} / ${target?.jobTitle ?? ''} — ${target?.date ?? ''} — ${target?.count ?? ''} os.`);
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

  return { saveComment, addArrival, addArrivalFromInputs, commitPotrzeby, updateArrival, removeArrival };
}
