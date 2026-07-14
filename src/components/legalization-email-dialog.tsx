"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Employee } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface LegalizationEmailDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
}

export function LegalizationEmailDialog({ isOpen, onOpenChange, employee }: LegalizationEmailDialogProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("wezwanie")

  // State for ZAMÓWIENIE
  const [orderDocs, setOrderDocs] = useState("")
  const [orderDate, setOrderDate] = useState("")
  const [orderDelivery, setOrderDelivery] = useState("odbiór osobisty")

  // State for LEGALNOŚĆ
  const [legalityDept, setLegalityDept] = useState("")
  const [legalityCompany, setLegalityCompany] = useState("")
  const [legalityStatus, setLegalityStatus] = useState("Aktualne")

  useEffect(() => {
    if (employee && isOpen) {
      setLegalityDept(employee.department || "")
      setLegalityCompany("") // Nie ma w modelu, użytkownik musi wpisać
      setOrderDocs("")
      setOrderDate("")
      setOrderDelivery("odbiór osobisty")
      setActiveTab("wezwanie")
    }
  }, [employee, isOpen])

  const handleGenerateEmail = () => {
    if (!employee) return

    let subject = ""
    let body = ""

    if (activeTab === "wezwanie") {
      subject = "WEZWANIE"
      body = `Dotyczy pracownika: ${employee.fullName}\n\nPracownik otrzymał wezwanie z urzędu do uzupełnienia braków formalnych.\n\n(Pamiętaj, aby załączyć skan całego wezwania, na którym widoczna jest data jego doręczenia!)`
    } else if (activeTab === "zamowienie") {
      subject = "ZAMÓWIENIE"
      body = `Imię i nazwisko: ${employee.fullName}\nNazwa zamawianych dokumentów: ${orderDocs}\nTermin do którego dokumenty są niezbędne: ${orderDate}\nSposób odbioru: ${orderDelivery}`
    } else if (activeTab === "legalnosc") {
      subject = "LEGALNOŚĆ"
      body = `Imię i nazwisko: ${employee.fullName}\nAktualny zakład: ${legalityDept}\nSpółka: ${legalityCompany}\nDotyczy zatrudnienia: ${legalityStatus}`
    }

    const mailtoLink = "mailto:legalizacja@legalife.pl?subject=" + encodeURIComponent(subject)
    
    navigator.clipboard.writeText(body).then(() => {
      toast({
        title: "Treść skopiowana!",
        description: "Wklej ją za pomocą Ctrl + V w oknie Outlooka, aby zachować swoją stopkę z logo.",
      })
      window.location.href = mailtoLink
    }).catch((err) => {
      console.error("Failed to copy to clipboard", err)
      // Fallback w razie problemów ze schowkiem - otwieramy z treścią
      const fallbackLink = "mailto:legalizacja@legalife.pl?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body)
      window.location.href = fallbackLink
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Wniosek do Działu Legalizacji</DialogTitle>
          <DialogDescription>
            Wygeneruj e-mail do działu legalizacji dla pracownika: {employee?.fullName}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="wezwanie">WEZWANIE</TabsTrigger>
            <TabsTrigger value="zamowienie">ZAMÓWIENIE</TabsTrigger>
            <TabsTrigger value="legalnosc">LEGALNOŚĆ</TabsTrigger>
          </TabsList>
          
          <div className="py-4">
            <TabsContent value="wezwanie" className="space-y-4">
              <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                <p className="font-semibold mb-2">Wymagane kroki:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Dołącz skan całego wezwania w kliencie poczty.</li>
                  <li>Upewnij się, że na skanie widoczna jest <strong>data jego doręczenia</strong>.</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="zamowienie" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orderDocs">Nazwa zamawianych dokumentów</Label>
                <Input 
                  id="orderDocs" 
                  placeholder="np. załącznik nr 1, ZUS, zaświadczenie" 
                  value={orderDocs} 
                  onChange={(e) => setOrderDocs(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orderDate">Termin do którego są niezbędne</Label>
                <Input 
                  id="orderDate" 
                  type="date" 
                  value={orderDate} 
                  onChange={(e) => setOrderDate(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>Sposób odbioru</Label>
                <Select value={orderDelivery} onValueChange={setOrderDelivery}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="odbiór osobisty">Odbiór osobisty</SelectItem>
                    <SelectItem value="przekazanie przez kogoś">Przekazanie przez kogoś</SelectItem>
                    <SelectItem value="wysyłka InPost">Wysyłka InPost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="legalnosc" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="legalityDept">Aktualny zakład</Label>
                <Input 
                  id="legalityDept" 
                  value={legalityDept} 
                  onChange={(e) => setLegalityDept(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legalityCompany">Spółka</Label>
                <Input 
                  id="legalityCompany" 
                  placeholder="np. Strumet Sp. z o.o." 
                  value={legalityCompany} 
                  onChange={(e) => setLegalityCompany(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>Dotyczy zatrudnienia</Label>
                <Select value={legalityStatus} onValueChange={setLegalityStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aktualne">Aktualne</SelectItem>
                    <SelectItem value="Poprzednie">Poprzednie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200 mt-4">
                <p className="font-semibold mb-2">Pamiętaj o załączniku!</p>
                <p>Dołącz np. decyzje, żółte karteczki, paszport ze stemplem, UPO, wnioski.</p>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg my-2 border">
          💡 <strong>Wskazówka:</strong> Treść e-maila zostanie automatycznie skopiowana. Wklej ją za pomocą <strong>Ctrl + V</strong> w nowo otwartym oknie poczty, aby zachować stopkę z logo.
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Anuluj</Button>
          <Button onClick={handleGenerateEmail}>Otwórz e-mail</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
