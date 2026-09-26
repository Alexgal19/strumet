import { authorize, exclusive, localModel, readBounded, responseError, VoiceError } from '@/lib/local-voice/server';
import { validateIntent } from '@/lib/local-voice/intent';
import { warsawDay } from '@/lib/local-voice/date';
import { fastAbsenceIntent } from '@/lib/local-voice/fast-intent';
import { intentJsonSchema, intentSystemPrompt } from '@/lib/local-voice/prompt';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    await authorize(request);
    const raw = (await readBounded(request, 4000)).toString('utf8');
    let body: { question?: unknown };
    try { body = JSON.parse(raw); } catch { throw new VoiceError(400, 'Nieprawidłowe pytanie.'); }
    if (!body || Array.isArray(body) || typeof body !== 'object') throw new VoiceError(400, 'Nieprawidłowe pytanie.');
    if (typeof body.question !== 'string' || !body.question.trim() || body.question.length > 1000) throw new VoiceError(400, 'Nieprawidłowe pytanie.');
    const question = body.question;
    const fastIntent = fastAbsenceIntent(question);
    if (fastIntent) return Response.json({ intent: fastIntent }, { headers: { 'cache-control': 'no-store' } });
    return await exclusive(async () => {
      const model = await localModel();
      const today = warsawDay(new Date());
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      try {
        const response = await fetch('http://127.0.0.1:11434/api/chat', { method: 'POST', signal: controller.signal, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model, stream: false, think: false, format: intentJsonSchema, options: { temperature: 0, num_predict: 180 }, messages: [
          { role: 'system', content: intentSystemPrompt(today) },
          { role: 'user', content: question.trim() },
        ] }) });
        if (!response.ok) throw new VoiceError(503, 'Lokalny model nie odpowiedział.');
        const text = await response.text();
        if (text.length > 50_000) throw new VoiceError(503, 'Odpowiedź modelu jest za duża.');
        const message = (JSON.parse(text) as { message?: { content?: string } }).message?.content;
        if (!message) throw new VoiceError(503, 'Model nie zwrócił odpowiedzi.');
        let intent;
        try { intent = validateIntent(JSON.parse(message)); } catch { intent = validateIntent({ kind: 'unsupported', department: null, employeeName: null, date: null, dateFrom: null, dateTo: null }); }
        return Response.json({ intent }, { headers: { 'cache-control': 'no-store' } });
      } finally { clearTimeout(timer); }
    });
  } catch (error) { return responseError(error); }
}
