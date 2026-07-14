"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { format as formatFns } from "date-fns"
import { pl } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Employee } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { DateRange } from "react-day-picker"
import { Send, Loader2 } from "lucide-react"

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
  const [recipientEmail, setRecipientEmail] = useState("")
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setRange({ from: new Date(), to: new Date() })
      setMultipleDates([new Date()])
      setMode("range")
      setRecipientEmail("")
      setIsSending(false)
    }
  }, [isOpen])

  const getAbsenceDateString = () => {
    if (mode === "range") {
      if (!range) return ""
      if (range.from && !range.to) {
        return formatFns(range.from, "dd.MM.yyyy")
      }
      if (range.from && range.to) {
        if (range.from.getTime() === range.to.getTime()) {
          return formatFns(range.from, "dd.MM.yyyy")
        }
        return `${formatFns(range.from, "dd.MM.yyyy")} - ${formatFns(range.to, "dd.MM.yyyy")}`
      }
      return ""
    } else {
      if (!multipleDates || multipleDates.length === 0) return ""
      const sorted = [...multipleDates].sort((a, b) => a.getTime() - b.getTime())
      return sorted.map(d => formatFns(d, "dd.MM.yyyy")).join(", ")
    }
  }

  const handleSendEmail = async () => {
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

    if (!recipientEmail || !recipientEmail.includes("@")) {
      toast({
        title: "Błąd",
        description: "Wpisz poprawny adres e-mail odbiorcy.",
        variant: "destructive"
      })
      return
    }

    setIsSending(true)

    try {
      const response = await fetch("/api/send-absence-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail,
          subject: `Nieobecność ${dateStr}`,
          employeeName: employee.fullName,
          department: employee.department || "-",
          absenceDates: dateStr,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "✅ E-mail wysłany!",
          description: `Powiadomienie o nieobecności wysłane do ${recipientEmail}.`,
        })
        onOpenChange(false)
      } else {
        toast({
          title: "Błąd wysyłki",
          description: result.message || "Nie udało się wysłać e-maila.",
          variant: "destructive"
        })
      }
    } catch (err) {
      console.error("Send absence email error:", err)
      toast({
        title: "Błąd",
        description: "Wystąpił problem z połączeniem. Spróbuj ponownie.",
        variant: "destructive"
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Zgłoszenie Nieobecności</DialogTitle>
          <DialogDescription>
            Wyślij powiadomienie o nieobecności pracownika: <span className="font-semibold text-foreground">{employee?.fullName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4 py-2">
          {/* Recipient Email */}
          <div className="space-y-2">
            <Label htmlFor="recipientAbsenceEmail">E-mail odbiorcy (klienta)</Label>
            <Input
              id="recipientAbsenceEmail"
              type="email"
              placeholder="np. klient@firma.pl"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="h-11"
            />
          </div>

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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>Anuluj</Button>
          <Button
            onClick={handleSendEmail}
            disabled={!getAbsenceDateString() || !recipientEmail || isSending}
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wysyłanie...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Wyślij e-mail
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
