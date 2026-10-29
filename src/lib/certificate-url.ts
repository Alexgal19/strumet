/**
 * Pomocnicze funkcje dla linków do skanów certyfikatów spawacza.
 *
 * Starsze rekordy mają w `certificateUrl` bezpośredni link Firebase Storage
 * z tokenem (`...firebasestorage.googleapis.com/v0/b/<bucket>/o/<path>?alt=media&token=...`).
 * Token zmienia się przy każdym ponownym przesłaniu pliku, więc link może
 * przestać działać (403 Permission denied). Dlatego zawsze otwieramy plik
 * przez nasze API `/api/certificates?path=...`, które używa Admin SDK.
 */

/** Wyciąga ścieżkę obiektu (np. `certificates/abc.jpg`) z dowolnego formatu linku. */
export function certificatePathFromUrl(url: string | null | undefined): string | null {
    if (!url || typeof url !== 'string') return null;
    try {
        // Nasz własny link: /api/certificates?path=...
        if (url.includes('/api/certificates')) {
            const u = new URL(url, 'http://localhost');
            return u.searchParams.get('path');
        }
        // Link Firebase Storage: .../o/<encodedPath>?...
        const match = url.match(/\/o\/([^?#]+)/);
        if (match?.[1]) return decodeURIComponent(match[1]);
        // Link GCS: https://storage.googleapis.com/<bucket>/<path>
        const gcs = url.match(/storage\.googleapis\.com\/[^/]+\/(.+?)(?:\?|$)/);
        if (gcs?.[1]) return decodeURIComponent(gcs[1]);
    } catch {
        /* ignore */
    }
    return null;
}

/** Zwraca link do podglądu/pobrania certyfikatu przez nasze API. */
export function certificateViewUrl(
    url: string | null | undefined,
    opts?: { download?: boolean; name?: string }
): string {
    if (!url) return '';
    const path = certificatePathFromUrl(url);
    if (!path) return url;
    const params = new URLSearchParams({ path });
    if (opts?.download) params.set('download', '1');
    if (opts?.name) params.set('name', opts.name);
    // Zachowaj parametr v= (wersja pliku) aby ominąć cache przeglądarki
    try {
        const v = new URL(url, 'http://localhost').searchParams.get('v');
        if (v) params.set('v', v);
    } catch { /* ignore */ }
    return `/api/certificates?${params.toString()}`;
}

/** Rozszerzenie pliku certyfikatu (jpg/png/pdf...). */
export function certificateExt(url: string | null | undefined): string {
    const path = certificatePathFromUrl(url) || (url || '').split('?')[0];
    return path.split('.').pop() || 'jpg';
}
