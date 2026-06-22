import { Request } from "express";

export type UserRole = "school" | "admin";

export interface AuthPayload {
  sub: string;
  role: UserRole;
  school?: string;
}

export interface AuthRequest extends Request {
  auth?: AuthPayload;
}

export type StudentStatus = "admis" | "ajourne";
export type SubscriptionStatus = "active" | "pending" | "cancelled" | "expired";
export type DiplomaState = "draft" | "generated" | "published";
