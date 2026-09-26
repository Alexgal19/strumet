import { authorize, exclusive, join, responseError, readBounded, run, withTemp, writeFile, readFile, VoiceError } from '@/lib/local-voice/server';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    await authorize(request);
    const mime = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const format = mime === 'audio/webm' ? 'matroska' : mime === 'audio/mp4' || mime === 'audio/x-m4a' ? 'mov' : mime === 'audio/ogg' ? 'ogg' : null;
    if (!format) throw new VoiceError(415, 'Nieobsługiwany format nagrania.');
    const input = await readBounded(request, 5_000_000);
    if (!input.length) throw new VoiceError(400, 'Nagranie jest puste.');
    const model = process.env.LOCAL_VOICE_WHISPER_MODEL;
    if (!model) throw new VoiceError(503, 'Brak lokalnego modelu rozpoznawania mowy.');
    if (request.signal.aborted) throw new VoiceError(499, 'Przetwarzanie audio zostało anulowane.');
    return await exclusive(async () => withTemp(async dir => {
      const audio = join(dir, 'input');
      const wav = join(dir, 'audio.wav');
      const output = join(dir, 'text');
      await writeFile(audio, input);
      await run(process.env.LOCAL_VOICE_FFMPEG_PATH || 'ffmpeg', ['-v', 'error', '-y', '-protocol_whitelist', 'file,pipe', '-f', format, '-i', audio, '-t', '31', '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', wav], 20000, request.signal);
      await run(process.env.LOCAL_VOICE_WHISPER_PATH || 'whisper-cli', ['-m', model, '-f', wav, '-l', 'pl', '-otxt', '-of', output, '-nt'], 90000, request.signal);
      const question = (await readFile(`${output}.txt`, 'utf8')).trim().slice(0, 1000);
      if (!question) throw new VoiceError(422, 'Nie rozpoznano pytania.');
      return Response.json({ question }, { headers: { 'cache-control': 'no-store' } });
    }));
  } catch (error) { return responseError(error); }
}
