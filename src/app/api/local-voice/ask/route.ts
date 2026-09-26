import { authorize, exclusive, readBounded, responseError, VoiceError } from '@/lib/local-voice/server';
import { sanitizeAssistantSnapshot, MAX_RECORDS_PER_SOURCE, SOURCE_FIELDS } from '@/lib/local-voice/assistant-snapshot';
import { executeQueryPlan, fallbackAnswer, fastAbsenceFacts, noSnapshotAnswer, type QueryFacts } from '@/lib/local-voice/assistant-brain';
import { composeAnswer, composeHelpAnswer, planQuestion } from '@/lib/local-voice/assistant-model';
import { appHelpAnswer, isAppHelpQuestion } from '@/lib/local-voice/assistant-help';
import { warsawDay } from '@/lib/local-voice/date';

export const runtime = 'nodejs';
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
export async function POST(request: Request) {
  try {
    await authorize(request);
    const raw = (await readBounded(request, 2_000_000)).toString('utf8');
    let body: unknown;
    try { body = JSON.parse(raw); } catch { throw new VoiceError(400, 'Nieprawidłowe żądanie.'); }
    if (!object(body) || typeof body.question !== 'string' || !body.question.trim() || body.question.length > 1000 || !object(body.snapshot)) throw new VoiceError(400, 'Nieprawidłowe pytanie lub snapshot.');
    const question = body.question.trim();
    if (isAppHelpQuestion(question)) return await exclusive(async () => {
      let answer: string;
      try { answer = await composeHelpAnswer(question); }
      catch { answer = appHelpAnswer(question) || 'Nie mam potwierdzonej instrukcji dla tej funkcji aplikacji.'; }
      return Response.json({ answer }, { headers: { 'cache-control': 'no-store' } });
    });
    for (const source of Object.keys(SOURCE_FIELDS)) {
      const rows = ['departments', 'jobTitles', 'managers', 'nationalities', 'clothingItems'].includes(source) && object(body.snapshot.config) ? body.snapshot.config[source] : body.snapshot[source];
      if (Array.isArray(rows) && rows.length > MAX_RECORDS_PER_SOURCE) throw new VoiceError(413, 'Snapshot ma za dużo rekordów.');
    }
    const snapshot = sanitizeAssistantSnapshot(body.snapshot);
    const empty = noSnapshotAnswer(snapshot);
    if (empty) return Response.json({ answer: empty }, { headers: { 'cache-control': 'no-store' } });
    return await exclusive(async () => {
      const today = warsawDay(new Date());
      let facts: QueryFacts | null = fastAbsenceFacts(question, snapshot);
      if (!facts) {
        let plan;
        try { plan = await planQuestion(question, snapshot, today); } catch (error) {
          if (error instanceof VoiceError && error.status === 422) return Response.json({ answer: 'Nie potrafię ustalić odpowiedzi na podstawie dostępnych danych aplikacji.' }, { headers: { 'cache-control': 'no-store' } });
          throw error;
        }
        if (!plan) return Response.json({ answer: 'Nie mam danych potrzebnych do odpowiedzi na to pytanie.' }, { headers: { 'cache-control': 'no-store' } });
        facts = executeQueryPlan(plan, snapshot);
      }
      let answer: string;
      if (!facts.available) answer = fallbackAnswer(facts);
      else {
        try {
          answer = await composeAnswer(question, facts, today);
          if (facts.source === 'absences' && /powod|chorob|urlop|zwolnien|opieka|sluzb/i.test(answer.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) answer = fallbackAnswer(facts);
          const hasCount = new RegExp(`(^|\\D)${facts.count}(\\D|$)`).test(answer);
          if (facts.source === 'absences' && facts.action === 'list' && facts.rows.some(row => row.employeeFullName && !answer.includes(String(row.employeeFullName)) || row.employeeDepartment && !answer.includes(String(row.employeeDepartment)))) answer = fallbackAnswer(facts);
          else if (facts.source === 'absences' && facts.action === 'list' && !hasCount) answer = `${answer} Łącznie: ${facts.count} nieobecnych.`;
          if (facts.truncated && (!new RegExp(`(^|\\D)${facts.count}(\\D|$)`).test(answer) || !/pokaz|wymien|list|ogranicz/i.test(answer))) answer = fallbackAnswer(facts);
        } catch { answer = fallbackAnswer(facts); }
      }
      return Response.json({ answer, count: facts.count, ...(facts.action === 'list' || facts.action === 'detail' ? { records: facts.rows.map(row => JSON.stringify(row)) } : {}) }, { headers: { 'cache-control': 'no-store' } });
    });
  } catch (error) { return responseError(error); }
}
