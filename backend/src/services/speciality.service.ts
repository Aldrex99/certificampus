import { FilterQuery, Types } from "mongoose";
import { Speciality, ISpeciality, Training, Student } from "../models";
import { ApiError } from "../utils/ApiError";
import { Pagination } from "../utils/context";
import {
  CreateSpecialityInput,
  UpdateSpecialityInput,
} from "../validators/speciality.schema";

/** A speciality enriched with the formation it is attached to (if any). */
type SpecialityWithTraining = ReturnType<ISpeciality["toObject"]> & {
  training: { _id: Types.ObjectId; label: string } | null;
};

/**
 * Enforce the single-formation rule: detach the speciality from every training
 * of the school, then attach it to the selected one (if any).
 */
async function syncSpecialityTraining(
  schoolId: string,
  specialityId: string,
  trainingId: string | undefined,
): Promise<void> {
  await Training.updateMany(
    { school: schoolId, specialities: specialityId },
    { $pull: { specialities: specialityId } },
  );
  if (trainingId) {
    await Training.updateOne(
      { _id: trainingId, school: schoolId },
      { $addToSet: { specialities: specialityId } },
    );
  }
}

export async function listSpecialities(
  schoolId: string,
  search: string | undefined,
  pagination: Pagination,
): Promise<{
  items: SpecialityWithTraining[];
  total: number;
  page: number;
  limit: number;
}> {
  const query: FilterQuery<ISpeciality> = {
    school: new Types.ObjectId(schoolId),
  };
  if (search) query.label = new RegExp(search.trim(), "i");

  const [items, total] = await Promise.all([
    Speciality.find(query)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Speciality.countDocuments(query),
  ]);

  // The relationship lives on the Training side, so resolve each speciality's
  // formation by looking up the trainings that reference it.
  const specialityIds = items.map((s) => s._id);
  const trainings = await Training.find(
    { school: new Types.ObjectId(schoolId), specialities: { $in: specialityIds } },
    "label specialities",
  );
  const trainingBySpeciality = new Map<
    string,
    { _id: Types.ObjectId; label: string }
  >();
  for (const t of trainings) {
    for (const sid of t.specialities) {
      trainingBySpeciality.set(sid.toString(), { _id: t._id, label: t.label });
    }
  }

  const itemsWithTraining: SpecialityWithTraining[] = items.map((s) => ({
    ...s.toObject(),
    training: trainingBySpeciality.get(s._id.toString()) ?? null,
  }));

  return {
    items: itemsWithTraining,
    total,
    page: pagination.page,
    limit: pagination.limit,
  };
}

export async function createSpeciality(
  schoolId: string,
  input: CreateSpecialityInput,
): Promise<ISpeciality> {
  const { training, ...rest } = input;
  const speciality = await Speciality.create({
    ...rest,
    school: new Types.ObjectId(schoolId),
  });
  if (training) {
    await syncSpecialityTraining(schoolId, speciality._id.toString(), training);
  }
  return speciality;
}

export async function updateSpeciality(
  schoolId: string,
  id: string,
  input: UpdateSpecialityInput,
): Promise<ISpeciality> {
  const { training, ...rest } = input;
  const speciality = await Speciality.findOneAndUpdate(
    { _id: id, school: schoolId },
    { $set: rest },
    { new: true, runValidators: true },
  );
  if (!speciality) throw ApiError.notFound("Spécialité introuvable");
  // Only re-sync the association when the caller actually sent the field
  // ("" detaches it, an id attaches it to that formation).
  if (training !== undefined) {
    await syncSpecialityTraining(schoolId, id, training);
  }
  return speciality;
}

export async function deleteSpecialities(
  schoolId: string,
  ids: string[],
): Promise<number> {
  const result = await Speciality.deleteMany({
    _id: { $in: ids },
    school: schoolId,
  });
  // Detach the deleted specialities from any training/student that referenced
  // them, so we don't leave dangling references behind.
  await Promise.all([
    Training.updateMany(
      { school: schoolId, specialities: { $in: ids } },
      { $pull: { specialities: { $in: ids } } },
    ),
    Student.updateMany(
      { school: schoolId, speciality: { $in: ids } },
      { $unset: { speciality: "" } },
    ),
  ]);
  return result.deletedCount ?? 0;
}
