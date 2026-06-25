import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import routes from "./routes";
import * as billingController from "./controllers/billing.controller";
import { notFoundHandler, errorHandler } from "./middleware/error";
import { swaggerSpec } from "./config/swagger";
import { env } from "./config/env";

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.clientUrl, credentials: true }));

  // Stripe webhook needs the raw body for signature verification, so it must
  // be registered before the JSON body parser.
  app.post(
    "/api/v1/billing/webhook",
    express.raw({ type: "application/json" }),
    billingController.webhook,
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  if (!env.isTest) app.use(morgan("dev"));

  // Serve generated diploma PDFs statically.
  app.use("/diplomas", express.static(env.diplomaDir));

  // API docs
  if (!env.isProd) {
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }

  app.use("/api/v1", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
