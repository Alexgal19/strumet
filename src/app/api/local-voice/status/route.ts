import { authorize, enabled, localModel, responseError, verifiedUid } from '@/lib/local-voice/server';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  try { await verifiedUid(request); } catch (error) { return responseError(error); }
  if (!enabled()) return Response.json({ enabled: false, available: false }, { headers: { 'cache-control': 'no-store' } });
  try {
    await authorize(request);
    await localModel();
    return Response.json({ enabled: true, available: true }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error.status === 401 || error.status === 403)) return responseError(error);
    return Response.json({ enabled: true, available: false }, { headers: { 'cache-control': 'no-store' } });
  }
}
