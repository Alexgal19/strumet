import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getAdminApp, adminDb } from '@/lib/firebase-admin';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
  try {
    const { recipientEmail, subject, employeeName, department, absenceDates } = await request.json();

    if (!recipientEmail || !subject || !employeeName || !absenceDates) {
      return NextResponse.json({ success: false, message: 'Brakuje wymaganych danych.' }, { status: 400 });
    }

    // Get Gmail credentials from Firebase RTDB
    let gmailUser: string | undefined;
    let gmailAppPassword: string | undefined;

    try {
      getAdminApp();
      const db = adminDb();
      const configSnapshot = await Promise.race([
        db.ref('configPrivate').get(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      if (configSnapshot.exists()) {
        const config = configSnapshot.val();
        gmailUser = config.gmailUser || process.env.GMAIL_USER;
        gmailAppPassword = config.gmailAppPassword || process.env.GMAIL_APP_PASSWORD;
      }
    } catch {
      gmailUser = process.env.GMAIL_USER;
      gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    }

    if (!gmailUser || !gmailAppPassword) {
      return NextResponse.json({ success: false, message: 'Brak danych logowania Gmail.' }, { status: 500 });
    }

    // Read signature image
    const signaturePath = path.join(process.cwd(), 'src', 'assets', 'swl-signature.jpg');
    let signatureBuffer: Buffer;
    try {
      signatureBuffer = fs.readFileSync(signaturePath);
    } catch {
      return NextResponse.json({ success: false, message: 'Nie znaleziono pliku podpisu.' }, { status: 500 });
    }

    // Build HTML email body with embedded signature via CID
    const htmlBody = `
      <div style="font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #333;">
        <p>Dzień dobry,</p>
        <p>
          Informujemy o nieobecności pracownika:<br>
          Imię i nazwisko: <b>${employeeName}</b><br>
          Dział: <b>${department || '-'}</b><br>
          Data nieobecności: <b>${absenceDates}</b>
        </p>
        <p>Z poważaniem,</p>
        <br>
        <img src="cid:swl_signature" alt="Podpis SWL" style="max-width: 627px; height: auto;">
      </div>
    `;

    const cleanPassword = gmailAppPassword.replace(/\s+/g, '');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: cleanPassword,
      },
    });

    const info = await transporter.sendMail({
      from: `"Oleksandr Holiadynets" <${gmailUser}>`,
      to: recipientEmail,
      subject: subject,
      html: htmlBody,
      attachments: [
        {
          filename: 'signature.jpg',
          content: signatureBuffer,
          cid: 'swl_signature',
        },
      ],
    });

    console.log('Absence email sent:', info.messageId);
    return NextResponse.json({ success: true, message: `E-mail wysłany do ${recipientEmail}.` });
  } catch (error: any) {
    console.error('Send absence email error:', error);
    const msg = error instanceof Error ? error.message : 'Nieznany błąd';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
