import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  PORT: process.env.PORT || 3001,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.7-flash',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'cakekulator-bd',
  SESSIONS_DIR: process.env.SESSIONS_DIR || './sessions',
  // Configuración de reintentos y timeouts
  MAX_RECONNECT_RETRIES: 5,
  BOT_NAME: 'Cakekulator Bot'
};
