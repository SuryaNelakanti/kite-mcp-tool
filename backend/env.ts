import dotenv from 'dotenv-safe';

dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? '*',
} as const;

export type Env = typeof env;

export default env;
