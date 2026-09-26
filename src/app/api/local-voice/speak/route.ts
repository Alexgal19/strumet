import { authorize, exclusive, join, readFile, readBounded, responseError, run, writeFile, VoiceError, withTemp } from '@/lib/local-voice/server';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    await authorize(request);
    const raw = (await readBounded(request, 3000)).toString('utf8');
    let body: { text?: unknown };
    try { body = JSON.parse(raw); } catch { throw new VoiceError(400, 'Nieprawidłowy tekst.'); }
    if (!body || Array.isArray(body) || typeof body !== 'object') throw new VoiceError(400, 'Nieprawidłowy tekst.');
    if (typeof body.text !== 'string' || !body.text.trim() || body.text.length > 1500) throw new VoiceError(400, 'Nieprawidłowy tekst.');
    return await exclusive(async () => withTemp(async dir => {
      const aiff = join(dir, 'speech.aiff');
      const textFile = join(dir, 'speech.txt');
      await writeFile(textFile, body.text as string);
      const wav = join(dir, 'speech.wav');
      await run('/usr/bin/say', ['-v', process.env.LOCAL_VOICE_SAY_VOICE || 'Zosia', '-o', aiff, '-f', textFile], 20000);
      await run(process.env.LOCAL_VOICE_FFMPEG_PATH || 'ffmpeg', ['-v', 'error', '-y', '-i', aiff, '-ar', '22050', '-ac', '1', wav], 20000);
      const audio = await readFile(wav);
      if (audio.length > 4_000_000) throw new VoiceError(503, 'Nagranie odpowiedzi jest za duże.');
      return new Response(new Uint8Array(audio), { headers: { 'content-type': 'audio/wav', 'cache-control': 'no-store' } });
    }));
  } catch (error) { return responseError(error); }
}
