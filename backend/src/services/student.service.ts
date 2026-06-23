import { FilterQuery, Types } from "mongoose";
import { Student, IStudent, Training, Speciality } from "../models";
import { ApiError } from "../utils/ApiError";
import { Pagination } from "../utils/context";
import { ParsedStudentRow, parseStudentsWorkbook } from "../utils/excel";
import {
  CreateStudentInput,
  UpdateStudentInput,
} from "../validators/student.schema";

export interface StudentFilters {
  search?: string;
  status?: "admis" | "ajourne";
  training?: string;
}

export interface PaginatedStudents {
  items: IStudent[];
  total: number;
  page: number;
  limit: number;
}

function buildQuery(
  schoolId: string,
  filters: StudentFilters,
): FilterQuery<IStudent> {
  const query: FilterQuery<IStudent> = { school: new Types.ObjectId(schoolId) };
  if (filters.status) query.status = filters.status;
  if (filters.training && Types.ObjectId.isValid(filters.training)) {
    query.training = new Types.ObjectId(filters.training);
  }
  if (filters.search) {
    const re = new RegExp(filters.search.trim(), "i");
    query.$or = [{ firstname: re }, { lastname: re }, { email: re }];
  }
  return query;
}

export async function listStudents(
  schoolId: string,
  filters: StudentFilters,
  pagination: Pagination,
): Promise<PaginatedStudents> {
  const query = buildQuery(schoolId, filters);
  const [items, total] = await Promise.all([
    Student.find(query)
      .populate("training", "label")
      .populate("speciality", "label")
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Student.countDocuments(query),
  ]);
  return { items, total, page: pagination.page, limit: pagination.limit };
}

export async function getStudent(
  schoolId: string,
  id: string,
): Promise<IStudent> {
  const student = await Student.findOne({ _id: id, school: schoolId })
    .populate("training", "label")
    .populate("speciality", "label");
  if (!student) throw ApiError.notFound("Étudiant introuvable");
  return student;
}

export async function createStudent(
  schoolId: string,
  input: CreateStudentInput,
): Promise<IStudent> {
  return Student.create({ ...input, school: new Types.ObjectId(schoolId) });
}

export async function updateStudent(
  schoolId: string,
  id: string,
  input: UpdateStudentInput,
): Promise<IStudent> {
  const student = await Student.findOneAndUpdate(
    { _id: id, school: schoolId },
    { $set: input },
    { new: true, runValidators: true },
  );
  if (!student) throw ApiError.notFound("Étudiant introuvable");
  return student;
}

export async function deleteStudents(
  schoolId: string,
  ids: string[],
): Promise<number> {
  const result = await Student.deleteMany({
    _id: { $in: ids },
    school: schoolId,
  });
  return result.deletedCount ?? 0;
}

/** Resolves a training/speciality by label for a school, creating it if absent. */
async function resolveTraining(
  schoolId: string,
  label?: string,
): Promise<Types.ObjectId | undefined> {
  if (!label) return undefined;
  const existing = await Training.findOneAndUpdate(
    { school: schoolId, label: label.trim() },
    { $setOnInsert: { school: schoolId, label: label.trim() } },
    { new: true, upsert: true },
  );
  return existing._id as Types.ObjectId;
}

async function resolveSpeciality(
  schoolId: string,
  label?: string,
): Promise<Types.ObjectId | undefined> {
  if (!label) return undefined;
  const existing = await Speciality.findOneAndUpdate(
    { school: schoolId, label: label.trim() },
    { $setOnInsert: { school: schoolId, label: label.trim() } },
    { new: true, upsert: true },
  );
  return existing._id as Types.ObjectId;
}

export interface ImportSummary {
  received: number;
  created: number;
  updated: number;
  skipped: number;
}

/**
 * Imports learners from a parsed Excel buffer. Rows are upserted by
 * (school, email); referenced trainings/specialities are auto-created.
 */
export async function importStudentsFromBuffer(
  schoolId: string,
  buffer: Buffer,
): Promise<ImportSummary> {
  let rows: ParsedStudentRow[];
  try {
    rows = parseStudentsWorkbook(buffer);
  } catch (err) {
    throw ApiError.badRequest((err as Error).message);
  }
  if (rows.length === 0)
    throw ApiError.badRequest("Aucune ligne valide dans le fichier");

  const summary: ImportSummary = {
    received: rows.length,
    created: 0,
    updated: 0,
    skipped: 0,
  };

  for (const row of rows) {
    try {
      const [training, speciality] = await Promise.all([
        resolveTraining(schoolId, row.training),
        resolveSpeciality(schoolId, row.speciality),
      ]);

      const res = await Student.updateOne(
        { school: schoolId, email: row.email.toLowerCase() },
        {
          $set: {
            firstname: row.firstname,
            lastname: row.lastname,
            status: row.status,
            grade: row.grade,
            graduationDate: row.graduationDate,
            ...(training ? { training } : {}),
            ...(speciality ? { speciality } : {}),
          },
          $setOnInsert: {
            school: new Types.ObjectId(schoolId),
            email: row.email.toLowerCase(),
          },
        },
        { upsert: true },
      );

      if (res.upsertedCount) summary.created += 1;
      else if (res.modifiedCount) summary.updated += 1;
      else summary.skipped += 1;
    } catch {
      summary.skipped += 1;
    }
  }

  return summary;
}
