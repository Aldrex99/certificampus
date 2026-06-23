import { env } from "../config/env";

const BRAND_PRIMARY = "#0b1e3f";
const BRAND_ACCENT = "#b8860b";

function layout(title: string, body: string): string {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;border:1px solid #eee;border-radius:8px;overflow:hidden">
    <div style="background:${BRAND_PRIMARY};padding:20px;text-align:center">
      <span style="color:#fff;font-size:22px;font-weight:bold">Certifi<span style="color:${BRAND_ACCENT}">Campus</span></span>
    </div>
    <div style="padding:24px;color:#222;line-height:1.5">
      <h2 style="color:${BRAND_PRIMARY};margin-top:0">${title}</h2>
      ${body}
    </div>
    <div style="background:#f7f7f7;padding:16px;text-align:center;font-size:12px;color:#888">
      CertifiCampus — plateforme de certifications numériques
    </div>
  </div>`;
}

function button(label: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:${BRAND_ACCENT};color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:bold">${label}</a>`;
}

export function activationEmail(
  token: string,
  email: string,
): { subject: string; html: string } {
  const url = `${env.clientUrl}/activate?token=${token}&email=${encodeURIComponent(email)}`;
  const fraudUrl = `${env.clientUrl}/report-fraud?token=${token}`;
  return {
    subject: "Activez votre compte CertifiCampus",
    html: layout(
      "Bienvenue sur CertifiCampus",
      `<p>Pour activer votre compte et définir votre mot de passe, cliquez sur le bouton ci-dessous :</p>
       <p style="text-align:center;margin:24px 0">${button("Activer mon compte", url)}</p>
       <p style="font-size:13px;color:#666">Votre code d'activation : <strong>${token.slice(0, 8).toUpperCase()}</strong></p>
       <p style="font-size:12px;color:#999">Vous n'êtes pas à l'origine de cette demande ?
       <a href="${fraudUrl}">Signalez-le à notre équipe</a>.</p>`,
    ),
  };
}

export function resetPasswordEmail(
  token: string,
  email: string,
): { subject: string; html: string } {
  const url = `${env.clientUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  const fraudUrl = `${env.clientUrl}/report-fraud?token=${token}`;
  return {
    subject: "Réinitialisation de votre mot de passe",
    html: layout(
      "Réinitialisez votre mot de passe",
      `<p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez ci-dessous :</p>
       <p style="text-align:center;margin:24px 0">${button("Choisir un nouveau mot de passe", url)}</p>
       <p style="font-size:12px;color:#999">Demande frauduleuse ?
       <a href="${fraudUrl}">Prévenez notre équipe</a>.</p>`,
    ),
  };
}

export function diplomaEmail(
  studentName: string,
  schoolName: string,
  verifyUrl: string,
): { subject: string; html: string } {
  return {
    subject: `Votre certificat ${schoolName}`,
    html: layout(
      "Félicitations !",
      `<p>Bonjour ${studentName},</p>
       <p>Votre certificat délivré par <strong>${schoolName}</strong> est disponible en pièce jointe.</p>
       <p>Son authenticité peut être vérifiée à tout moment via ce lien :</p>
       <p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    ),
  };
}

export function accountUpdatedEmail(name: string): {
  subject: string;
  html: string;
} {
  return {
    subject: "Vos informations ont été mises à jour",
    html: layout(
      "Mise à jour réussie",
      `<p>Bonjour ${name},</p><p>Les informations de votre compte CertifiCampus ont bien été mises à jour.</p>`,
    ),
  };
}
