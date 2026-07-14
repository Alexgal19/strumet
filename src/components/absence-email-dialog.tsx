"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Calendar as CalendarIcon } from "lucide-react"
import { format as formatFns } from "date-fns"
import { pl } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { formatDate, parseMaybeDate } from "@/lib/date"
import { Employee } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface AbsenceEmailDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
}

const DatePickerInput = ({ value, onChange, placeholder }: { value?: string, onChange: (date?: string) => void, placeholder: string }) => {
    const dateValue = parseMaybeDate(value);
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal h-11 transition-all", !dateValue && "text-muted-foreground")}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateValue ? formatDate(dateValue, "PPP") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 flex flex-col" align="start">
                <Calendar
                    mode="single"
                    selected={dateValue || undefined}
                    onSelect={(date) => onChange(date ? formatFns(date, 'yyyy-MM-dd') : undefined)}
                    locale={pl}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
};

export function AbsenceEmailDialog({ isOpen, onOpenChange, employee }: AbsenceEmailDialogProps) {
  const { toast } = useToast()
  const [absenceDate, setAbsenceDate] = useState(formatFns(new Date(), 'yyyy-MM-dd'))

  useEffect(() => {
    if (isOpen) {
      setAbsenceDate(formatFns(new Date(), 'yyyy-MM-dd'))
    }
  }, [isOpen])

  const handleGenerateEmail = () => {
    if (!employee) return

    const formattedDate = formatDate(absenceDate, "dd.MM.yyyy")
    const subject = `Nieobecność ${formattedDate}`
    
    // Polish body for the client
    const body = `Dzień dobry,\n\nInformujemy o nieobecności pracownika:\nImię i nazwisko: ${employee.fullName}\nDział: ${employee.department || "-"}\nData nieobecności: ${formattedDate}\n\nZ poważaniem,\n`

    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}`
    
    navigator.clipboard.writeText(body).then(() => {
      toast({
        title: "Treść skopiowana!",
        description: "Wklej ją za pomocą Ctrl + V w oknie Outlooka, aby zachować swoją stopkę z logo.",
      })
      window.location.href = mailtoLink
    }).catch((err) => {
      console.error("Failed to copy to clipboard", err)
      const fallbackLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      window.location.href = fallbackLink
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Zgłoszenie Nieobecności</DialogTitle>
          <DialogDescription>
            Wygeneruj powiadomienie o nieobecności pracownika: <span className="font-semibold text-foreground">{employee?.fullName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Data nieobecności</Label>
            <DatePickerInput
              value={absenceDate}
              onChange={(date) => date && setAbsenceDate(date)}
              placeholder="Wybierz datę nieobecności"
            />
          </div>
        </div>

        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg border">
          💡 <strong>Wskazówka:</strong> Treść powiadomienia zostanie skopiowana do schowka. Wklej ją (Ctrl + V) w Outlooku, aby zachować swój podpis z logo.
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Anuluj</Button>
          <Button onClick={handleGenerateEmail}>Otwórz e-mail</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
