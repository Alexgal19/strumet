"use client";

import { cloneElement } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Employee } from "@/lib/types";
import { formatDate } from "@/lib/date";
import { User, Briefcase, Building2, Calendar, CreditCard, Globe, ShieldCheck, DoorOpen, Fingerprint, Tag } from "lucide-react";

interface EmployeeSummaryProps {
  employee: Employee;
  children: React.ReactElement;
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
      <div className="mt-0.5 text-muted-foreground shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export function EmployeeSummary({ employee, children }: EmployeeSummaryProps) {
  const handleTriggerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const menuItem = target.closest('[role="menuitem"]');
    if (menuItem && menuItem.textContent?.includes('Generuj podsumowanie')) {
      e.preventDefault();
    }
  };

  const contractEndFormatted = employee.contractEndDate
    ? formatDate(employee.contractEndDate, 'dd.MM.yyyy')
    : null;

  const hireDateFormatted = employee.hireDate
    ? formatDate(employee.hireDate, 'dd.MM.yyyy')
    : null;

  const isContractExpiringSoon = (() => {
    if (!employee.contractEndDate) return false;
    const end = new Date(employee.contractEndDate);
    const today = new Date();
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 30;
  })();

  return (
    <Dialog>
      <DialogTrigger asChild>
        {cloneElement(children, { onClick: handleTriggerClick, onSelect: handleTriggerClick })}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {employee.fullName}
          </DialogTitle>
          <DialogDescription>
            Podsumowanie danych pracownika
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-0 py-2">
          <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Stanowisko" value={employee.jobTitle} />
          <InfoRow icon={<Building2 className="h-4 w-4" />} label="Dział" value={employee.department} />
          <InfoRow icon={<User className="h-4 w-4" />} label="Kierownik" value={employee.manager} />
          <InfoRow icon={<Globe className="h-4 w-4" />} label="Narodowość" value={employee.nationality} />
          <InfoRow icon={<Calendar className="h-4 w-4" />} label="Data zatrudnienia" value={hireDateFormatted} />
          <div className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
            <div className="mt-0.5 text-muted-foreground shrink-0"><Calendar className="h-4 w-4" /></div>
            <div className="flex items-center gap-2 flex-wrap">
              <div>
                <p className="text-xs text-muted-foreground">Umowa do</p>
                <p className="text-sm font-medium">{contractEndFormatted || '—'}</p>
              </div>
              {isContractExpiringSoon && contractEndFormatted && (
                <Badge variant="destructive" className="text-xs">Wygasa wkrótce</Badge>
              )}
            </div>
          </div>
          <InfoRow icon={<ShieldCheck className="h-4 w-4" />} label="Status legalizacyjny" value={employee.legalizationStatus} />
          <InfoRow icon={<CreditCard className="h-4 w-4" />} label="Nr karty" value={employee.cardNumber} />
          <InfoRow icon={<DoorOpen className="h-4 w-4" />} label="Nr szafki" value={employee.lockerNumber} />
          <InfoRow icon={<DoorOpen className="h-4 w-4" />} label="Nr szafki w dziale" value={employee.departmentLockerNumber} />
          <InfoRow icon={<Tag className="h-4 w-4" />} label="Nr pieczęci" value={employee.sealNumber} />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Zamknij</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
