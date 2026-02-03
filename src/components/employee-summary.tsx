"use client";

import { useState, cloneElement } from "react";
import { generateEmployeeSummary, type GenerateEmployeeSummaryInput } from "@/ai/flows/generate-employee-summary";
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
import { Loader2, List, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Employee } from "@/lib/types";

interface EmployeeSummaryProps {
  employee: Employee;
  children: React.ReactElement;
}

export function EmployeeSummary({ employee, children }: EmployeeSummaryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateSummary = async () => {
    setLoading(true);
    setError(null);
    setSummary(null);
    setKeyPoints([]);

    try {
      const inputData: GenerateEmployeeSummaryInput = {
        id: employee.id,
        fullName: employee.fullName,
        hireDate: employee.hireDate,
        jobTitle: employee.jobTitle,
        department: employee.department,
        manager: employee.manager,
        cardNumber: employee.cardNumber,
        nationality: employee.nationality,
        lockerNumber: employee.lockerNumber,
        departmentLockerNumber: employee.departmentLockerNumber,
        sealNumber: employee.sealNumber,
        contractEndDate: employee.contractEndDate,
        legalizationStatus: employee.legalizationStatus,
      };

      const result = await generateEmployeeSummary(inputData);

      setSummary(result.summary);
      setKeyPoints(result.keyPoints);

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
      setSummary(null);
      setKeyPoints([]);
      setError(null);
      setLoading(false);
    }
  }

  const handleTriggerClick = (e: React.MouseEvent) => {
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Podsumowanie pracownika</DialogTitle>
           <DialogDescription>
            Wygenerowane przez AI podsumowanie kluczowych informacji.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 min-h-[15rem] flex flex-col">
            <p className="font-semibold text-lg">{employee.fullName}</p>
            {loading && (
                <div className="flex flex-1 items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
            {error && (
                <Alert variant="destructive" className="flex-1">
                    <AlertTitle>Błąd</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {summary && (
                <div className="flex-1 space-y-4">
                  <div className="prose prose-sm max-w-none rounded-lg border bg-background p-4">
                      <p>{summary}</p>
                  </div>
                   {keyPoints.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><List className="h-4 w-4"/> Kluczowe punkty:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {keyPoints.map((point, index) => (
                            <li key={index}>{point}</li>
                          ))}
                        </ul>
                      </div>
                   )}
                </div>
            )}
        </div>
        <DialogFooter className="sm:justify-between gap-2">
            <DialogClose asChild>
                <Button type="button" variant="secondary">Zamknij</Button>
            </DialogClose>
            <Button onClick={handleGenerateSummary} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                {summary ? 'Generuj ponownie' : 'Generuj podsumowanie'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
