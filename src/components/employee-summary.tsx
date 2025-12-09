
"use client";

import { useState, cloneElement } from "react";
import { generateEmployeeSummary } from "@/ai/flows/generate-employee-summary";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Employee } from "@/lib/types";

interface EmployeeSummaryProps {
  employee: Employee;
  children: React.ReactElement;
}

export function EmployeeSummary({ employee, children }: EmployeeSummaryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateSummary = async () => {
    setLoading(true);
    setError(null);
    setSummary("");
    try {
      const result = await generateEmployeeSummary({
        fullName: employee.fullName,
        hireDate: employee.hireDate,
        jobTitle: employee.jobTitle,
        department: employee.department,
        manager: employee.manager,
        cardId: employee.cardNumber,
        nationality: employee.nationality,
        lockerNumber: employee.lockerNumber,
        departmentLockerNumber: employee.departmentLockerNumber,
        sealNumber: employee.sealNumber,
        contractEndDate: employee.contractEndDate,
        legalizationStatus: employee.legalizationStatus,
      });
      setSummary(result.summary);
    } catch (e) {
      setError("Nie udało się wygenerować podsumowania. Spróbuj ponownie.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSummary("");
      setError(null);
      setLoading(false);
    }
  }

  const handleTriggerClick = (e: React.MouseEvent) => {
    // We find the menu item for summary generation and trigger the dialog
    const target = e.target as HTMLElement;
    const menuItem = target.closest('[role="menuitem"]');
    if (menuItem && menuItem.textContent?.includes('Generuj podsumowanie')) {
      e.preventDefault();
      setIsOpen(true);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {cloneElement(children, { onClick: handleTriggerClick, onSelect: handleTriggerClick })}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Podsumowanie pracownika</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <p className="font-semibold">{employee.fullName}</p>
            {loading && (
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Błąd</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {summary && (
                <div className="prose prose-sm max-w-none rounded-md border bg-muted/50 p-4">
                    <p>{summary}</p>
                </div>
            )}
        </div>
        <DialogFooter className="sm:justify-between gap-2">
            <DialogClose asChild>
                <Button type="button" variant="secondary">Zamknij</Button>
            </DialogClose>
            <Button onClick={handleGenerateSummary} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {summary ? 'Generuj ponownie' : 'Generuj podsumowanie'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
