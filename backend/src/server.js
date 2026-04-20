import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectMongo } from "./config/mongo.js";

async function bootstrap() {
  await connectMongo();

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
