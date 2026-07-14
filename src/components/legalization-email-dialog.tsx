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
import { Trash2, Paperclip } from "lucide-react"

interface LegalizationEmailDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
}

interface Attachment {
  name: string
  type: string
  base64: string
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

  // State for Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([])

  useEffect(() => {
    if (employee && isOpen) {
      setLegalityDept(employee.department || "")
      setLegalityCompany("") // Nie ma w modelu, użytkownik musi wpisać
      setOrderDocs("")
      setOrderDate("")
      setOrderDelivery("odbiór osobisty")
      setActiveTab("wezwanie")
      setAttachments([])
    }
  }, [employee, isOpen])

  const handleTabChange = (val: string) => {
    setActiveTab(val)
    setAttachments([]) // Reset attachments when switching tabs
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const fileList = Array.from(e.target.files)
    
    fileList.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1]
        setAttachments(prev => [
          ...prev,
          {
            name: file.name,
            type: file.type,
            base64: base64String
          }
        ])
      }
      reader.readAsDataURL(file)
    })
    
    e.target.value = '' // Reset input
  }

  const removeFile = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const renderFileSection = () => (
    <div className="space-y-2 mt-4 pt-4 border-t border-border/40">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <Paperclip className="h-3.5 w-3.5 text-primary" />
        <span>Załączniki ({attachments.length})</span>
      </Label>
      <Input 
        type="file" 
        multiple 
        onChange={handleFileChange} 
        className="h-10 text-xs cursor-pointer file:cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
      />
      {attachments.length > 0 && (
        <div className="mt-2 space-y-1 bg-muted/40 p-2 rounded-md border border-border/50 max-h-32 overflow-y-auto custom-scrollbar">
          {attachments.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-muted transition-colors">
              <span className="truncate max-w-[80%] font-medium" title={file.name}>{file.name}</span>
              <Button type="button" variant="ghost" size="icon" className="h-5 w-5 text-destructive hover:bg-destructive/10" onClick={() => removeFile(idx)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const handleGenerateEmail = () => {
    if (!employee) return

    let subject = ""
    let body = ""

    if (activeTab === "wezwanie") {
      subject = "WEZWANIE"
      body = `Dotyczy pracownika: ${employee.fullName}\n\nPracownik otrzymał wezwanie z urzędu do uzupełnienia braków formalnych.`
      if (attachments.length === 0) {
        body += `\n\n(Pamiętaj, aby załączyć skan całego wezwania, na którym widoczna jest data jego doręczenia!)`
      }
    } else if (activeTab === "zamowienie") {
      subject = "ZAMÓWIENIE"
      body = `Imię i nazwisko: ${employee.fullName}\nNazwa zamawianych dokumentów: ${orderDocs}\nTermin do którego dokumenty są niezbędne: ${orderDate}\nSposób odbioru: ${orderDelivery}`
    } else if (activeTab === "legalnosc") {
      subject = "LEGALNOŚĆ"
      body = `Imię i nazwisko: ${employee.fullName}\nAktualny zakład: ${legalityDept}\nSpółka: ${legalityCompany}\nDotyczy zatrudnienia: ${legalityStatus}`
    }

    if (attachments.length > 0) {
      // EML flow with attachments
      const boundary = "----=_Part_" + Math.random().toString(36).substring(2, 11)
      let eml = ""
      eml += `To: legalizacja@legalife.pl\n`
      eml += `Subject: ${subject}\n`
      eml += `X-Unsent: 1\n`
      eml += `MIME-Version: 1.0\n`
      eml += `Content-Type: multipart/mixed; boundary="${boundary}"\n\n`

      // Body
      eml += `--${boundary}\n`
      eml += `Content-Type: text/plain; charset="utf-8"\n`
      eml += `Content-Transfer-Encoding: 7bit\n\n`
      eml += `${body}\n\n`

      // Attachments
      for (const file of attachments) {
        eml += `--${boundary}\n`
        eml += `Content-Type: ${file.type || 'application/octet-stream'}; name="${file.name}"\n`
        eml += `Content-Transfer-Encoding: base64\n`
        eml += `Content-Disposition: attachment; filename="${file.name}"\n\n`
        
        const base64Lines = file.base64.match(/.{1,76}/g) || []
        eml += base64Lines.join('\n') + '\n\n'
      }

      eml += `--${boundary}--`

      const blob = new Blob([eml], { type: "message/rfc822" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${subject}_${employee.fullName.replace(/\s+/g, '_')}.eml`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Wygenerowano plik wiadomości (.eml)!",
        description: "Otwórz go, aby wyświetlić w Outlooku e-mail z załącznikami.",
      })
    } else {
      // Standard mailto flow
      const mailtoLink = "mailto:legalizacja@legalife.pl?subject=" + encodeURIComponent(subject)
      
      navigator.clipboard.writeText(body).then(() => {
        toast({
          title: "Treść skopiowana!",
          description: "Wklej ją za pomocą Ctrl + V w oknie Outlooka, aby zachować swoją stopkę z logo.",
        })
        window.location.href = mailtoLink
      }).catch((err) => {
        console.error("Failed to copy to clipboard", err)
        const fallbackLink = "mailto:legalizacja@legalife.pl?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body)
        window.location.href = fallbackLink
      })
    }

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

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full mt-4">
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
                  <li>Upewnij się, że na skanie widoczna jest <strong>data jego doręczenia</strong>.</li>
                  <li>Dodaj załącznik poniżej, aby został osadzony w wiadomości.</li>
                </ul>
              </div>
              {renderFileSection()}
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
              {renderFileSection()}
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
              {renderFileSection()}
            </TabsContent>
          </div>
        </Tabs>

        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg my-2 border">
          💡 <strong>Wskazówka:</strong> Gdy dodasz załączniki, system pobierze plik <strong>.eml</strong>, który otworzy się bezpośrednio w Outlooku z gotowymi załącznikami. Bez załączników treść jest kopiowana do schowka.
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Anuluj</Button>
          <Button onClick={handleGenerateEmail}>
            {attachments.length > 0 ? "Wygeneruj .eml" : "Otwórz e-mail"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
