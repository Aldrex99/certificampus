export type UserRole = "school" | "admin";
export type StudentStatus = "admis" | "ajourne";

export interface AuthUser {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: UserRole;
  school?: string;
  isVerified: boolean;
}

export interface Student {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
  status: StudentStatus;
  grade?: string;
  graduationDate?: string;
  isCertified: boolean;
  training?: { _id: string; label: string } | string;
  speciality?: { _id: string; label: string } | string;
}

export interface Training {
  _id: string;
  label: string;
  description?: string;
  level?: string;
  specialities?: { _id: string; label: string }[];
}

export interface Diploma {
  _id: string;
  qrToken: string;
  state: "draft" | "generated" | "published";
  fileUrl?: string;
  grade?: string;
}

export interface School {
  _id: string;
  label: string;
  address?: string;
  region?: string;
  isActive: boolean;
  owner?: {
    firstname: string;
    lastname: string;
    email: string;
    isVerified: boolean;
  };
  subscription?: { name: string; status: string };
  createdAt: string;
}

export interface Subscription {
  _id: string;
  name?: string;
  type?: "monthly" | "yearly" | "one-time";
  price?: number;
  status: "active" | "pending" | "cancelled" | "expired";
  school?: { label: string } | string;
  plan?: Plan | string;
  usedThisPeriod?: number;
  currentPeriodEnd?: string;
}

export interface Plan {
  _id: string;
  name: string;
  description?: string;
  price: number;
  interval: "month" | "year";
  certificateQuota: number;
  stripePriceId?: string;
  isActive: boolean;
}

/** School's current subscription with usage, as returned by /billing/subscription. */
export interface CurrentSubscription {
  subscription: Subscription | null;
  plan: Plan | null;
  quota: number;
  used: number;
  remaining: number;
  periodEnd: string | null;
}

export interface TemplateDiploma {
  _id: string;
  name: string;
  content: string;
  isDefault: boolean;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

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

export interface AdminDashboard {
  totals: {
    schools: number;
    activeSchools: number;
    diplomas: number;
    subscriptions: number;
  };
  schoolsByYear: { year: number; count: number }[];
  growthVsLastYear: number;
}
