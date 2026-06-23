import * as XLSX from "xlsx";
import { StudentStatus } from "../types";

export interface ParsedStudentRow {
  firstname: string;
  lastname: string;
  email: string;
  training?: string;
  speciality?: string;
  status: StudentStatus;
  grade?: string;
  graduationDate?: Date;
}

/** Column header aliases accepted in the uploaded Excel file (FR/EN). */
const HEADER_MAP: Record<string, keyof ParsedStudentRow> = {
  firstname: "firstname",
  prenom: "firstname",
  prénom: "firstname",
  lastname: "lastname",
  nom: "lastname",
  email: "email",
  mail: "email",
  "e-mail": "email",
  training: "training",
  formation: "training",
  niveau: "training",
  speciality: "speciality",
  specialite: "speciality",
  spécialité: "speciality",
  status: "status",
  statut: "status",
  etat: "status",
  état: "status",
  grade: "grade",
  mention: "grade",
  graduationdate: "graduationDate",
  datediplome: "graduationDate",
  "date de diplome": "graduationDate",
};

function normaliseHeader(h: string): keyof ParsedStudentRow | undefined {
  return HEADER_MAP[h.trim().toLowerCase()];
}

function normaliseStatus(value: unknown): StudentStatus {
  const v = String(value ?? "")
    .trim()
    .toLowerCase();
  if (
    [
      "admis",
      "admitted",
      "reussi",
      "réussi",
      "pass",
      "passed",
      "true",
      "1",
    ].includes(v)
  ) {
    return "admis";
  }
  return "ajourne";
}

/**
 * Parses a workbook buffer (first sheet) into student rows.
 * Throws on a completely empty / header-less file.
 */
export function parseStudentsWorkbook(buffer: Buffer): ParsedStudentRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName)
    throw new Error("Le fichier Excel ne contient aucune feuille.");

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });
  if (rows.length === 0) throw new Error("Le fichier Excel est vide.");

  return rows
    .map((raw) => {
      const row: Partial<ParsedStudentRow> = {};
      for (const [key, value] of Object.entries(raw)) {
        const field = normaliseHeader(key);
        if (!field) continue;
        // Several header aliases can map to the same field (e.g. status/statut).
        // Skip empty cells so a blank alias column never overwrites a filled one.
        if (value === "" || value === null || value === undefined) continue;
        if (field === "status") {
          row.status = normaliseStatus(value);
        } else if (field === "graduationDate") {
          if (value instanceof Date) row.graduationDate = value;
          else if (value) {
            const d = new Date(String(value));
            if (!Number.isNaN(d.getTime())) row.graduationDate = d;
          }
        } else {
          row[field] = String(value ?? "").trim() as never;
        }
      }
      if (!row.status) row.status = "ajourne";
      return row as ParsedStudentRow;
    })
    .filter((r) => r.firstname && r.lastname && r.email);
}

/** Builds an empty template workbook (buffer) to guide schools' imports. */
export function buildStudentTemplate(): Buffer {
  const headers = [
    "firstname",
    "lastname",
    "email",
    "training",
    "speciality",
    "status",
    "grade",
    "graduationDate",
  ];
  const example = [
    {
      firstname: "Jeanne",
      lastname: "Dupont",
      email: "jeanne.dupont@example.com",
      training: "Master Développement Web",
      speciality: "Full-Stack",
      status: "admis",
      grade: "Bien",
      graduationDate: "2026-06-30",
    },
  ];
  const worksheet = XLSX.utils.json_to_sheet(example, { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "students");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
