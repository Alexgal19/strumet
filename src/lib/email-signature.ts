/**
 * HTML-owa stopka SWL do e-maili (obrazek bannera hostowany w /public).
 * Obrazek musi być dostępny publicznie pod /swl-footer.png,
 * a w mailach działa tylko pełny URL (https://domena/swl-footer.png).
 */
export function getSwlFooterHtml(origin: string): string {
  const url = `${origin}/swl-footer.png`;
  return [
    '<div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;">',
    `<img src="${url}" alt="SWL Sp. z o.o. — Oleksandr Holiadynets, Koordynator" width="600" style="display:block;max-width:600px;width:100%;height:auto;border:0;outline:none;text-decoration:none;" />`,
    '</div>',
  ].join('');
}

export interface AbsenceEmailData {
  fullName: string;
  department: string;
  dateStr: string;
}

export function buildAbsenceEmailHtml(data: AbsenceEmailData): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return [
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111827;line-height:1.6;">',
    '<p style="margin:0 0 12px;">Dzień dobry,</p>',
    '<p style="margin:0 0 12px;">Informujemy o nieobecności pracownika:</p>',
    '<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">',
    `<tr><td style="padding:4px 16px 4px 0;color:#6b7280;">Imię i nazwisko</td><td style="padding:4px 0;font-weight:bold;">${data.fullName}</td></tr>`,
    `<tr><td style="padding:4px 16px 4px 0;color:#6b7280;">Dział</td><td style="padding:4px 0;">${data.department || '-'}</td></tr>`,
    `<tr><td style="padding:4px 16px 4px 0;color:#6b7280;">Data nieobecności</td><td style="padding:4px 0;font-weight:bold;">${data.dateStr}</td></tr>`,
    '</table>',
    '<p style="margin:16px 0 0;">Z poważaniem,</p>',
    getSwlFooterHtml(origin),
    '</div>',
  ].join('');
}
