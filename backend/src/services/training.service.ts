import { FilterQuery, Types } from "mongoose";
import { Training, ITraining } from "../models";
import { ApiError } from "../utils/ApiError";
import { Pagination } from "../utils/context";
import {
  CreateTrainingInput,
  UpdateTrainingInput,
} from "../validators/training.schema";

export async function listTrainings(
  schoolId: string,
  search: string | undefined,
  pagination: Pagination,
): Promise<{ items: ITraining[]; total: number; page: number; limit: number }> {
  const query: FilterQuery<ITraining> = {
    school: new Types.ObjectId(schoolId),
  };
  if (search) query.label = new RegExp(search.trim(), "i");

  const [items, total] = await Promise.all([
    Training.find(query)
      .populate("specialities", "label")
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Training.countDocuments(query),
  ]);
  return { items, total, page: pagination.page, limit: pagination.limit };
}

export async function createTraining(
  schoolId: string,
  input: CreateTrainingInput,
): Promise<ITraining> {
  return Training.create({ ...input, school: new Types.ObjectId(schoolId) });
}

export async function updateTraining(
  schoolId: string,
  id: string,
  input: UpdateTrainingInput,
): Promise<ITraining> {
  const training = await Training.findOneAndUpdate(
    { _id: id, school: schoolId },
    { $set: input },
    { new: true, runValidators: true },
  );
  if (!training) throw ApiError.notFound("Formation introuvable");
  return training;
}

export async function deleteTrainings(
  schoolId: string,
  ids: string[],
): Promise<number> {
  const result = await Training.deleteMany({
    _id: { $in: ids },
    school: schoolId,
  });
  return result.deletedCount ?? 0;
}
