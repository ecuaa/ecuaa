export function resolveConfig() {
  return {
    port: Number(process.env.PORT ?? 4000),
    jwtSecret: process.env.JWT_SECRET ?? 'dev-only-insecure-secret-change-me',
    dbPath: process.env.DB_PATH ?? './data/duckjitsu.db',
    // `||` (not `??`) deliberately -- an env var set to an empty/blank string should also fall
    // back to the default, not produce an empty Access-Control-Allow-Origin header.
    corsOrigin: process.env.CORS_ORIGIN?.trim() || '*',
  };
}

export const config = resolveConfig();
