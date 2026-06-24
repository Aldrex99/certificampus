import dotenv from "dotenv";
import path from "path";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    if (process.env.NODE_ENV === "test") return "";
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProd: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
  port: Number(process.env.PORT ?? 4000),
  seedOnStart: process.env.SEED_ON_START !== "false",
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  publicUrl: process.env.PUBLIC_URL ?? "http://localhost:4000",

  mongoUri: required("MONGO_URI", "mongodb://127.0.0.1:27017/certificampus"),

  // Access / refresh token secrets
  jwtAccessSecret:
    process.env.JWT_ACCESS_SECRET ?? "dev-access-secret-change-me",
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret-change-me",
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? "15m",
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL ?? "7d",
  // Cookie lifetimes in milliseconds.
  accessCookieMaxAge: 15 * 60 * 1000,
  refreshCookieMaxAge: 7 * 24 * 60 * 60 * 1000,
  refreshCookiePath: "/api/v1/auth",

  sparkpostApiKey: process.env.SPARKPOST_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "no-reply@certificampus.app",
  emailFromName: process.env.EMAIL_FROM_NAME ?? "CertifiCampus",

  diplomaDir: path.resolve(
    process.cwd(),
    process.env.DIPLOMA_DIR ?? "storage/diplomas",
  ),
};
