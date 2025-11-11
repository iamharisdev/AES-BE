import { z } from "zod";

export const envVariables = z.object({
  // could be development or production
  ENVIRONMENT_TYPE: z.coerce.string(),

  HOST: z.coerce.string().default("127.0.0.1"),
  PORT: z.coerce.number().default(8000),

  UPLOAD_BUCKET: z.coerce.string(),
  VOICE_NOTES_BUCKET: z.coerce.string(),
  OPENAI_API_KEY: z.coerce.string(),
  JWT_SECRET: z.coerce.string(),

  KEYFILE_PATH: z.coerce.string(),

  DATABASE_USERNAME: z.coerce.string(),
  DATABASE_PASSWORD: z.coerce.string(),
  DATABASE_HOST: z.coerce.string(),
  DATABASE_NAME: z.coerce.string(),
  DATABASE_PORT: z.coerce.number().default(5432),
});

export const env = envVariables.parse(process.env);
