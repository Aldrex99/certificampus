import fs from "fs";
import path from "path";
import { Types } from "mongoose";
import { env } from "../config/env";
import {
  Student,
  Diploma,
  IDiploma,
  School,
  TemplateDiploma,
  ITemplateDiploma,
} from "../models";
import { ApiError } from "../utils/ApiError";
import { generateQrToken } from "../utils/jwt";
import { qrDataUrl, verificationUrl } from "../utils/qrcode";
import { generateDiplomaPdf, diplomaPublicUrl } from "../utils/pdf";
import { renderTemplate, DEFAULT_DIPLOMA_TEMPLATE } from "../utils/render";
import { sendEmail } from "../utils/email";
import { diplomaEmail } from "../utils/emailTemplates";
import {
  GenerateInput,
  PublishInput,
} from "../validators/certification.schema";

interface PopulatedStudent {
  _id: Types.ObjectId;
  firstname: string;
  lastname: string;
  email: string;
  status: string;
  grade?: string;
  graduationDate?: Date;
  training?: { label?: string };
  speciality?: { label?: string };
}

/** Resolves the template to use: explicit id, else school default, else global default. */
async function resolveTemplate(
  schoolId: string,
  templateId?: string,
): Promise<
  ITemplateDiploma | { content: string; name: string; _id?: Types.ObjectId }
> {
  if (templateId) {
    const tpl = await TemplateDiploma.findById(templateId);
    if (!tpl) throw ApiError.notFound("Template introuvable");
    return tpl;
  }
  const schoolTpl = await TemplateDiploma.findOne({
    school: schoolId,
    isDefault: true,
  });
  if (schoolTpl) return schoolTpl;
  const globalTpl = await TemplateDiploma.findOne({
    school: null,
    isDefault: true,
  });
  if (globalTpl) return globalTpl;
  return { content: DEFAULT_DIPLOMA_TEMPLATE, name: "Default" };
}

function templateData(
  student: PopulatedStudent,
  schoolName: string,
  qrCodeUrl: string,
): Record<string, string> {
  return {
    student_name: `${student.firstname} ${student.lastname}`,
    firstname: student.firstname,
    lastname: student.lastname,
    school_label: schoolName,
    training_label: student.training?.label ?? "",
    speciality_label: student.speciality?.label ?? "",
    grade: student.grade ?? "",
    graduation_date: student.graduationDate
      ? new Date(student.graduationDate).toLocaleDateString("fr-FR")
      : "",
    qr_code_url: qrCodeUrl,
  };
}

/** Students eligible for certification (status = admis) plus their cert state. */
export async function listCertifiableStudents(
  schoolId: string,
  trainingId?: string,
) {
  const query: Record<string, unknown> = {
    school: new Types.ObjectId(schoolId),
    status: "admis",
  };
  if (trainingId && Types.ObjectId.isValid(trainingId)) {
    query.training = new Types.ObjectId(trainingId);
  }
  return Student.find(query)
    .populate("training", "label")
    .populate("speciality", "label")
    .sort({ lastname: 1 });
}

/** Renders an HTML preview of a diploma for a given student (no persistence). */
export async function previewDiploma(
  schoolId: string,
  studentId: string,
  templateId?: string,
): Promise<{ html: string }> {
  const student = (await Student.findOne({ _id: studentId, school: schoolId })
    .populate("training", "label")
    .populate("speciality", "label")) as unknown as PopulatedStudent | null;
  if (!student) throw ApiError.notFound("Étudiant introuvable");

  const school = await School.findById(schoolId);
  const template = await resolveTemplate(schoolId, templateId);

  // Preview uses a sample token (not persisted).
  const sampleQr = await qrDataUrl("preview-sample-token");
  const html = renderTemplate(
    template.content,
    templateData(student, school?.label ?? "", sampleQr),
  );
  return { html };
}

export interface GenerateResult {
  generated: IDiploma[];
  skipped: { studentId: string; reason: string }[];
}

/**
 * Generates diplomas for the given admitted students: creates a Diploma with a
 * unique QR token, renders a PDF embedding the QR, and flags the student certified.
 */
