import 'dotenv/config';

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saarthi',
  jwtSecret: process.env.JWT_SECRET || 'dev_only_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim()),
  geminiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@saarthi.in',
  adminPassword: process.env.ADMIN_PASSWORD || 'ChangeMe@123',
};

if (env.nodeEnv === 'production' && env.jwtSecret === 'dev_only_secret') {
  throw new Error('JWT_SECRET must be set in production');
}
