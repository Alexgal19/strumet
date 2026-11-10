'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAppContext } from '@/context/app-context';
import { getFirebaseServices } from '@/lib/firebase';
import { type VoiceAnswer } from '@/lib/local-voice/answer';
import { collectAssistantSnapshot } from '@/lib/local-voice/client-snapshot';

import { t } from '@/lib/i18n';
const mimeTypes = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'];
const maxAudioBytes = 5_000_000;
export function LocalVoiceDialog() {
  const {
    employees, absences, absenceRecords, cars, circulationCards, clothingIssuances,
    fingerprintAppointments, statsHistory, notes, notifications, emailTemplates,
    emailLogs, config, currentUser, isLoading, voiceDataReady,
  } = useAppContext();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<VoiceAnswer | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'checking' | 'disabled' | 'unavailable' | 'ready'>('checking');
  const [working, setWorking] = useState(false);
  const [recording, setRecording] = useState(false);
  const [requestingMic, setRequestingMic] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewController = useRef<AbortController | null>(null);
  const previewPromise = useRef<Promise<void> | null>(null);
  const controller = useRef<AbortController | null>(null);
  const cancelled = useRef(false);
  const generation = useRef(0);
  const micPending = useRef(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  function cleanupRecording() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (previewTimer.current) clearInterval(previewTimer.current);
    previewTimer.current = null;
    previewController.current?.abort();
    if (recorder.current?.state === 'recording') recorder.current.stop();
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
    recorder.current = null;
    setRecording(false);
  }
  useEffect(() => {
    if (open) return;
    cancelled.current = true;
    controller.current?.abort();
    cleanupRecording();
    setWorking(false);
    setRequestingMic(false);
    audio.current?.pause();
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;

  }, [open]);
  useEffect(() => () => {
    cancelled.current = true;
    controller.current?.abort();
    if (timer.current) clearTimeout(timer.current);
    if (recorder.current?.state === 'recording') recorder.current.stop();
    stream.current?.getTracks().forEach(track => track.stop());
    audio.current?.pause();
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
  }, []);

  async function request(path: string, body?: BodyInit, contentType?: string, requestSignal?: AbortSignal): Promise<Response> {
    const user = getFirebaseServices()?.auth.currentUser;
    if (!user) throw new Error(t('dialogs.pleaseLogInAgain'));
    const token = await user.getIdToken();
    const signal = requestSignal || controller.current?.signal;
    const response = await fetch(`/api/local-voice/${path}`, { method: body ? 'POST' : 'GET', body, signal, headers: { Authorization: `Bearer ${token}`, ...(contentType ? { 'Content-Type': contentType } : {}) } });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw Object.assign(new Error(typeof payload.error === 'string' ? payload.error : t('dialogs.couldNotConnectToThe')), { status: response.status });
    }
    return response;
  }
  async function checkStatus() {
    const current = generation.current;
    setStatus('checking'); setError('');
    controller.current = new AbortController();
    try {
      const data = await (await request('status')).json() as { enabled: boolean; available: boolean };
      if (!cancelled.current && generation.current === current) setStatus(!data.enabled ? 'disabled' : data.available ? 'ready' : 'unavailable');
    } catch (e) { if (!cancelled.current && generation.current === current) { setStatus('unavailable'); setError(e instanceof Error ? e.message : t('dialogs.connectionError')); } }
  }
  function openChange(next: boolean) {
    generation.current += 1;
    setOpen(next);
    if (next) { cancelled.current = false; setWorking(false); void checkStatus(); }
    else { cancelled.current = true; controller.current?.abort(); }
  }
  async function ask(value: string) {
    const current = generation.current;
    if (!value.trim()) { setError(t('dialogs.typeOrRecordAQuestion')); return; }
    if (isLoading || !voiceDataReady) { setError(t('dialogs.waitForTheCurrentData')); return; }
    setWorking(true); setError(''); setAnswer(null);
    if (audioUrlRef.current) { URL.revokeObjectURL(audioUrlRef.current); audioUrlRef.current = null; }
    controller.current = new AbortController();
    try {
      const snapshot = await collectAssistantSnapshot({
        employees, absences, absenceRecords, cars, circulationCards, clothingIssuances,
        fingerprintAppointments, statsHistory, notes, notifications, emailTemplates,
        emailLogs, config,
      });
      if (cancelled.current || generation.current !== current) return;
      const data = await (await request('ask', JSON.stringify({ question: value.trim(), snapshot }), 'application/json')).json() as { answer: string; count?: number };
      if (!cancelled.current && generation.current === current) {
        const nextAnswer: VoiceAnswer = { text: data.answer, count: data.count ?? 0, records: [] };
        setAnswer(nextAnswer);
        void playText(nextAnswer, true, current);
      }
    } catch (e) { if (!cancelled.current && generation.current === current && !(e instanceof DOMException && e.name === 'AbortError')) setError(e instanceof Error ? e.message : t('dialogs.couldNotAnswer')); }
    finally { if (!cancelled.current && generation.current === current) setWorking(false); }
  }
  async function startRecording() {
    if (micPending.current) return;
    const current = generation.current;
    micPending.current = true; setRequestingMic(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { setError(t('dialogs.recordingIsNotAvailableIn')); return; }
      setError('');
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (cancelled.current || generation.current !== current) { s.getTracks().forEach(track => track.stop()); return; }
      stream.current = s;
      const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
      const r = new MediaRecorder(s, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];
      let bytes = 0;
      let failed = false;
      r.ondataavailable = event => {
        if (!event.data.size) return;
        chunks.push(event.data);
        bytes += event.data.size;
        if (bytes > maxAudioBytes && !failed) {
          failed = true;
          if (generation.current === current) setError(t('dialogs.theRecordingIsTooLarge'));
          stopRecording();
        }
      };
      r.onerror = () => { failed = true; if (generation.current === current) setError(t('dialogs.couldNotRecordAudio')); cleanupRecording(); };
      r.onstop = async () => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
        if (previewTimer.current) clearInterval(previewTimer.current);
        previewTimer.current = null;
        previewController.current?.abort();
        stream.current?.getTracks().forEach(track => track.stop());
        stream.current = null;
        if (recorder.current === r) recorder.current = null;
        await previewPromise.current;
        setRecording(false);
        if (cancelled.current || generation.current !== current || failed || !chunks.length) return;
        setWorking(true);
        controller.current = new AbortController();
        try {
          const blob = new Blob(chunks, { type: r.mimeType });
          let data: { question: string } | null = null;
          for (let attempt = 0; attempt < 8; attempt++) {
            if (controller.current.signal.aborted) return;
            try {
              data = await (await request('transcribe', blob, blob.type)).json() as { question: string };
              break;
            } catch (error) {
              if ((error as { status?: number }).status !== 429 || attempt === 7) throw error;
              await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
            }
          }
          if (!data) return;
          if (!cancelled.current && generation.current === current) { setQuestion(data.question); await ask(data.question); }
        } catch (e) { if (!cancelled.current && generation.current === current && !(e instanceof DOMException && e.name === 'AbortError')) setError(e instanceof Error ? e.message : t('dialogs.couldNotRecogniseSpeech')); }
        finally { if (!cancelled.current && generation.current === current) setWorking(false); }
      };
      recorder.current = r;
      r.start(1000);
      setRecording(true);
      previewTimer.current = setInterval(() => {
        if (r.state !== 'recording' || !chunks.length || failed || previewPromise.current || bytes > maxAudioBytes) return;
        const blob = new Blob(chunks, { type: r.mimeType });
        const preview = new AbortController();
        previewController.current = preview;
        const pending = (async () => {
          try {
            const data = await (await request('transcribe', blob, blob.type, preview.signal)).json() as { question: string };
            if (!preview.signal.aborted && !cancelled.current && generation.current === current && r.state === 'recording') setQuestion(data.question);
          } catch { /* Preview is best effort; the complete recording is transcribed after stop. */ }
        })();
        previewPromise.current = pending;
        void pending.finally(() => {
          if (previewPromise.current === pending) previewPromise.current = null;
          if (previewController.current === preview) previewController.current = null;
        });
      }, 2000);
      timer.current = setTimeout(() => { if (r.state === 'recording') r.stop(); }, 30_000);
    } catch {
      stream.current?.getTracks().forEach(track => track.stop()); stream.current = null;
      if (!cancelled.current && generation.current === current) setError(t('dialogs.noMicrophoneAccessCheckPermissions'));
    } finally { micPending.current = false; if (generation.current === current) setRequestingMic(false); }
  }
  function stopRecording() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (previewTimer.current) clearInterval(previewTimer.current);
    previewTimer.current = null;
    previewController.current?.abort();
    if (recorder.current?.state === 'recording') recorder.current.stop();
  }
  function speechText(value: VoiceAnswer): string {
    const spoken = value.records.length > 3
      ? `${value.text.split(':')[0]}: ${value.count}. ${value.records.slice(0, 3).join('; ')}. Pozostałe wyniki są na ekranie.`
      : value.text;
    return spoken.length <= 1400 ? spoken : `${spoken.slice(0, 1350).replace(/\s+\S*$/, '')}. Pozostałe wyniki są na ekranie.`;
  }
  async function playText(value: VoiceAnswer, automatic: boolean, current: number) {
    if (!automatic) setError('');
    controller.current = new AbortController();
    try {
      let url = audioUrlRef.current;
      if (!url) {
        const blob = await (await request('speak', JSON.stringify({ text: speechText(value) }), 'application/json')).blob();
        if (cancelled.current || generation.current !== current) return;
        url = URL.createObjectURL(blob); audioUrlRef.current = url;
      }
      if (!cancelled.current && generation.current === current) {
        audio.current?.pause();
        const player = new Audio(url); audio.current = player;
        await player.play();
      }
    } catch (e) {
      if (!automatic && !cancelled.current && generation.current === current) setError(e instanceof Error ? e.message : t('dialogs.couldNotPlayTheAnswer'));
    }
  }
  function playAnswer() { if (answer) void playText(answer, false, generation.current); }
  return <Dialog open={open} onOpenChange={openChange}>
    <DialogTrigger asChild><Button variant="outline" size="sm" className="gap-2" aria-label={t('dialogs.askAboutData')}><Mic className="h-4 w-4"/><span className="hidden lg:inline">{t('dialogs.askAboutData')}</span></Button></DialogTrigger>
    <DialogContent className="w-[calc(100vw-2rem)] max-w-lg max-h-[90dvh] overflow-y-auto">
      <DialogHeader><DialogTitle>{t('dialogs.askAboutData')}</DialogTitle><DialogDescription>{t('dialogs.theAnswerIsBuiltFrom')}</DialogDescription></DialogHeader>
      {!voiceDataReady && <p role="status" className="text-sm text-muted-foreground">{t('dialogs.loadingCurrentEmployeeAbsenceAnd')}</p>}
      {status !== 'ready' && <p role="status" className="text-sm text-muted-foreground">{status === 'checking' ? t('dialogs.checkingTheAssistant') : status === 'disabled' ? t('dialogs.theAssistantIsTurnedOff') : t('dialogs.theLocalAssistantIsUnavailable')}</p>}
      {status === 'unavailable' && currentUser && <details className="text-xs text-muted-foreground"><summary>{t('dialogs.informationForTheComputerOwner')}</summary><p className="break-all">UID do listy LOCAL_VOICE_ALLOWED_UIDS: {currentUser.uid}</p></details>}
      <label htmlFor="local-voice-question" className="text-sm font-medium">{t('dialogs.question')}</label>
      <textarea id="local-voice-question" value={question} onChange={e => setQuestion(e.target.value)} maxLength={1000} rows={3} className="w-full rounded-md border bg-background p-2 text-sm" placeholder="Ilu jest aktywnych pracowników?" />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={recording ? stopRecording : startRecording} disabled={status !== 'ready' || working || requestingMic} aria-label={recording ? t('dialogs.stopRecording') : t('dialogs.recordQuestion')}>{recording ? <Square className="mr-2 h-4 w-4"/> : <Mic className="mr-2 h-4 w-4"/>}{recording ? t('dialogs.stop') : t('dialogs.recordQuestion')}</Button>
        <Button type="button" onClick={() => void ask(question)} disabled={status !== 'ready' || working || recording || isLoading || !voiceDataReady}>{t('dialogs.ask')}</Button>
      </div>
      {requestingMic && <p role="status" className="text-sm">{t('dialogs.requestingMicrophoneAccess')}</p>}
      {recording && <p role="status" className="text-sm">{t('dialogs.recordingTheTextAppearsIn')}</p>}
      {working && <p role="status" className="text-sm">{t('dialogs.processingTheQuestion')}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {answer && <div className="space-y-2 rounded-md border p-3"><p role="status" className="text-sm">{answer.text}</p><Button type="button" variant="secondary" size="sm" onClick={() => void playAnswer()}><Volume2 className="mr-2 h-4 w-4"/>{t('dialogs.playAnswer')}</Button></div>}
    </DialogContent>
  </Dialog>;
}
