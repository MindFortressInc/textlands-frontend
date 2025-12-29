/**
 * Error handling utilities for TextLands frontend
 */

// Safe localStorage wrapper that handles private browsing and quota errors
export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (err) {
      console.warn(`[Storage] Failed to read '${key}':`, err);
      return null;
    }
  },

  setItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (err) {
      console.warn(`[Storage] Failed to write '${key}':`, err);
      return false;
    }
  },

  removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (err) {
      console.warn(`[Storage] Failed to remove '${key}':`, err);
      return false;
    }
  },

  getJSON<T>(key: string, fallback: T): T {
    const value = this.getItem(key);
    if (!value) return fallback;
    try {
      return JSON.parse(value) as T;
    } catch {
      console.warn(`[Storage] Failed to parse '${key}' as JSON`);
      return fallback;
    }
  },

  setJSON(key: string, value: unknown): boolean {
    try {
      return this.setItem(key, JSON.stringify(value));
    } catch {
      console.warn(`[Storage] Failed to stringify value for '${key}'`);
      return false;
    }
  },
};

// Error logging with context
type ErrorContext = Record<string, unknown>;

export function logError(
  tag: string,
  message: string,
  error?: unknown,
  context?: ErrorContext
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);

  console.error(`[${tag}] ${message}`, {
    error: errorMessage,
    ...context,
  });

  // Future: Send to error tracking service (Sentry, etc.)
}

export function logWarning(
  tag: string,
  message: string,
  context?: ErrorContext
): void {
  console.warn(`[${tag}] ${message}`, context);
}

// Network error detection
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    const message = error.message.toLowerCase();
    return (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("failed to fetch")
    );
  }
  return false;
}

// User-friendly error message extraction
export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error instanceof Error) {
    // Check for common network errors
    if (isNetworkError(error)) {
      return "Network error - check your connection";
    }
    return error.message || fallback;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }

  return fallback;
}

// Setup global error handlers (call once at app init)
export function setupGlobalErrorHandlers(): void {
  if (typeof window === "undefined") return;

  // Unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    logError(
      "Global",
      "Unhandled promise rejection",
      event.reason,
      { type: "unhandledrejection" }
    );
  });

  // Global errors
  window.addEventListener("error", (event) => {
    logError(
      "Global",
      "Uncaught error",
      event.error || event.message,
      {
        type: "error",
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }
    );
  });
}
