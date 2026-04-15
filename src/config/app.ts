// Application configuration
// Use environment variables in production

export const appConfig = {
  // App info
  name: import.meta.env.VITE_APP_NAME || "NetPulse ISP",
  version: import.meta.env.VITE_APP_VERSION || "1.0.0",
  environment: import.meta.env.MODE || "development",
  
  // API URLs
  apiUrl: import.meta.env.VITE_API_URL || "/api",
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
  
  // Feature flags
  features: {
    enableDebug: import.meta.env.DEV,
    enableAnalytics: import.meta.env.PROD,
    enableErrorReporting: import.meta.env.PROD,
  },
  
  // Security
  security: {
    maxLoginAttempts: 5,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
  },
  
  // Pagination
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  
  // Timeouts (in ms)
  timeouts: {
    apiRequest: 30000,
    fileUpload: 120000,
  },
} as const;

export type AppConfig = typeof appConfig;

// Validate required environment variables on startup
export function validateEnv(): void {
  const required = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0 && import.meta.env.PROD) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
