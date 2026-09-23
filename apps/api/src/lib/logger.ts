import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password'],
    censor: '[REDACTED]'
  },
  base: undefined
});

export function maskE164(e164: string): string {
  const s = e164.replace(/\D/g, '');
  if (s.length <= 6) return '+***';
  const head = `${s.slice(0, 3)}***`;
  const tail = s.slice(-3);
  return `+${head}${tail}`;
}

export function truncateMessage(msg: string, max = 60): string {
  return msg.length > max ? `${msg.slice(0, max)}...` : msg;
}