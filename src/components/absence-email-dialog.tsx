"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatDate } from "@/lib/date"
import { Employee } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface AbsenceEmailDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
}

export function AbsenceEmailDialog({ isOpen, onOpenChange, employee }: AbsenceEmailDialogProps) {
  const { toast } = useToast()
  const [absenceDate, setAbsenceDate] = useState("")

  useEffect(() => {
    if (isOpen) {
      setAbsenceDate(formatDate(new Date(), 'dd.MM.yyyy'))
    }
  }, [isOpen])

  const handleGenerateEmail = () => {
    if (!employee) return

    const subject = `Nieobecność ${absenceDate}`
    
    // Polish body for the client
    const body = `Dzień dobry,\n\nInformujemy o nieobecności pracownika:\nImię i nazwisko: ${employee.fullName}\nDział: ${employee.department || "-"}\nData nieobecności: ${absenceDate}\n\nZ poważaniem,\n`

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
            <Label htmlFor="absenceDateInput">Okres / Data nieobecności</Label>
            <Input
              id="absenceDateInput"
              type="text"
              value={absenceDate}
              onChange={(e) => setAbsenceDate(e.target.value)}
              placeholder="np. 14.07.2026 lub 14.07 - 18.07 lub 14, 16.07"
              className="h-11"
            />
            <p className="text-[11px] text-muted-foreground">
              Możesz wpisać jedną datę, przedział (np. 14.07 - 18.07) lub dowolne wybrane dni.
            </p>
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
