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

import { t, rich } from '@/lib/i18n';
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
      setLegalityDept("Strumet")
      setLegalityCompany("SWL")
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
      subject = t('dialogs.summons')
      body = `Dotyczy pracownika: ${employee.fullName}\n\nPracownik otrzymał wezwanie z urzędu do uzupełnienia braków formalnych.\n\n(Pamiętaj, aby załączyć skan całego wezwania, na którym widoczna jest data jego doręczenia!)`
    } else if (activeTab === "zamowienie") {
      subject = t('dialogs.order')
      body = `Imię i nazwisko: ${employee.fullName}\nNazwa zamawianych dokumentów: ${orderDocs}\nTermin do którego dokumenty są niezbędne: ${orderDate}\nSposób odbioru: ${orderDelivery}`
    } else if (activeTab === "legalnosc") {
      subject = t('dialogs.legality')
      body = `Imię i nazwisko: ${employee.fullName}\nAktualny zakład: ${legalityDept}\nSpółka: ${legalityCompany}\nDotyczy zatrudnienia: ${legalityStatus}`
    }

    const mailtoLink = "mailto:legalizacja@legalife.pl?subject=" + encodeURIComponent(subject)
    
    navigator.clipboard.writeText(body).then(() => {
      toast({
        title: t('dialogs.textCopied'),
        description: t('dialogs.pasteItWithCtrlV'),
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
          <DialogTitle>{t('dialogs.requestToTheLegalisationDepartment')}</DialogTitle>
          <DialogDescription>
            {t('dialogs.generateAnEmailToThe', { name: employee?.fullName ?? '' })}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="wezwanie">{t('dialogs.summons')}</TabsTrigger>
            <TabsTrigger value="zamowienie">{t('dialogs.order')}</TabsTrigger>
            <TabsTrigger value="legalnosc">{t('dialogs.legality')}</TabsTrigger>
          </TabsList>
          
          <div className="py-4">
            <TabsContent value="wezwanie" className="space-y-4">
              <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                <p className="font-semibold mb-2">{t('dialogs.requiredSteps')}</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>{t('dialogs.attachAScanOfThe')}</li>
                  <li>{rich(t('dialogs.makeSureTheScanShows'), { date: <strong>{t('dialogs.itsDeliveryDate')}</strong> })}</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="zamowienie" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orderDocs">{t('dialogs.documentsToOrder')}</Label>
                <Input 
                  id="orderDocs" 
                  placeholder="np. załącznik nr 1, ZUS, zaświadczenie" 
                  value={orderDocs} 
                  onChange={(e) => setOrderDocs(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orderDate">{t('dialogs.neededBy')}</Label>
                <Input 
                  id="orderDate" 
                  type="date" 
                  value={orderDate} 
                  onChange={(e) => setOrderDate(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>{t('dialogs.collectionMethod')}</Label>
                <Select value={orderDelivery} onValueChange={setOrderDelivery}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="odbiór osobisty">{t('dialogs.inPersonCollection')}</SelectItem>
                    <SelectItem value="przekazanie przez kogoś">{t('dialogs.handedOverBySomeone')}</SelectItem>
                    <SelectItem value="wysyłka InPost">{t('dialogs.inpostDelivery')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="legalnosc" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="legalityDept">{t('dialogs.currentPlant')}</Label>
                <Input 
                  id="legalityDept" 
                  value={legalityDept} 
                  onChange={(e) => setLegalityDept(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legalityCompany">{t('dialogs.company')}</Label>
                <Input 
                  id="legalityCompany" 
                  placeholder="np. Strumet Sp. z o.o." 
                  value={legalityCompany} 
                  onChange={(e) => setLegalityCompany(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>{t('dialogs.employment')}</Label>
                <Select value={legalityStatus} onValueChange={setLegalityStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aktualne">{t('dialogs.current')}</SelectItem>
                    <SelectItem value="Poprzednie">{t('dialogs.previous')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200 mt-4">
                <p className="font-semibold mb-2">{t('dialogs.rememberTheAttachment')}</p>
                <p>{t('dialogs.attachEGDecisionsYellow')}</p>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg my-2 border">
          💡 <strong>{t('dialogs.tip')}</strong> {rich(t('dialogs.theEmailTextWillBe'), { keys: <strong>Ctrl + V</strong> })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('dialogs.cancel')}</Button>
          <Button onClick={handleGenerateEmail}>{t('dialogs.openEmail')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
