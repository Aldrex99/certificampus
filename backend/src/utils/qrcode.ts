import QRCode from 'qrcode';
import { env } from '../config/env';

/** Public URL a QR code points to: the frontend verification page. */
export function verificationUrl(qrToken: string): string {
  return `${env.clientUrl}/verify/${qrToken}`;
}

/** Returns a PNG data-URL of the QR code for the given diploma token. */
export function qrDataUrl(qrToken: string): Promise<string> {
  return QRCode.toDataURL(verificationUrl(qrToken), { margin: 1, width: 200 });
}

/** Returns a PNG Buffer of the QR code (used when embedding into a PDF). */
export function qrPngBuffer(qrToken: string): Promise<Buffer> {
  return QRCode.toBuffer(verificationUrl(qrToken), { margin: 1, width: 200 });
}