export async function generateDiplomas(
  schoolId: string,
  input: GenerateInput,
): Promise<GenerateResult> {
  const school = await School.findById(schoolId);
  if (!school) throw ApiError.notFound("Établissement introuvable");

  const template = await resolveTemplate(schoolId, input.templateId);
  const templateId =
    "_id" in template && template._id
      ? (template._id as Types.ObjectId)
      : undefined;

  const result: GenerateResult = { generated: [], skipped: [] };

  for (const studentId of input.studentIds) {
    const student = (await Student.findOne({ _id: studentId, school: schoolId })
      .populate("training", "label")
      .populate("speciality", "label")) as unknown as PopulatedStudent | null;

    if (!student) {
      result.skipped.push({ studentId, reason: "Étudiant introuvable" });
      continue;
    }
    if (student.status !== "admis") {
      result.skipped.push({ studentId, reason: "Étudiant non admis" });
      continue;
    }

    const qrToken = generateQrToken();
    const diploma = await Diploma.create({
      student: student._id,
      school: school._id,
      training: (student.training as unknown as { _id?: Types.ObjectId })?._id,
      speciality: (student.speciality as unknown as { _id?: Types.ObjectId })
        ?._id,
      template: templateId,
      grade: student.grade,
      graduationDate: student.graduationDate,
      qrToken,
      state: "generated",
      generatedAt: new Date(),
    });

    // Render the diploma template to HTML, then to PDF (matches the preview).
    const qrCodeUrl = await qrDataUrl(qrToken);
    const html = renderTemplate(
      template.content,
      templateData(student, school.label, qrCodeUrl),
    );
    await generateDiplomaPdf({
      html,
      fileName: `${diploma._id}.pdf`,
    });

    diploma.fileUrl = diplomaPublicUrl(`${diploma._id}.pdf`);
    await diploma.save();

    await Student.updateOne(
      { _id: student._id },
      { $set: { isCertified: true } },
    );
    result.generated.push(diploma);
  }

  if (result.generated.length === 0 && result.skipped.length > 0) {
    throw ApiError.badRequest("Aucun diplôme généré", result.skipped);
  }
  return result;
}

export interface PublishResult {
  published: number;
  sent: number;
}

export async function publishDiplomas(
  schoolId: string,
  input: PublishInput,
): Promise<PublishResult> {
  const diplomas = await Diploma.find({
    _id: { $in: input.diplomaIds },
    school: schoolId,
  }).populate("student", "firstname lastname email");
  if (diplomas.length === 0)
    throw ApiError.notFound("Aucun diplôme correspondant");

  const school = await School.findById(schoolId);
  let sent = 0;

  for (const diploma of diplomas) {
    diploma.state = "published";
    diploma.publishedAt = new Date();

    if (input.send) {
      const student = diploma.student as unknown as {
        firstname: string;
        lastname: string;
        email: string;
      };
      const mail = diplomaEmail(
        `${student.firstname} ${student.lastname}`,
        school?.label ?? "votre établissement",
        verificationUrl(diploma.qrToken),
      );

      // Attach the generated diploma PDF when it exists on disk.
      const pdfPath = path.join(env.diplomaDir, `${diploma._id}.pdf`);
      const attachments = fs.existsSync(pdfPath)
        ? [
            {
              name: `diplome-${diploma._id}.pdf`,
              type: "application/pdf",
              path: pdfPath,
            },
          ]
        : undefined;

      const res = await sendEmail({
        to: student.email,
        subject: mail.subject,
        html: mail.html,
        attachments,
      });
      if (res.sent) {
        diploma.sentAt = new Date();
        sent += 1;
      }
    }
    await diploma.save();
  }

  return { published: diplomas.length, sent };
}

export async function verifyDiploma(qrToken: string) {
  const diploma = await Diploma.findOne({ qrToken })
    .populate("student", "firstname lastname")
    .populate("school", "label")
    .populate("training", "label");
  if (!diploma || !diploma.isValid)
    throw ApiError.notFound("Certificat introuvable ou invalide");

  const student = diploma.student as unknown as {
    firstname: string;
    lastname: string;
  };
  const school = diploma.school as unknown as { label: string };
  const training = diploma.training as unknown as
    | { label?: string }
    | undefined;

  return {
    valid: true,
    student: `${student.firstname} ${student.lastname}`,
    school: school.label,
    training: training?.label,
    grade: diploma.grade,
    graduationDate: diploma.graduationDate,
    generatedAt: diploma.generatedAt,
    state: diploma.state,
  };
}
