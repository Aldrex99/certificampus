import { FilterQuery, Types } from "mongoose";
import { Speciality, ISpeciality, Training, Student } from "../models";
import { ApiError } from "../utils/ApiError";
import { Pagination } from "../utils/context";
import {
  CreateSpecialityInput,
  UpdateSpecialityInput,
} from "../validators/speciality.schema";

export async function listSpecialities(
  schoolId: string,
  search: string | undefined,
  pagination: Pagination,
): Promise<{
  items: ISpeciality[];
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
  return { items, total, page: pagination.page, limit: pagination.limit };
}

export async function createSpeciality(
  schoolId: string,
  input: CreateSpecialityInput,
): Promise<ISpeciality> {
  return Speciality.create({ ...input, school: new Types.ObjectId(schoolId) });
}

export async function updateSpeciality(
  schoolId: string,
  id: string,
  input: UpdateSpecialityInput,
): Promise<ISpeciality> {
  const speciality = await Speciality.findOneAndUpdate(
    { _id: id, school: schoolId },
    { $set: input },
    { new: true, runValidators: true },
  );
  if (!speciality) throw ApiError.notFound("Spécialité introuvable");
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
