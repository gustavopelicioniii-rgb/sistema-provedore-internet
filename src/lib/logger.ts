// Structured logging utility
// In production, this should send to a logging service (Datadog, CloudWatch, etc.)

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

interface LogEntry {
  timestamp?: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
}

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

function formatLog(entry: LogEntry): string {
  return JSON.stringify({
    ...entry,
    timestamp: new Date().toISOString(),
    environment: import.meta.env.MODE,
  });
}

function shouldLog(level: LogLevel): boolean {
  if (isDevelopment) return true;
  // In production, don't log debug
  return level !== LogLevel.DEBUG;
}

// Mask sensitive data before logging
function maskSensitiveData(obj: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ["password", "token", "key", "secret", "cpf", "cnpj", "creditCard"];
  const masked = { ...obj };
  
  for (const key of Object.keys(masked)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      masked[key] = "***MASKED***";
    } else if (typeof masked[key] === "object" && masked[key] !== null) {
      masked[key] = maskSensitiveData(masked[key] as Record<string, unknown>);
    }
  }
  
  return masked;
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => {
    if (shouldLog(LogLevel.DEBUG)) {
      console.debug(formatLog({ level: LogLevel.DEBUG, message, context: context ? maskSensitiveData(context) : undefined }));
    }
  },

  info: (message: string, context?: Record<string, unknown>) => {
    if (shouldLog(LogLevel.INFO)) {
      console.info(formatLog({ level: LogLevel.INFO, message, context: context ? maskSensitiveData(context) : undefined }));
    }
  },

  warn: (message: string, context?: Record<string, unknown>) => {
    if (shouldLog(LogLevel.WARN)) {
      console.warn(formatLog({ level: LogLevel.WARN, message, context: context ? maskSensitiveData(context) : undefined }));
    }
  },

  error: (message: string, context?: Record<string, unknown>) => {
    if (shouldLog(LogLevel.ERROR)) {
      console.error(formatLog({ level: LogLevel.ERROR, message, context: context ? maskSensitiveData(context) : undefined }));
      
      // In production, you would send this to an error tracking service
      if (isProduction) {
        // Example: Sentry.captureException(new Error(message), { extra: context });
      }
    }
  },
};

// Log important user actions for audit trail
export const auditLog = {
  login: (userId: string, method: "email" | "cpf") => {
    logger.info("User logged in", { userId, method });
  },
  
  logout: (userId: string) => {
    logger.info("User logged out", { userId });
  },
  
  action: (userId: string, action: string, resource?: string) => {
    logger.info("User action", { userId, action, resource });
  },
  
  security: (event: "rate_limit" | "auth_failure" | "unauthorized", details: Record<string, unknown>) => {
    logger.warn("Security event", { event, ...details });
  },
};
