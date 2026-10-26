'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { EmployeeForm } from '@/components/employee-form';
import type { AllConfig, Employee } from '@/lib/types';

export function EmployeeEditOverlay({
  isMobile,
  open,
  onOpenChange,
  employee,
  onSave,
  onTerminate,
  config,
}: {
  isMobile: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onSave: (employeeData: Employee) => Promise<void> | void;
  onTerminate: (id: string, fullName: string) => Promise<void> | void;
  config: AllConfig;
}) {
  return isMobile ? (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92dvh] p-0 flex flex-col rounded-t-3xl bg-background [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <SheetHeader className="p-4 border-b bg-background/80 shrink-0 text-left">
          <SheetTitle className="text-xl font-bold tracking-tight">Edytuj pracownika</SheetTitle>
        </SheetHeader>
        <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
          <EmployeeForm
            employee={employee}
            onSave={onSave}
            onCancel={() => onOpenChange(false)}
            onTerminate={onTerminate}
            config={config}
          />
        </div>
      </SheetContent>
    </Sheet>
  ) : (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-[calc(100vw-1rem)] sm:max-w-5xl max-h-[90dvh] flex flex-col"
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edytuj pracownika</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto -mr-6 pr-6">
          <EmployeeForm
            employee={employee}
            onSave={onSave}
            onCancel={() => onOpenChange(false)}
            onTerminate={onTerminate}
            config={config}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
