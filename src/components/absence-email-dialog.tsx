"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { format as formatFns } from "date-fns"
import { pl } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Employee } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { DateRange } from "react-day-picker"

interface AbsenceEmailDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
}

export function AbsenceEmailDialog({ isOpen, onOpenChange, employee }: AbsenceEmailDialogProps) {
  const { toast } = useToast()
  const [mode, setMode] = useState<"range" | "multiple">("range")
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date()
  })
  const [multipleDates, setMultipleDates] = useState<Date[] | undefined>([new Date()])

  useEffect(() => {
    if (isOpen) {
      setRange({ from: new Date(), to: new Date() })
      setMultipleDates([new Date()])
      setMode("range")
    }
  }, [isOpen])

  const getAbsenceDateString = () => {
    if (mode === "range") {
      if (!range) return ""
      if (range.from && !range.to) {
        return formatFns(range.from, "dd.MM.yyyy")
      }
      if (range.from && range.to) {
        return `${formatFns(range.from, "dd.MM.yyyy")} - ${formatFns(range.to, "dd.MM.yyyy")}`
      }
      return ""
    } else {
      if (!multipleDates || multipleDates.length === 0) return ""
      const sorted = [...multipleDates].sort((a, b) => a.getTime() - b.getTime())
      return sorted.map(d => formatFns(d, "dd.MM.yyyy")).join(", ")
    }
  }

  const handleGenerateEmail = () => {
    if (!employee) return

    const dateStr = getAbsenceDateString()
    if (!dateStr) {
      toast({
        title: "Błąd",
        description: "Wybierz datę lub zakres nieobecności w kalendarzu.",
        variant: "destructive"
      })
      return
    }

    const subject = `Nieobecność ${dateStr}`
    
    // Polish body for the client
    const body = `Dzień dobry,\n\nInformujemy o nieobecności pracownika:\nImię i nazwisko: ${employee.fullName}\nDział: ${employee.department || "-"}\nData nieobecności: ${dateStr}\n\nZ poważaniem,\n`

    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    
    // Copy to clipboard just in case, but open the fully populated link immediately
    navigator.clipboard.writeText(body).catch(err => console.error("Failed to copy to clipboard", err))
    
    window.location.href = mailtoLink

    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Zgłoszenie Nieobecności</DialogTitle>
          <DialogDescription>
            Wygeneruj powiadomienie o nieobecności pracownika: <span className="font-semibold text-foreground">{employee?.fullName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4 py-2">
          {/* Mode Switcher */}
          <div className="flex bg-muted p-1 rounded-lg">
            <button
              onClick={() => setMode("range")}
              className={cn(
                "flex-1 text-xs font-medium py-1.5 rounded-md transition-all",
                mode === "range" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Przedział dat (Od - Do)
            </button>
            <button
              onClick={() => setMode("multiple")}
              className={cn(
                "flex-1 text-xs font-medium py-1.5 rounded-md transition-all",
                mode === "multiple" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Dowolne wybrane dni
            </button>
          </div>

          {/* Calendar Box */}
          <div className="border rounded-md p-1.5 flex justify-center bg-card">
            {mode === "range" ? (
              <Calendar
                mode="range"
                selected={range}
                onSelect={setRange}
                locale={pl}
                className="w-full flex justify-center"
              />
            ) : (
              <Calendar
                mode="multiple"
                selected={multipleDates}
                onSelect={setMultipleDates}
                locale={pl}
                className="w-full flex justify-center"
              />
            )}
          </div>

          {/* Selected Dates Display */}
          <div className="space-y-1.5 bg-muted/40 p-3 rounded-md border border-border/50">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
              Wybrany okres / daty:
            </span>
            <span className="text-xs font-medium block break-all text-foreground min-h-[16px]">
              {getAbsenceDateString() || <span className="text-muted-foreground italic">Wybierz dni w kalendarzu powyżej</span>}
            </span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg border">
          💡 <strong>Wskazówka:</strong> Kliknij "Otwórz e-mail", aby automatycznie wygenerować treść. Jeśli Outlook usunie Twój podpis, możesz dodać go ręcznie.
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Anuluj</Button>
          <Button onClick={handleGenerateEmail} disabled={!getAbsenceDateString()}>
            Otwórz e-mail
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
