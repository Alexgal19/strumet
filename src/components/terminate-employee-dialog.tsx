'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerInput } from '@/components/employee-form';
import type { Employee, ConfigItem } from '@/lib/types';
import { parseMaybeDate } from '@/lib/date';
import { useI18n, rich } from '@/lib/i18n';

const NO_REASON = '__none__';

export interface TerminationDetails {
  terminationDate: string;
  terminationReason?: string;
}

/**
 * Okno „Zwolnij pracownika”: najpierw data zwolnienia (ostatni dzień pracy) i powód z listy,
 * dopiero po zatwierdzeniu osoba zostaje zwolniona. Powód jest opcjonalny.
 */
export function TerminateEmployeeDialog({ employee, reasons, onCancel, onConfirm }: {
  employee: Employee | null;
  reasons: ConfigItem[];
  onCancel: () => void;
  onConfirm: (employee: Employee, details: TerminationDetails) => Promise<boolean>;
}) {
  const [date, setDate] = useState<string | undefined>();
  const [reason, setReason] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const { t } = useI18n();

  // Domyślnie: planowana data zwolnienia, jeśli już minęła lub jest dzisiaj; w przeciwnym razie dziś.
  useEffect(() => {
    if (!employee) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const planned = parseMaybeDate(employee.plannedTerminationDate);
    const plannedYmd = planned ? format(planned, 'yyyy-MM-dd') : undefined;
    setDate(plannedYmd && plannedYmd <= today ? plannedYmd : today);
    setReason(employee.terminationReason || undefined);
    setSaving(false);
  }, [employee]);

  const submit = async () => {
    if (!employee || !date) return;
    setSaving(true);
    const ok = await onConfirm(employee, { terminationDate: date, terminationReason: reason });
    setSaving(false);
    if (ok) onCancel();
  };

  return (
    <Dialog open={!!employee} onOpenChange={open => { if (!open && !saving) onCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('employee.terminateEmployee')}</DialogTitle>
          <DialogDescription>
            {rich(t('employee.terminateDialogDesc'), { name: <strong>{employee?.fullName}</strong> })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('employee.terminationDateLastDay')}</Label>
            <DatePickerInput value={date} onChange={setDate} placeholder={t('common.selectDate')} maxDate={new Date()} />
            <p className="text-xs text-foreground">
              {t('employee.terminationDateHint')}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('employee.terminationReason')}</Label>
            <Select value={reason || NO_REASON} onValueChange={value => setReason(value === NO_REASON ? undefined : value)}>
              <SelectTrigger className="h-11 transition-all">
                <SelectValue placeholder={t('employee.chooseReason')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_REASON}>{t('employee.noReason')}</SelectItem>
                {reasons.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
                {reason && !reasons.some(r => r.name === reason) && <SelectItem value={reason}>{reason}</SelectItem>}
              </SelectContent>
            </Select>
            {reasons.length === 0 && (
              <p className="text-xs text-foreground">{t('employee.noReasonsHint')}</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>{t('common.cancel')}</Button>
          <Button type="button" onClick={submit} disabled={!date || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('employee.terminate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
