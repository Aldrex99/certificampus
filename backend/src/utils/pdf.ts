import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

export interface DiplomaPdfData {
  studentName: string;
  trainingLabel?: string;
  specialityLabel?: string;
  schoolName: string;
  grade?: string;
  graduationDate?: Date;
  templateName?: string;
  qrPng: Buffer;
  fileName: string; // e.g. "<diplomaId>.pdf"
}

/**
 * Renders a diploma PDF to disk and returns its absolute path.
 * Layout is intentionally simple but includes the QR code that links to the
 * public verification endpoint, guaranteeing authenticity.
 */
export async function generateDiplomaPdf(data: DiplomaPdfData): Promise<string> {
  await fs.promises.mkdir(env.diplomaDir, { recursive: true });
  const filePath = path.join(env.diplomaDir, data.fileName);

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const { width } = doc.page;

    doc
      .fontSize(30)
      .fillColor('#0b1e3f')
      .text('CERTIFICAT DE RÉUSSITE', { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(14)
      .fillColor('#555')
      .text(data.schoolName, { align: 'center' })
      .moveDown(1.5);

    doc
      .fontSize(16)
      .fillColor('#000')
      .text('Décerné à', { align: 'center' })
      .moveDown(0.3);

    doc
      .fontSize(26)
      .fillColor('#b8860b')
      .text(data.studentName, { align: 'center' })
      .moveDown(1);

    const details: string[] = [];
    if (data.trainingLabel) details.push(`Formation : ${data.trainingLabel}`);
    if (data.specialityLabel) details.push(`Spécialité : ${data.specialityLabel}`);
    if (data.grade) details.push(`Mention : ${data.grade}`);
    if (data.graduationDate) {
      details.push(`Date : ${data.graduationDate.toLocaleDateString('fr-FR')}`);
    }

    doc.fontSize(14).fillColor('#000');
    details.forEach((line) => doc.text(line, { align: 'center' }));

    // QR code bottom-right.
    const qrSize = 110;
    doc.image(data.qrPng, width - qrSize - 50, doc.page.height - qrSize - 60, {
      width: qrSize,
      height: qrSize,
    });
    doc
      .fontSize(9)
      .fillColor('#777')
      .text('Scannez pour vérifier l’authenticité', width - qrSize - 70, doc.page.height - 60, {
        width: qrSize + 40,
        align: 'center',
      });

    doc.end();
    stream.on('finish', () => resolve());
    stream.on('error', reject);
  });

  return filePath;
}

export function diplomaPublicUrl(fileName: string): string {
  return `${env.publicUrl}/diplomas/${fileName}`;
}
