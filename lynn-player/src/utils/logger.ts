type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  source?: string;
}

const LOG_STORAGE_KEY = 'lynn-player-logs';
const MAX_LOG_ENTRIES = 1000;

class Logger {
  private logs: LogEntry[] = [];
  private level: LogLevel = 'info';

  constructor() {
    this.loadLogs();
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private addLog(level: LogLevel, message: string, data?: any, source?: string) {
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
      data,
      source,
    };

    this.logs.push(entry);

    if (this.logs.length > MAX_LOG_ENTRIES) {
      this.logs = this.logs.slice(-MAX_LOG_ENTRIES);
    }

    this.saveLogs();

    if (this.shouldLog(level)) {
      const consoleMethod = level === 'debug' ? 'log' : level;
      const formattedMessage = `[${entry.timestamp}] [${level.toUpperCase()}]${source ? ` [${source}]` : ''}: ${message}`;
      
      if (data !== undefined) {
        (console as any)[consoleMethod](formattedMessage, data);
      } else {
        (console as any)[consoleMethod](formattedMessage);
      }
    }
  }

  debug(message: string, data?: any, source?: string) {
    this.addLog('debug', message, data, source);
  }

  info(message: string, data?: any, source?: string) {
    this.addLog('info', message, data, source);
  }

  warn(message: string, data?: any, source?: string) {
    this.addLog('warn', message, data, source);
  }

  error(message: string, data?: any, source?: string) {
    this.addLog('error', message, data, source);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
    this.saveLogs();
  }

  private saveLogs() {
    try {
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to save logs:', error);
    }
  }

  private loadLogs() {
    try {
      const saved = localStorage.getItem(LOG_STORAGE_KEY);
      if (saved) {
        this.logs = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  }
}

export const logger = new Logger();
