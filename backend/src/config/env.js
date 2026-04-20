import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_URL: z.string().url(),
  MONGO_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/medical_research_assistant"),
});

export const env = envSchema.parse(process.env);
