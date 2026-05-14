# Email Templates — SPEC.md

## 1. Problem / Cel

HR-команда вручну відправляє email-нагадування про закінчення контрактів, медогляди, відпустки. Потрібно:
- Зберігати шаблони в RTDB (редагування через UI)
- Автоматизувати відправку по тригерах
- Логувати всі відправлені листи

---

## 2. RTDB Schema

```json
{
  "emailTemplates": {
    "<templateId>": {
      "name": "string",
      "subject": "string",
      "body": "string (markdown)",
      "triggerType": "scheduled | manual | event",
      "triggerConfig": {
        "event": "contractExpiry | fingerprintReminder | newHire | plannedTermination | legalisationWarning",
        "daysBefore": 7 | 14 | 30,
        "active": true
      },
      "createdAt": "timestamp",
      "createdBy": "uid"
    }
  },

  "emailLogs": {
    "<logId>": {
      "templateId": "string",
      "templateName": "string",
      "employeeId": "string",
      "employeeFullName": "string",
      "recipientEmail": "string",
      "sentAt": "timestamp",
      "status": "sent | failed",
      "errorMessage": "string | null"
    }
  }
}
```

---

## 3. Variables (podstawienia w szablonie)

| Variable | Wynik |
|----------|-------|
| `{employeeFullName}` | Kowalski Jan |
| `{employeeEmail}` | jankowalski@example.com |
| `{contractEndDate}` | 2026-06-15 |
| `{daysUntilExpiry}` | 7 |
| `{department}` | Produkcja |
| `{jobTitle}` | Spawacz |
| `{managerName}` | Nowak Piotr |
| `{hireDate}` | 2023-01-10 |
| `{companyName}` | Strumet |

---

## 4. UI Structure

### New page: `/szablony-email`
```
/szablony-email
├── Toolbar: [+ Nowy szablon] [Filtry: triggerType]
├── Table: Nazwa | Trigger | Akcje [Edytuj] [Usuń] [Wyślij test]
└── Preview Dialog (side-by-side: template → rendered)
```

### New page: `/szablony-email/[id]`
```
Form:
- Nazwa szablonu (Input)
- Temat wiadomości (Input) ← z variables
- Treść wiadomości (Textarea, markdown) ← z variables
- Typ triggera (Select: manual | scheduled | event)
- Konfiguracja triggera (warunki zależne od typu)
- [Podgląd] [Zapisz] [Usuń]
```

### Page: `/historia-email`
```
Table: Data | Szablon | Pracownik | Email | Status
Filtry: data zakres, status, szablon
```

---

## 5. API Endpoints

```
GET    /api/email-templates           → list all templates
POST   /api/email-templates           → create template
GET    /api/email-templates/[id]       → get one template
PUT    /api/email-templates/[id]       → update template
DELETE /api/email-templates/[id]       → delete template

POST   /api/email-templates/[id]/send  → send test email (body: employeeId)
GET    /api/email-logs                 → list logs (query: limit, offset, employeeId)
```

---

## 6. Send Flow

```
1. HR wybiera template → [Wyślij test] → wybiera pracownika
2. Backend: interpolate(template, employee) → rendered email
3. Resend API → send email
4. Log: emailLogs/{newId} = { templateId, employeeId, sentAt, status }
5. UI: toast "Email wysłany" | toast "Błąd: ..."
```

---

## 7. Scheduled Triggers (integration with CRON)

Existing `/api/cron/daily-checks` already has:
- `check-expiring-contracts` — send notification
- `check-fingerprint-appointments` — reminder
- `check-planned-terminations` — alert

**Changes:**
- Replace hardcoded email logic → use templates from RTDB
- For each matching employee → `sendFromTemplate(templateId, employee)`
- Log result to `emailLogs`

---

## 8. Default Templates (seed data)

| Name | Trigger | Subject | Body (snippet) |
|------|---------|---------|----------------|
| Przypomnienie kontraktu | scheduled/contractExpiry | Kontrakt {employeeFullName} wygasa | Twój kontrakt wygasa za {daysUntilExpiry} dni |
| Przypomnienie odcisków | scheduled/fingerprintReminder | Badanie odcisków {employeeFullName} | Prosimy o zgłoszenie się ... |
| Nowy pracownik | event/newHire | Witamy w Strumet! | Witamy {employeeFullName} w zespole |
| Uprzedzenie legalizacji | event/legalisationWarning | Uwaga: legalizacja {employeeFullName} | Twoja legalizacja wygasa ... |

---

## 9. Components

```
src/components/
├── email-template-form.tsx        # Create/Edit form
├── email-template-list.tsx        # Table with actions
├── email-template-preview.tsx     # Side-by-side preview
├── email-log-table.tsx           # History table
└── send-test-email-dialog.tsx    # Modal: select employee → send

src/app/
├── szablony-email/
│   ├── page.tsx                  # List + toolbar
│   └── [id]/page.tsx             # Create/Edit
├── historia-email/page.tsx       # Logs
└── api/
    ├── email-templates/
    │   ├── route.ts              # GET, POST
    │   └── [id]/
    │       ├── route.ts         # GET, PUT, DELETE
    │       └── send/route.ts    # POST — send test
    └── email-logs/route.ts       # GET
```

---

## 10. Tech notes

- Resend SDK: `resend` npm package
- Markdown → HTML: `react-markdown`
- Variable interpolation: regex replace `{varName}` with values
- Auth: admin only (role = 'admin') — check via `currentUser.role`
- No external DB — RTDB only

---

## 11. Out of scope (v1)

- Email attachments
- HTML email editor (WYSIWYG)
- Scheduled digest (multiple employees in one email)
- Email queue / retry on failure
- Custom SMTP (only Resend API)