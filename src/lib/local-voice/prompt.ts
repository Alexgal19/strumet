import { resolveSingleDay } from './fast-intent';

const kinds = ['active_count', 'employees', 'employee_details', 'absences', 'contracts', 'terminations', 'fingerprints', 'unsupported'];
export const intentJsonSchema = { type: 'object', properties: {
  kind: { type: 'string', enum: kinds },
  department: { type: ['string', 'null'] }, employeeName: { type: ['string', 'null'] }, jobTitle: { type: ['string', 'null'] },
  status: { type: ['string', 'null'], enum: ['aktywny', 'zwolniony', null] },
  answerMode: { type: ['string', 'null'], enum: ['count', 'list', null] },
  detailField: { type: ['string', 'null'], enum: ['department', 'jobTitle', 'status', 'hireDate', 'contractEndDate', 'plannedTerminationDate', null] },
  date: { type: ['string', 'null'] }, dateFrom: { type: ['string', 'null'] }, dateTo: { type: ['string', 'null'] },
}, required: ['kind', 'department', 'employeeName', 'jobTitle', 'status', 'answerMode', 'detailField', 'date', 'dateFrom', 'dateTo'], additionalProperties: false } as const;

export function intentSystemPrompt(today: string): string {
  const [year, month] = today.split('-').map(Number);
  const monthEnd = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const day = (offset: number) => new Date(Date.parse(`${today}T12:00:00Z`) + offset * 86_400_000).toISOString().slice(0, 10);
  const weekday = (new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7;
  const nextWeekFrom = day(7 - weekday);
  const nextWeekTo = day(13 - weekday);
  const friday = resolveSingleDay('ten piątek', today);
  const fields = (kind: string, overrides: Record<string, string | null> = {}) => JSON.stringify({ kind, department: null, employeeName: null, jobTitle: null, status: null, answerMode: null, detailField: null, date: null, dateFrom: null, dateTo: null, ...overrides });
  return `Jesteś lokalnym klasyfikatorem pytań o bieżący snapshot HR. Dziś w Europe/Warsaw jest ${today}. Zwróć tylko JEDEN obiekt JSON zgodny ze schematem. Odpowiedź będzie obliczona deterministycznie z pól employees, absences, fingerprintAppointments w sesji.
Rodzaje:
- active_count: dawne proste pytanie o liczbę aktywnych pracowników, opcjonalny dział.
- employees: lista lub liczba pracowników; opcjonalne filtry department, jobTitle i status (aktywny/zwolniony). answerMode=count dla „ile”, „liczba”; list dla „kto”, „wymień”, „pokaż”.
- employee_details: pytanie o konkretnego pracownika (employeeName). detailField dla działu, stanowiska, statusu, daty zatrudnienia, końca umowy lub planowanego zwolnienia; null dla podstawowych danych.
- absences: lista lub liczba nieobecnych, opcjonalnie dział/nazwisko. Dla jednego dnia ustaw date; dla zakresu dateFrom/dateTo włącznie. Nie myl z planowanymi zwolnieniami.
- contracts: umowy kończące się od dateFrom do dateTo włącznie.
- terminations: planowane zwolnienia od dateFrom do dateTo włącznie.
- fingerprints: terminy odcisków palców, opcjonalne employeeName i dateFrom/dateTo.
- unsupported: pytanie poza snapshotem, żądanie zapisu/usunięcia/zmiany, niejasna data lub filtr, który nie ma pola w schemacie.
Zawsze ustaw nieużywane pola null. Nie wymyślaj działu, nazwiska ani daty. Status „aktywny” dla pracowników to bieżący status. Daty YYYY-MM-DD. Dziś=${today}, wczoraj=${day(-1)}, jutro=${day(1)}. Ten piątek=${friday}; „ten <dzień tygodnia>” jest w bieżącym tygodniu poniedziałek–niedziela, „zeszły” w poprzednim, „przyszły” w następnym. Przyszły tydzień=${nextWeekFrom} do ${nextWeekTo}.
Przykłady:
P: Ilu jest aktywnych pracowników?
O: ${fields('active_count')}
P: Ilu aktywnych pracowników jest w dziale Produkcja?
O: ${fields('active_count', { department: 'Produkcja' })}
P: Wymień aktywnych spawaczy z produkcji.
O: ${fields('employees', { status: 'aktywny', jobTitle: 'Spawacz', department: 'Produkcja', answerMode: 'list' })}
P: Ile mamy zwolnionych pracowników?
O: ${fields('employees', { status: 'zwolniony', answerMode: 'count' })}
P: Jakie stanowisko ma Jan Kowalski?
O: ${fields('employee_details', { employeeName: 'Jan Kowalski', detailField: 'jobTitle' })}
P: Kto był nieobecny w ten piątek?
O: ${fields('absences', { date: friday, answerMode: 'list' })}
P: Ile osób było nieobecnych od ${day(-3)} do ${today}?
O: ${fields('absences', { dateFrom: day(-3), dateTo: today, answerMode: 'count' })}
P: Które umowy kończą się w tym miesiącu?
O: ${fields('contracts', { dateFrom: monthStart, dateTo: monthEnd })}
P: Ile planowanych zwolnień jest jutro?
O: ${fields('terminations', { dateFrom: day(1), dateTo: day(1) })}
P: Kto ma odciski palców w przyszłym tygodniu?
O: ${fields('fingerprints', { dateFrom: nextWeekFrom, dateTo: nextWeekTo })}
P: Usuń pracownika Jana Kowalskiego.
O: ${fields('unsupported')}
P: Ile wynosi pensja Jana?
O: ${fields('unsupported')}`;
}
