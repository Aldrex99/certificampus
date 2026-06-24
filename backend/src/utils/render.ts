/**
 * Resolves {{placeholder}} tokens in a template string from a flat data map.
 * Unknown placeholders are replaced with an empty string.
 */
export function renderTemplate(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{\s*([\w]+)\s*\}\}/g, (_match, key: string) => data[key] ?? '');
}

export const DEFAULT_DIPLOMA_TEMPLATE = `
<section style="text-align:center;font-family:Georgia,serif;padding:40px;border:8px double #0b1e3f">
  <h1 style="color:#0b1e3f">Certificat de Réussite</h1>
  <p style="color:#666">{{school_label}}</p>
  <p>Décerné à</p>
  <h2 style="color:#b8860b">{{student_name}}</h2>
  <p>pour la formation <strong>{{training_label}}</strong> {{speciality_label}}</p>
  <p>Mention : {{grade}}</p>
  <p>Délivré le {{graduation_date}}</p>
  <div><img src="{{qr_code_url}}" alt="QR code" width="160" height="160" /></div>
</section>`.trim();
