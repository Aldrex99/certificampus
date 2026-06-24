import puppeteer, { Browser } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

export interface DiplomaPdfData {
  /** Fully rendered diploma HTML (template with placeholders already resolved). */
  html: string;
  fileName: string; // e.g. "<diplomaId>.pdf"
}

// Reuse a single browser instance across generations (cheaper than launching one each time).
let browserPromise: Promise<Browser> | null = null;

function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      // Allow running as root inside the container and keep memory in check.
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      executablePath: env.puppeteerExecutablePath || undefined,
    });
  }
  return browserPromise;
}

/**
 * Renders the diploma HTML to a PDF on disk and returns its absolute path.
 * The HTML is produced from the diploma template, so the PDF matches the preview.
 */
export async function generateDiplomaPdf(data: DiplomaPdfData): Promise<string> {
  await fs.promises.mkdir(env.diplomaDir, { recursive: true });
  const filePath = path.join(env.diplomaDir, data.fileName);

  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(data.html, { waitUntil: 'load' });
    await page.pdf({
      path: filePath,
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
  } finally {
    await page.close();
  }

  return filePath;
}

export function diplomaPublicUrl(fileName: string): string {
  return `${env.publicUrl}/diplomas/${fileName}`;
}
