import 'server-only';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { permittedUid, safeLocalModel } from './policy';

export class VoiceError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const projectId = () => process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const allowedUids = () => new Set((process.env.LOCAL_VOICE_ALLOWED_UIDS || '').split(',').map(s => s.trim()).filter(Boolean));
export const enabled = () => process.env.LOCAL_VOICE_ENABLED === 'true';
export async function verifiedUid(request: Request): Promise<string> {
  if (!projectId()) throw new VoiceError(503, 'Brak konfiguracji Firebase.');
  const header = request.headers.get('authorization') || '';
  if (!/^Bearer [^\s]+$/.test(header)) throw new VoiceError(401, 'Wymagane logowanie.');
  try {
    const app = getApps().find(a => a.name === 'local-voice') || initializeApp({ projectId: projectId() }, 'local-voice');
    const decoded = await getAuth(app).verifyIdToken(header.slice(7));
    return decoded.uid;
  } catch {
    throw new VoiceError(401, 'Nie udało się zweryfikować logowania.');
  }
}
export async function authorize(request: Request): Promise<void> {
  const uid = await verifiedUid(request);
  if (!enabled()) throw new VoiceError(503, 'Asystent lokalny jest wyłączony.');
  if (!allowedUids().size) throw new VoiceError(503, 'Brak konfiguracji dostępu do asystenta.');
  if (!permittedUid(uid, process.env.LOCAL_VOICE_ALLOWED_UIDS)) throw new VoiceError(403, 'Brak dostępu do asystenta.');
}
export function responseError(error: unknown): Response {
  const e = error instanceof VoiceError ? error : new VoiceError(500, 'Operacja lokalna nie powiodła się.');
  return Response.json({ error: e.message }, { status: e.status, headers: { 'cache-control': 'no-store' } });
}
const voiceGlobal = globalThis as typeof globalThis & { __strumetVoiceBusy?: boolean };
export async function exclusive<T>(task: () => Promise<T>): Promise<T> {
  if (voiceGlobal.__strumetVoiceBusy) throw new VoiceError(429, 'Asystent jest zajęty. Spróbuj ponownie.');
  voiceGlobal.__strumetVoiceBusy = true;
  try { return await task(); } finally { voiceGlobal.__strumetVoiceBusy = false; }
}
export async function readBounded(request: Request, limit: number): Promise<Buffer> {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > limit) throw new VoiceError(413, 'Żądanie jest za duże.');
  const reader = request.body?.getReader();
  if (!reader) throw new VoiceError(400, 'Puste żądanie.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new VoiceError(413, 'Żądanie jest za duże.'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks, size);
}
export async function run(bin: string, args: string[], timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, OLLAMA_HOST: '127.0.0.1:11434' } });
    let output = '';
    let size = 0;
    let failed = false;
    const timeout = setTimeout(() => { failed = true; child.kill('SIGKILL'); }, timeoutMs);
    child.stdout.on('data', chunk => { size += chunk.length; if (size > 1_000_000) { failed = true; child.kill('SIGKILL'); } else output += chunk.toString(); });
    child.stderr.on('data', chunk => { size += chunk.length; if (size > 1_000_000) { failed = true; child.kill('SIGKILL'); } });
    child.on('error', () => { clearTimeout(timeout); reject(new VoiceError(503, 'Brak lokalnego programu audio.')); });
    child.on('close', code => { clearTimeout(timeout); if (failed || code !== 0) reject(new VoiceError(503, 'Lokalne przetwarzanie audio nie powiodło się.')); else resolve(output); });
  });
}
export async function withTemp<T>(task: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), 'strumet-voice-'));
  try { return await task(dir); } finally { await rm(dir, { recursive: true, force: true }); }
}
export { join, readFile, writeFile };
export async function localModel(): Promise<string> {
  const model = process.env.LOCAL_VOICE_OLLAMA_MODEL || 'qwen3:4b';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch('http://127.0.0.1:11434/api/tags', { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) throw new Error('tags unavailable');
    const tags = await response.json() as { models?: { name?: string; model?: string; remote_model?: string; remote_host?: string }[] };
    const selected = tags.models?.find(item => item.name === model || item.model === model);
    if (!safeLocalModel(model, selected)) throw new VoiceError(503, 'Wymagany jest pobrany lokalny model Ollama.');
    return model;
  } catch (error) {
    if (error instanceof VoiceError) throw error;
    throw new VoiceError(503, 'Lokalny model Ollama jest niedostępny.');
  } finally { clearTimeout(timer); }
}
