'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getStorage_ } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Trash2, UserX, ClipboardCopy, Shirt, ArrowLeft, ArrowRight, CalendarOff, X, Upload, ImageIcon, Loader2, Download } from 'lucide-react';
import { format as formatFns } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Employee, AllConfig, ClothingIssuance } from '@/lib/types';
import { Separator } from './ui/separator';
import { formatDate, parseMaybeDate, vacationIsOver } from '@/lib/date';
import { legalizationStatuses } from '@/lib/legalization-statuses';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-context';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useIsMobile } from '@/hooks/use-mobile';
import { joinFullName, getEmployeeNameParts } from '@/lib/person-name';
import { certificateViewUrl, certificateExt } from '@/lib/certificate-url';
import { useI18n, type TranslationKey } from '@/lib/i18n';


export const DatePickerInput = ({ value, onChange, placeholder, maxDate }: { value?: string, onChange: (date?: string) => void, placeholder: string, maxDate?: Date }) => {
    const dateValue = parseMaybeDate(value);
    const { t, dateLocale } = useI18n();
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal h-11 transition-all", !dateValue && "text-muted-foreground")}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateValue ? formatDate(dateValue, "PPP", dateLocale) : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 flex flex-col" align="center" side="bottom" collisionPadding={16}>
                <Calendar
                    mode="single"
                    selected={dateValue || undefined}
                    onSelect={(date) => onChange(date ? formatFns(date, 'yyyy-MM-dd') : undefined)}
                    locale={dateLocale}
                    disabled={maxDate ? { after: maxDate } : undefined}
                    initialFocus
                />
                {value && (
                   <Button type="button" variant="ghost" size="sm" className="m-2 mt-0" onClick={() => onChange(undefined)}>
                     <Trash2 className="mr-2 h-4 w-4" />
                     {t('employee.clearDate')}
                   </Button>
                )}
            </PopoverContent>
        </Popover>
    );
};

interface EmployeeFormProps {
  employee: Employee | null;
  onSave: (employee: Employee) => void;
  onCancel: () => void;
  onTerminate?: (id: string, fullName: string) => void;
  onPrintClothing?: (employee: Employee, issuance: ClothingIssuance) => void;
  config: AllConfig;
}

// Kroki kreatora na mobile — każdy panel = jeden ekran (Android wizard)
const STEPS: TranslationKey[] = ['employee.stepPersonal', 'employee.stepEmployment', 'employee.stepIdPlanning'];
const STEP_FIELDS: Record<number, string[]> = {
  0: ['lastName', 'firstName', 'nationality', 'legalizationStatus'],
  1: ['department', 'jobTitle', 'manager', 'hireDate'],
  2: ['cardNumber', 'vacationEndDate'],
};

/** Wartość pozycji „brak powodu” (Radix Select nie przyjmuje pustego value). */
const NO_REASON = '__none__';

const getInitialFormData = (employee: Employee | null): Omit<Employee, 'id' | 'status'> => {
    if (employee) {
        // Urlop, który już się zakończył, nie jest pokazywany w formularzu — pola są czyszczone.
        const vacationExpired = vacationIsOver(employee.vacationEndDate);
        return {
            fullName: employee.fullName || '',
            hireDate: employee.hireDate || '',
            jobTitle: employee.jobTitle || '',
            department: employee.department || '',
            manager: employee.manager || '',
            cardNumber: employee.cardNumber || '',
            nationality: employee.nationality || '',
            lockerNumber: employee.lockerNumber || '',
            lockerNumber2: employee.lockerNumber2 || '',
            lockerNumber3: employee.lockerNumber3 || '',
            departmentLockerNumber: employee.departmentLockerNumber || '',
            sealNumber: employee.sealNumber || '',
            plannedTerminationDate: employee.plannedTerminationDate,
            vacationStartDate: vacationExpired ? undefined : employee.vacationStartDate,
            vacationEndDate: vacationExpired ? undefined : employee.vacationEndDate,
            contractEndDate: employee.contractEndDate,
            legalizationStatus: employee.legalizationStatus || 'Brak',
            terminationDate: employee.terminationDate,
            terminationReason: employee.terminationReason,
            welderLicense: employee.welderLicense || 'Nie',
            certificateUrl: employee.certificateUrl,
        };
    }
    return {
        fullName: '',
        hireDate: formatFns(new Date(), 'yyyy-MM-dd'),
        jobTitle: '',
        department: '',
        manager: '',
        cardNumber: '',
        nationality: '',
        lockerNumber: '',
        lockerNumber2: '',
        lockerNumber3: '',
        departmentLockerNumber: '',
        sealNumber: '',
        plannedTerminationDate: undefined,
        vacationStartDate: undefined,
        vacationEndDate: undefined,
        contractEndDate: undefined,
        legalizationStatus: 'Brak',
        terminationReason: undefined,
        welderLicense: 'Nie',
        certificateUrl: undefined,
    };
};

