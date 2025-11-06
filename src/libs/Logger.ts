/**
 * Simple Console Logger
 *
 * Replaces LogTape and Better Stack for HIPAA compliance simplification.
 * All logs are written to console for local development and Vercel logs in production.
 */

type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'fatal';

type LogContext = {
  [key: string]: unknown;
};

class Logger {
  private category: string[];

  constructor(category: string[]) {
    this.category = category;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const categoryStr = this.category.join(':');
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] [${categoryStr}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    console.error(this.formatMessage('debug', message, context));
  }

  info(message: string, context?: LogContext): void {
    console.info(this.formatMessage('info', message, context));
  }

  warning(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warning', message, context));
  }

  error(message: string, context?: LogContext): void {
    console.error(this.formatMessage('error', message, context));
  }

  fatal(message: string, context?: LogContext): void {
    console.error(this.formatMessage('fatal', message, context));
  }
}

export function getLogger(category: string[]): Logger {
  return new Logger(category);
}

// Default app logger
export const logger = getLogger(['app']);
