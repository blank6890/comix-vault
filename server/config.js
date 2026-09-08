import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CONFIG = {
  PORT: process.env.PORT || 3000,
  HOST: process.env.HOST || '0.0.0.0',
  ENV: process.env.NODE_ENV || 'development',
  DATA_DIR: path.join(__dirname, '..', 'data'),
  CACHE_TTL_MINUTES: parseInt(process.env.CACHE_TTL_MINUTES || '15', 10),
  IMAGE_CACHE_DIR: path.join(__dirname, '..', 'data', 'image_cache'),
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  DEFAULT_SOURCES: ['comix', 'mangadex']
};
