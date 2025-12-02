/**
 * Development Logger Utility
 * Only logs in development mode to avoid exposing sensitive data in production
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error';

class Logger {
  private isDev = process.env.NODE_ENV === 'development';

  private log(level: LogLevel, ...args: any[]) {
    if (this.isDev) {
      console[level]('[v0-dev]', ...args);
    }
  }

  debug(...args: any[]) {
    this.log('log', ...args);
  }

  info(...args: any[]) {
    this.log('info', ...args);
  }

  warn(...args: any[]) {
    this.log('warn', ...args);
  }

  error(...args: any[]) {
    this.log('error', ...args);
  }
}

export const devLog = new Logger();