export function EmployeeForm({ employee, onSave, onCancel, onTerminate, onPrintClothing, config }: EmployeeFormProps) {
    const { departments, jobTitles, managers, nationalities } = config;
    const terminationReasons = config.terminationReasons ?? [];
    const { toast } = useToast();
    const { absences, addAbsence, deleteAbsence } = useAppContext();
    const { t, dateLocale } = useI18n();
    const isMobile = useIsMobile();
    const isMobileWizard = isMobile && !employee;
    const [formData, setFormData] = useState<Omit<Employee, 'id' | 'status'>>(getInitialFormData(employee));
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [step, setStep] = useState(0);
    const [isSavingAbsence, setIsSavingAbsence] = useState(false);
    const [isReadyToSubmit, setIsReadyToSubmit] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const topRef = React.useRef<HTMLDivElement>(null);
    const certInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (step === STEPS.length - 1) {
            const timer = setTimeout(() => setIsReadyToSubmit(true), 400);
            return () => clearTimeout(timer);
        } else {
            setIsReadyToSubmit(false);
        }
    }, [step]);

    const employeeAbsences = React.useMemo(
        () => absences.filter(a => a.employeeId === employee?.id),
        [absences, employee?.id]
    );

    const absenceDates = React.useMemo(
        () =>
            employeeAbsences
                .map(a => ({ id: a.id, date: parseMaybeDate(a.date), key: a.date }))
                .filter((a): a is { id: string; date: Date; key: string } => !!a.date)
                .sort((a, b) => a.date.getTime() - b.date.getTime()),
        [employeeAbsences]
    );

    const handleToggleAbsenceDays = async (days: Date[] | undefined) => {
        if (!employee?.id || isSavingAbsence) return;
        const selectedKeys = new Set((days ?? []).map(d => formatFns(d, 'yyyy-MM-dd')));
        const currentKeys = new Map(absenceDates.map(a => [a.key, a.id]));
        const toDelete = [...currentKeys.entries()].filter(([key]) => !selectedKeys.has(key));
        const toAdd = [...selectedKeys].filter(key => !currentKeys.has(key));
        if (toDelete.length === 0 && toAdd.length === 0) return;
        setIsSavingAbsence(true);
        try {
            for (const [, absenceId] of toDelete) {
                await deleteAbsence(absenceId);
            }
            for (const date of toAdd) {
                await addAbsence(employee.id, date);
            }
        } catch {
            toast({ variant: 'destructive', title: t('common.error'), description: t('employee.absenceSaveFailed') });
        } finally {
            setIsSavingAbsence(false);
        }
    };

    const handleRemoveAbsence = async (absenceId: string) => {
        if (isSavingAbsence) return;
        setIsSavingAbsence(true);
        try {
            await deleteAbsence(absenceId);
        } catch {
            toast({ variant: 'destructive', title: t('common.error'), description: t('employee.absenceDeleteFailed') });
        } finally {
            setIsSavingAbsence(false);
        }
    };

    useEffect(() => {
        setFormData(getInitialFormData(employee));
        if (employee?.fullName) {
            // fullName = "Nazwisko Imię": pierwszy wyraz to nazwisko, reszta to imię/imiona
            const { lastName: lName, firstName: fName } = getEmployeeNameParts(employee);
            setFirstName(fName);
            setLastName(lName);
        } else {
            setFirstName('');
            setLastName('');
        }
        setErrors({});
        setStep(0);
    }, [employee]);

    useEffect(() => {
        // Po zmianie kroku przewiń na górę formularza (jeden ekran = jeden krok)
        if (isMobileWizard) topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [step, isMobileWizard]);

    const buildErrors = (): Record<string, string> => {
        const newErrors: Record<string, string> = {};
        if (!firstName.trim()) newErrors.firstName = t('employee.firstNameRequired');
        if (!lastName.trim()) newErrors.lastName = t('employee.lastNameRequired');
        if (!formData.jobTitle) newErrors.jobTitle = t('employee.jobTitleRequired');
        if (!formData.department) newErrors.department = t('employee.departmentRequired');
        if (!formData.manager) newErrors.manager = t('employee.managerRequired');
        if (!formData.cardNumber.trim()) newErrors.cardNumber = t('employee.cardNumberRequired');
        if (!formData.nationality) newErrors.nationality = t('employee.nationalityRequired');
        if (!formData.hireDate) newErrors.hireDate = t('employee.hireDateRequired');
        if (!formData.legalizationStatus || formData.legalizationStatus === 'Brak') newErrors.legalizationStatus = t('employee.legalizationRequired');


        if (formData.vacationStartDate && formData.vacationEndDate) {
            const startDate = parseMaybeDate(formData.vacationStartDate);
            const endDate = parseMaybeDate(formData.vacationEndDate);
            if (startDate && endDate && endDate < startDate) {
                newErrors.vacationEndDate = t('employee.vacationEndBeforeStart');
            }
        }

        return newErrors;
    };

    const validate = () => {
        const newErrors = buildErrors();
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNextStep = () => {
        const newErrors = buildErrors();
        setErrors(newErrors);
        const stepHasErrors = (STEP_FIELDS[step] ?? []).some((f) => newErrors[f]);
        if (!stepHasErrors) setStep((s) => Math.min(s + 1, STEPS.length - 1));
    };
    
    const handleCopyFullName = () => {
        const fullNameForCopy = joinFullName(lastName, firstName);
        if (fullNameForCopy.trim()) {
            navigator.clipboard.writeText(fullNameForCopy.trim());
            toast({
                title: t('employee.copied'),
                description: t('employee.nameCopied'),
            });
        }
    };

    const handleCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const maxSize = 5 * 1024 * 1024; // 5 MB
        if (file.size > maxSize) { toast({ variant: 'destructive', title: t('common.error'), description: t('employee.fileTooLarge') }); return; }
        setIsUploading(true);
        try {
            const empId = employee?.id || `temp_${Date.now()}`;
            let url = '';

            // 1. Przesyłanie przez serwerowe API (/api/certificates) do Firebase Storage
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            uploadFormData.append('empId', empId);
            const res = await fetch('/api/certificates', {
                method: 'POST',
                body: uploadFormData,
            });
            if (res.ok) {
                const data = await res.json();
                url = data.url;
            } else {
                // 2. Fallback: bezpośredni zapis przez klienta Firebase Storage SDK
                const storage = getStorage_();
                if (!storage) throw new Error('Storage nie jest dostępny.');
                const ext = file.name.split('.').pop() || 'jpg';
                const fileRef = storageRef(storage, `certificates/${empId}.${ext}`);
                await uploadBytes(fileRef, file);
                url = await getDownloadURL(fileRef);
            }

            handleChange('certificateUrl', url);
            handleChange('welderLicense', 'Tak');
            toast({ title: t('employee.done'), description: t('employee.certAdded') });
        } catch (err) {
            console.error('Upload error:', err);
            toast({ variant: 'destructive', title: t('common.error'), description: t('employee.uploadFailed') });
        } finally {
            setIsUploading(false);
            if (certInputRef.current) certInputRef.current.value = '';
        }
    };

    const handleCertDelete = async () => {
        if (!formData.certificateUrl) return;
        const currentUrl = formData.certificateUrl;
        try {
            await fetch('/api/certificates', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: currentUrl, empId: employee?.id }),
            }).catch(() => {});
            const storage = getStorage_();
            if (storage && currentUrl.startsWith('http')) {
                const fileRef = storageRef(storage, currentUrl);
                await deleteObject(fileRef).catch(() => { /* ignore if already deleted */ });
            }
        } catch { /* ignore */ }
        handleChange('certificateUrl', undefined);
        toast({ title: t('employee.deleted'), description: t('employee.certDeleted') });
    };

    const handleCertDownload = async () => {
        if (!formData.certificateUrl) return;
        try {
            const res = await fetch(certificateViewUrl(formData.certificateUrl));
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            const localUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = localUrl;
            // Spawacz_Imie_Nazwisko
            const name = `${firstName.trim()}_${lastName.trim()}`.replace(/\s+/g, '_');
            const ext = certificateExt(formData.certificateUrl);
            a.download = `Certyfikat_${name}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(localUrl);
        } catch (err) {
            console.error('Download error:', err);
            toast({ variant: 'destructive', title: t('common.error'), description: t('employee.downloadFailed') });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            const newFullName = joinFullName(lastName, firstName);
            let dataToSave = { ...formData, fullName: newFullName, lastName: lastName.trim().replace(/\s+/g, ' '), firstName: firstName.trim().replace(/\s+/g, ' ') };
            
            onSave({
                ...dataToSave,
                id: employee?.id || '',
                status: employee?.status || 'aktywny',
            });
        }
    };

    const handleChange = (field: keyof typeof formData, value: string | undefined) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const clothingSet = React.useMemo(() => {
        if (!formData.jobTitle || !config.jobTitles || !config.jobTitleClothingSets) return null;
        const jobTitleObj = config.jobTitles.find(jt => jt.name === formData.jobTitle);
        if (!jobTitleObj) return null;
        const set = config.jobTitleClothingSets.find(s => s.id === jobTitleObj.id);
        if (!set?.description) return null;
        return [{ id: 'full-set', name: set.description, quantity: 1 }];
    }, [formData.jobTitle, config.jobTitles, config.jobTitleClothingSets]);

    const handleOpenClothingDialog = () => {
        if (!clothingSet || !onPrintClothing) return;
        const fullName = joinFullName(lastName, firstName);
        const tempEmployee: Employee = {
            ...formData,
            id: employee?.id || 'temp',
            status: employee?.status || 'aktywny',
            fullName,
            lastName: lastName.trim(),
            firstName: firstName.trim(),
        };
        const issuance: ClothingIssuance = {
            id: `print-temp-${Date.now()}`,
            employeeId: tempEmployee.id,
            employeeFullName: fullName,
            date: new Date().toISOString(),
            items: clothingSet,
        };
        onPrintClothing(tempEmployee, issuance);
    };

    const renderError = (field: string) => {
        return errors[field] && <p className="text-xs font-medium text-destructive mt-1">{errors[field]}</p>;
    };

    return (
        <div className="flex min-h-full flex-col relative">
            {/* Quick Actions Header */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/30 p-3 sm:p-4 md:mb-5">
                {employee && (
                    <div className="w-full min-w-0 border-b border-border/60 pb-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('employee.employeeData')}</p>
                        <p className="mt-1 break-words text-lg font-semibold leading-snug text-foreground [overflow-wrap:anywhere]">{employee.fullName}</p>
                        <p className="mt-1 break-words text-sm text-muted-foreground">{employee.department}{employee.jobTitle ? ` · ${employee.jobTitle}` : ''}</p>
                    </div>
                )}
                <div ref={topRef} className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleCopyFullName} className="h-9 gap-2 bg-background/50">
                        <ClipboardCopy className="h-4 w-4" />
                        <span>{t('employee.copyData')}</span>
                    </Button>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={!employee}
                                className={cn(
                                    'h-9 gap-2 bg-background/50',
                                    absenceDates.length > 0 && 'border-destructive/40 text-destructive'
                                )}
                            >
                                <CalendarOff className="h-4 w-4" />
                                <span>{t('employee.absence')}</span>
                                {absenceDates.length > 0 && (
                                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-semibold text-white">
                                        {absenceDates.length}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start" side="bottom">
                            <div className="flex flex-col">
                                <Calendar
                                    mode="multiple"
                                    selected={absenceDates.map(a => a.date)}
                                    onSelect={handleToggleAbsenceDays}
                                    locale={dateLocale}
                                    initialFocus
                                />
                                <div className="border-t p-3 space-y-2">
                                    <p className="text-xs text-muted-foreground">
                                        {t('employee.absenceHint')}
                                    </p>
                                    {absenceDates.length > 0 && (
                                        <div className="space-y-1.5">
                                            <p className="text-xs font-medium">
                                                {t('employee.absenceDays', { count: absenceDates.length })}
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {absenceDates.map(a => (
                                                    <span
                                                        key={a.id}
                                                        className="inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive"
                                                    >
                                                        {formatDate(a.key)}
                                                        <button
                                                            type="button"
                                                            aria-label={t('employee.removeAbsence', { date: formatDate(a.key) })}
                                                            className="rounded-sm hover:bg-destructive/20"
                                                            onClick={() => handleRemoveAbsence(a.id)}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
                {clothingSet && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleOpenClothingDialog}
                        className="h-9 gap-2 bg-background/50"
                    >
                        <Shirt className="h-4 w-4" />
                        <span>{t('employee.issueClothing')}</span>
                    </Button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-grow flex-col">
              {/* Kreator mobilny — wskaźnik postępu */}
              {isMobileWizard && (
                <div className="px-3 sm:px-6 pb-3 sm:pb-4">
                  <p className="text-sm font-semibold text-foreground mb-2">
                    {t('employee.stepOf', { step: step + 1, total: STEPS.length, name: t(STEPS[step]) })}
                  </p>
                  <div className="flex gap-1.5">
                    {STEPS.map((s, i) => (
                      <div
                        key={s}
                        className={cn('h-1.5 flex-1 rounded-full transition-colors', i <= step ? 'bg-primary' : 'bg-muted')}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 items-start gap-3 px-0 pb-6 sm:gap-4 md:grid-cols-2 md:gap-5">

                {/* Panel 1: Dane osobowe */}
                <div className={cn('flex min-w-0 flex-col gap-4 rounded-xl border border-border/70 bg-card p-4 shadow-sm sm:p-5', isMobileWizard && step !== 0 && 'hidden')}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-1 rounded-full bg-primary" />
                      <h3 className="font-semibold text-foreground">{t('employee.stepPersonal')}</h3>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-sm font-medium">{t('employee.lastName')}</Label>
                        <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} className="h-10 transition-all focus:ring-2 focus:ring-primary/20" placeholder={t('employee.lastNamePlaceholder')} />
                        {renderError('lastName')}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-sm font-medium">{t('employee.firstName')}</Label>
                        <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} className="h-10 transition-all focus:ring-2 focus:ring-primary/20" placeholder={t('employee.firstNamePlaceholder')} />
                        {renderError('firstName')}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">{t('employee.nationality')}</Label>
                        <Select value={formData.nationality} onValueChange={value => handleChange('nationality', value)}>
                            <SelectTrigger className="h-10 transition-all">
                                <SelectValue placeholder={t('employee.choose')} />
                            </SelectTrigger>
                            <SelectContent>
                                {nationalities.map(n => <SelectItem key={n.id} value={n.name}>{n.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {renderError('nationality')}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">{t('employee.legalizationStatus')}</Label>
                        <Select value={formData.legalizationStatus || 'Brak'} onValueChange={value => handleChange('legalizationStatus', value)}>
                            <SelectTrigger className="h-10 transition-all">
                                <SelectValue placeholder={t('employee.choose')} />
                            </SelectTrigger>
                            <SelectContent>
                                {legalizationStatuses.map(status => (
                                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {renderError('legalizationStatus')}
                    </div>
                </div>

                {/* Panel 2: Zatrudnienie */}
                <div className={cn('flex min-w-0 flex-col gap-4 rounded-xl border border-border/70 bg-card p-4 shadow-sm sm:p-5', isMobileWizard && step !== 1 && 'hidden')}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-1 rounded-full bg-blue-500" />
                      <h3 className="font-semibold text-foreground">{t('employee.stepEmployment')}</h3>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">{t('employee.department')}</Label>
                        <Select value={formData.department} onValueChange={value => handleChange('department', value)}>
                            <SelectTrigger className="h-10 transition-all">
                                <SelectValue placeholder={t('employee.choose')} />
                            </SelectTrigger>
                            <SelectContent>
                                {departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {renderError('department')}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">{t('employee.jobTitle')}</Label>
                        <Select value={formData.jobTitle} onValueChange={value => handleChange('jobTitle', value)}>
                            <SelectTrigger className="h-10 transition-all">
                                <SelectValue placeholder={t('employee.choose')} />
                            </SelectTrigger>
                            <SelectContent>
                                {jobTitles.map(j => <SelectItem key={j.id} value={j.name}>{j.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {renderError('jobTitle')}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">{t('employee.manager')}</Label>
                        <Select value={formData.manager} onValueChange={value => handleChange('manager', value)}>
                            <SelectTrigger className="h-10 transition-all">
                                <SelectValue placeholder={t('employee.choose')} />
                            </SelectTrigger>
                            <SelectContent>
                                {managers.map(m => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {renderError('manager')}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">{t('employee.hireDate')}</Label>
                        <DatePickerInput
                            value={formData.hireDate}
                            onChange={(date) => handleChange('hireDate', date)}
                            placeholder={t('common.selectDate')}
                        />
                        {renderError('hireDate')}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">{t('employee.welderLicense')}</Label>
                        <Select value={formData.welderLicense} onValueChange={value => handleChange('welderLicense', value)}>
                            <SelectTrigger className="h-10 transition-all">
                                <SelectValue placeholder={t('employee.hasLicence')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Tak">{t('employee.licenceYes')}</SelectItem>
                                <SelectItem value="Nie">{t('employee.licenceNo')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">{t('employee.certScan')}</Label>
                        <input
                            ref={certInputRef}
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={handleCertUpload}
                        />
                        {formData.certificateUrl ? (
                            <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <a
                                        href={certificateViewUrl(formData.certificateUrl)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-1 items-center gap-2 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                                    >
                                        <ImageIcon className="h-5 w-5 text-blue-500 shrink-0" />
                                        <span className="text-sm text-blue-600 underline truncate">{t('employee.open')}</span>
                                    </a>
                                    <Button type="button" variant="outline" className="h-auto px-3 shrink-0" onClick={handleCertDownload} title={t('employee.download')}>
                                        <Download className="h-5 w-5 text-green-600" />
                                    </Button>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => certInputRef.current?.click()} disabled={isUploading}>
                                        <Upload className="mr-2 h-4 w-4" />{t('employee.change')}
                                    </Button>
                                    <Button type="button" variant="destructive" size="sm" onClick={handleCertDelete} disabled={isUploading}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-20 border-dashed flex flex-col gap-1"
                                onClick={() => certInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <><Loader2 className="h-5 w-5 animate-spin" /><span className="text-xs">{t('employee.uploading')}</span></>
                                ) : (
                                    <><Upload className="h-5 w-5" /><span className="text-xs">{t('employee.addCertScan')}</span></>
                                )}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Panel 3: Identyfikacja */}
                <div className={cn('flex min-w-0 flex-col gap-4 rounded-xl border border-border/70 bg-card p-4 shadow-sm sm:p-5', isMobileWizard && step !== 2 && 'hidden')}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-1 rounded-full bg-purple-500" />
                      <h3 className="font-semibold text-foreground">{t('employee.identification')}</h3>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cardNumber" className="text-sm font-medium">{t('employee.cardNumberLong')}</Label>
                        <Input id="cardNumber" value={formData.cardNumber} onChange={e => handleChange('cardNumber', e.target.value)} className="h-10" placeholder="0000" />
                        {renderError('cardNumber')}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lockerNumber" className="text-sm font-medium">{t('employee.mainLocker')}</Label>
                        <Input id="lockerNumber" value={formData.lockerNumber} onChange={e => handleChange('lockerNumber', e.target.value)} className="h-10" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lockerNumber2" className="text-sm font-medium">{t('employee.mainLocker2')}</Label>
                        <Input id="lockerNumber2" value={formData.lockerNumber2 ?? ''} onChange={e => handleChange('lockerNumber2', e.target.value)} className="h-10" placeholder={t('common.optional')} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lockerNumber3" className="text-sm font-medium">{t('employee.mainLocker3')}</Label>
                        <Input id="lockerNumber3" value={formData.lockerNumber3 ?? ''} onChange={e => handleChange('lockerNumber3', e.target.value)} className="h-10" placeholder={t('common.optional')} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="departmentLockerNumber" className="text-sm font-medium">{t('employee.departmentLocker')}</Label>
                        <Input id="departmentLockerNumber" value={formData.departmentLockerNumber} onChange={e => handleChange('departmentLockerNumber', e.target.value)} className="h-10" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sealNumber" className="text-sm font-medium">{t('employee.stampNumber')}</Label>
                        <Input id="sealNumber" value={formData.sealNumber} onChange={e => handleChange('sealNumber', e.target.value)} className="h-10" />
                    </div>
                </div>

                {/* Panel 4: Planowanie — na mobile w trzecim kroku razem z identyfikacją */}
                <div className={cn('flex min-w-0 flex-col gap-4 rounded-xl border border-border/70 bg-card p-4 shadow-sm sm:p-5', isMobileWizard && step !== 2 && 'hidden')}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-1 rounded-full bg-orange-500" />
                      <h3 className="font-semibold text-foreground">{t('employee.planning')}</h3>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">{t('employee.plannedTerminationShort')}</Label>
                        <DatePickerInput value={formData.plannedTerminationDate} onChange={d => handleChange('plannedTerminationDate', d)} placeholder={t('common.selectDate')} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">{t('employee.vacationFrom')}</Label>
                        <DatePickerInput value={formData.vacationStartDate} onChange={d => handleChange('vacationStartDate', d)} placeholder={t('employee.start')} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">{t('employee.vacationTo')}</Label>
                        <DatePickerInput value={formData.vacationEndDate} onChange={d => handleChange('vacationEndDate', d)} placeholder={t('employee.end')} />
                        {renderError('vacationEndDate')}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">{t('employee.terminationDate')}</Label>
                        <DatePickerInput value={formData.terminationDate} onChange={d => handleChange('terminationDate', d)} placeholder={t('common.selectDate')} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">{t('employee.terminationReason')}</Label>
                        <Select
                            value={formData.terminationReason || NO_REASON}
                            onValueChange={value => handleChange('terminationReason', value === NO_REASON ? undefined : value)}
                        >
                            <SelectTrigger className="h-10 transition-all">
                                <SelectValue placeholder={t('employee.chooseReason')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={NO_REASON}>{t('employee.noReason')}</SelectItem>
                                {terminationReasons.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
                                {formData.terminationReason && !terminationReasons.some(r => r.name === formData.terminationReason) && (
                                    <SelectItem value={formData.terminationReason}>{formData.terminationReason}</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    {(employee?.status === 'zwolniony' || formData.terminationDate) ? (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">{t('employee.daysWorked')}</Label>
                            <Input 
                                className="h-10 bg-muted/50 text-muted-foreground cursor-default" 
                                readOnly 
                                value={(() => {
                                    const h = parseMaybeDate(formData.hireDate);
                                    const term = parseMaybeDate(formData.terminationDate);
                                    if (h && term) {
                                        const days = Math.floor((term.getTime() - h.getTime()) / (1000 * 60 * 60 * 24));
                                        return Math.max(0, days).toString();
                                    }
                                    return '';
                                })()} 
                            />
                        </div>
                    ) : null}
                    {isMobile && employee?.status === 'aktywny' && onTerminate && (
                        <Button type="button" variant="outline" onClick={() => onTerminate(employee.id, employee.fullName)} className="mt-2 w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
                            <UserX className="mr-2 h-4 w-4" />
                            {t('employee.terminateEmployee')}
                        </Button>
                    )}
                </div>

              </div>

                {/* Footer Actions */}
                {isMobile ? (
                    <div className="sticky bottom-0 z-10 mt-auto -mx-4 border-t border-border bg-background/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-16px_rgba(0,0,0,0.3)] backdrop-blur-sm">
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={onCancel} className="h-12 flex-1">{t('common.cancel')}</Button>
                            {isMobileWizard && step > 0 && (
                                <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} className="h-12 flex-1">
                                    <ArrowLeft className="mr-1 h-4 w-4" />
                                    {t('common.previous')}
                                </Button>
                            )}
                            {isMobileWizard && step < STEPS.length - 1 ? (
                                <Button type="button" onClick={handleNextStep} className="h-12 flex-1">
                                    {t('common.next')}
                                    <ArrowRight className="ml-1 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button type="submit" disabled={isMobileWizard && !isReadyToSubmit} className="h-12 flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                                    {t('common.save')}
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="sticky bottom-0 z-10 -mx-5 mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-border bg-background px-5 py-4 shadow-[0_-8px_24px_-16px_rgba(0,0,0,0.3)] md:px-6">
                        <div>
                            {employee && employee.status === 'aktywny' && onTerminate && (
                                <Button type="button" variant="ghost" onClick={() => onTerminate(employee.id, employee.fullName)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <UserX className="mr-2 h-4 w-4" />
                                    {t('employee.terminate')}
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-3 ml-auto">
                            <Button type="button" variant="outline" onClick={onCancel} className="h-11 px-6">{t('common.cancel')}</Button>
                            <Button type="submit" className="h-11 px-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                                {t('employee.saveChanges')}
                            </Button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}
