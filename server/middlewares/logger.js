import fs from 'fs';
import path from 'path';
import winston from 'winston';
import chalk from 'chalk';

function dateStamp(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function logsDir() {
  return path.join(process.cwd(), 'server', 'logs');
}

function ensureLogsDir() {
  fs.mkdirSync(logsDir(), { recursive: true });
}

function filePath(name) {
  const date = dateStamp();
  return path.join(logsDir(), `[${date}][${name}].log`);
}

function levelColor(level) {
  const value = String(level || '').toLowerCase();
  if (value === 'error') return chalk.red;
  if (value === 'warn' || value === 'warning') return chalk.yellow;
  if (value === 'info') return chalk.cyan;
  if (value === 'debug') return chalk.gray;
  return chalk.white;
}

function formatMeta(meta, { compact = false } = {}) {
  if (!meta || typeof meta !== 'object') return '';
  try {
    const clean = {};
    for (const [k, v] of Object.entries(meta)) {
      if (v === undefined) continue;
      if (compact && (k === 'userAgent' || k === 'authorization')) continue;
      clean[k] = v;
    }
    const json = JSON.stringify(clean);
    return json === '{}' ? '' : ` ${chalk.gray(json)}`;
  } catch {
    return '';
  }
}

export function getLogger(name) {
  ensureLogsDir();

  const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

  const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.printf(info => {
      const meta = info.meta ? ` ${JSON.stringify(info.meta)}` : '';
      return `[${info.timestamp}][${name}][${info.level}] ${info.message}${meta}`;
    })
  );

  const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.printf(info => {
      const lvl = String(info.level || 'info');
      const color = levelColor(lvl);
      const ts = chalk.dim(`[${info.timestamp}]`);
      const loggerName = chalk.magenta(`[${name}]`);
      const levelTag = color(`[${lvl}]`);
      const msg = chalk.white(info.message);
      const meta = formatMeta(info.meta, { compact: true });
      return `${ts}${loggerName}${levelTag} ${msg}${meta}`;
    })
  );

  const transports = [
    new winston.transports.File({ filename: filePath(name), level, format: fileFormat })
  ];

  if (process.env.NODE_ENV !== 'production') {
    transports.push(new winston.transports.Console({ level, format: consoleFormat }));
  }

  return winston.createLogger({ level, transports });
}

export const authLogger = getLogger('auth');
