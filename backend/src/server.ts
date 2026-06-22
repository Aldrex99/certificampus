import { createApp } from "./app";
import { connectDatabase } from "./config/db";
import { env } from "./config/env";

async function bootstrap(): Promise<void> {
  await connectDatabase();
  const app = createApp();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(
      `[server] CertifiCampus API listening on http://localhost:${env.port}`,
    );
    // eslint-disable-next-line no-console
    console.log(`[server] API docs at http://localhost:${env.port}/docs`);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[server] Failed to start", err);
  process.exit(1);
});
