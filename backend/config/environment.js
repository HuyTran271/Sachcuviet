import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

// Prefer backend/.env, fall back to the existing project-root .env.
// Variables already supplied by the process keep their values.
dotenv.config({
  path: [
    fileURLToPath(new URL('../.env', import.meta.url)),
    fileURLToPath(new URL('../../.env', import.meta.url)),
  ],
  quiet: true,
});
