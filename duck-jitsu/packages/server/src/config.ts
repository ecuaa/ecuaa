export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-insecure-secret-change-me',
  dbPath: process.env.DB_PATH ?? './data/duckjitsu.db',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
};
