import 'dotenv/config';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const PORT = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 3001;
const CLIENT_URL = process.env['CLIENT_URL'] ?? 'http://localhost:5173';
const NODE_ENV = process.env['NODE_ENV'] ?? 'development';
const isTest = NODE_ENV === 'test';
const DB_PATH = process.env['DB_PATH'] ?? (isTest ? ':memory:' : join(__dirname, '..', '..', 'db', 'braingames.db'));

if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error(`Invalid PORT: "${process.env['PORT']}". Must be a number between 1 and 65535.`);
}

export const config = Object.freeze({
  PORT,
  CLIENT_URL,
  NODE_ENV,
  DB_PATH,
  isDev: NODE_ENV === 'development',
  isProd: NODE_ENV === 'production',
  isTest,
});
