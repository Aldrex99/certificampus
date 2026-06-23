import { Types } from "mongoose";
import { Student, Diploma, Training } from "../models";

export interface SchoolDashboard {
  totals: {
    students: number;
    trainings: number;
    imports: number;
    diplomasGenerated: number;
    diplomasSent: number;
  };
  success: { admis: number; ajourne: number };
  certification: { certified: number; notCertified: number };
  yearlyTrend: {
    year: number;
    admis: number;
    total: number;
    successRate: number;
  }[];
}

/**
 * Aggregates the statistics shown on the school dashboard:
 * - success ratio (admis vs ajourné)
 * - certification ratio (certified vs not)
 * - year-over-year success trend (N, N-1, N-2)
 */
export async function getSchoolDashboard(
  schoolId: string,
): Promise<SchoolDashboard> {
  const school = new Types.ObjectId(schoolId);

  const [
    students,
    admis,
    certified,
    trainings,
    diplomasGenerated,
    diplomasSent,
  ] = await Promise.all([
    Student.countDocuments({ school }),
    Student.countDocuments({ school, status: "admis" }),
    Student.countDocuments({ school, isCertified: true }),
    Training.countDocuments({ school }),
    Diploma.countDocuments({ school }),
    Diploma.countDocuments({ school, sentAt: { $ne: null } }),
  ]);

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  const yearlyTrend = await Promise.all(
    years.map(async (year) => {
      const start = new Date(year, 0, 1);
      const end = new Date(year + 1, 0, 1);
      const [total, yearAdmis] = await Promise.all([
        Student.countDocuments({
          school,
          createdAt: { $gte: start, $lt: end },
        }),
        Student.countDocuments({
          school,
          status: "admis",
          createdAt: { $gte: start, $lt: end },
        }),
      ]);
      return {
        year,
        admis: yearAdmis,
        total,
        successRate: total ? Math.round((yearAdmis / total) * 100) : 0,
      };
    }),
  );

  return {
    totals: {
      students,
      trainings,
      imports: 0,
      diplomasGenerated,
      diplomasSent,
    },
    success: { admis, ajourne: students - admis },
    certification: { certified, notCertified: students - certified },
    yearlyTrend,
  };
}
