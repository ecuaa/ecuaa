import Constants from 'expo-constants';

/**
 * Resolves the backend base URL. Override by setting `extra.apiBaseUrl` in app.json/app.config,
 * or the EXPO_PUBLIC_API_BASE_URL env var. Falls back to localhost for the Expo dev client.
 */
function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (fromEnv) return fromEnv;
  const fromExtra = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;
  if (fromExtra) return fromExtra;
  return 'http://localhost:4000';
}

export const API_BASE_URL = resolveApiBaseUrl();
