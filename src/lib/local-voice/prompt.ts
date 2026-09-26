export const intentJsonSchema = { type: 'object', properties: {
  kind: { type: 'string', enum: ['active_count', 'absences', 'contracts', 'terminations', 'fingerprints', 'unsupported'] },
  department: { type: ['string', 'null'] }, employeeName: { type: ['string', 'null'] },
  date: { type: ['string', 'null'] }, dateFrom: { type: ['string', 'null'] }, dateTo: { type: ['string', 'null'] },
}, required: ['kind', 'department', 'employeeName', 'date', 'dateFrom', 'dateTo'], additionalProperties: false } as const;

export function intentSystemPrompt(today: string): string {
  const [year, month] = today.split('-').map(Number);
  const monthEnd = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const todayUtc = new Date(`${today}T12:00:00Z`);
  const tomorrow = new Date(todayUtc.getTime() + 86_400_000).toISOString().slice(0, 10);
  const weekday = (todayUtc.getUTCDay() + 6) % 7;
  const nextMonday = new Date(todayUtc.getTime() + (7 - weekday) * 86_400_000);
  const nextSunday = new Date(nextMonday.getTime() + 6 * 86_400_000);
  const nextWeekFrom = nextMonday.toISOString().slice(0, 10);
  const nextWeekTo = nextSunday.toISOString().slice(0, 10);
  const fields = (kind: string, overrides: Record<string, string | null> = {}) => JSON.stringify({ kind, department: null, employeeName: null, date: null, dateFrom: null, dateTo: null, ...overrides });
  return `Jesteś klasyfikatorem pytań o dane HR. Dziś w strefie Europe/Warsaw jest ${today}. Zwróć JEDEN obiekt JSON zgodny ze schematem i nic więcej.
Dozwolone rodzaje:
- active_count: liczba AKTYWNYCH pracowników, opcjonalnie w JAWNIE wskazanym dziale (department). Bez dat.
- absences: nieobecni w JEDNYM określonym dniu (date). Słowa „nieobecni”, „absencja”, „nieobecnych” mają pierwszeństwo przed słowem „pracownicy”.
- contracts: kończące się umowy w określonym zakresie (dateFrom, dateTo). Jednodniowe pytanie oznacza dateFrom = dateTo.
- terminations: planowane zwolnienia w określonym zakresie (dateFrom, dateTo). Jednodniowe pytanie oznacza dateFrom = dateTo.
- fingerprints: terminy odcisków palców, opcjonalnie jawne imię i nazwisko (employeeName) i zakres dat. Jeśli pytanie zawiera okres czasu, MUSISZ ustawić dateFrom/dateTo albo wybrać unsupported.
- unsupported: każdy inny temat, niejasna data lub zakres, żądanie zmiany/zapisu/usunięcia danych, dodatkowe filtry (stanowisko, narodowość, kierownik, status inny niż aktywny), lub pytanie spoza tej listy.
KRYTYCZNE: Pola nieużywane dla wybranego rodzaju mają być DOSŁOWNIE null. Gdy pytanie nie zawiera działu lub nazwiska, te pola są null. Nigdy nie wpisuj „Wszystkie”, pustego tekstu ani przykładowego pracownika. Nie ustawiaj daty dzisiejszej, chyba że użytkownik mówi „dziś/dzisiaj”. Nie dopowiadaj filtra, którego nie ma. Jeśli pytanie wymienia stanowisko, np. spawaczy, wybierz unsupported, nie traktuj go jako działu. Jeśli pada 'jutro', użyj ${tomorrow}. 'Przyszły tydzień' to ${nextWeekFrom} do ${nextWeekTo}. Wszystkie daty YYYY-MM-DD.
Przykłady:
P: Ilu jest aktywnych pracowników?
O: ${fields('active_count')}
P: Ilu aktywnych pracowników jest w dziale Produkcja?
O: ${fields('active_count', { department: 'Produkcja' })}
P: Kto jest dzisiaj nieobecny?
O: ${fields('absences', { date: today })}
P: I lub pracowników jest do dzisiaj nieobeznych?
O: ${fields('absences', { date: today })}
P: Które umowy kończą się w tym miesiącu?
O: ${fields('contracts', { dateFrom: monthStart, dateTo: monthEnd })}
P: Ile planowanych zwolnień jest jutro?
O: ${fields('terminations', { dateFrom: tomorrow, dateTo: tomorrow })}
P: Kto ma odciski palców w przyszłym tygodniu?
O: ${fields('fingerprints', { dateFrom: nextWeekFrom, dateTo: nextWeekTo })}
P: Ilu aktywnych spawaczy mamy?
O: ${fields('unsupported')}
P: Usuń pracownika Jana Kowalskiego.
O: ${fields('unsupported')}
P: Ile wynosi pensja Jana?
O: ${fields('unsupported')}
P: Kto ma termin odcisków palców?
O: ${fields('fingerprints')}`;
}
