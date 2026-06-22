import fs from 'fs';
import { env } from '../config/env';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  attachments?: { name: string; type: string; path: string }[];
}

const SPARKPOST_ENDPOINT = 'https://api.sparkpost.com/api/v1/transmissions';

/**
 * Sends an email via the SparkPost transmissions API.
 * When no API key is configured (local dev / tests) the message is logged
 * instead of sent, so the rest of the flow keeps working offline.
 */
export async function sendEmail(message: EmailMessage): Promise<{ sent: boolean }> {
  if (!env.sparkpostApiKey) {
    if (!env.isTest) {
      // eslint-disable-next-line no-console
      console.log(`[email:mock] -> ${message.to} | ${message.subject}`);
    }
    return { sent: false };
  }

  const attachments = (message.attachments ?? []).map((a) => ({
    name: a.name,
    type: a.type,
    data: fs.readFileSync(a.path).toString('base64'),
  }));

  const res = await fetch(SPARKPOST_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: env.sparkpostApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: {
        from: { email: env.emailFrom, name: env.emailFromName },
        subject: message.subject,
        html: message.html,
        attachments,
      },
      recipients: [{ address: message.to }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SparkPost error ${res.status}: ${body}`);
  }
  return { sent: true };
}
