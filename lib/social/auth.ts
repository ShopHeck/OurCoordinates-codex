import { timingSafeEqual } from 'node:crypto';

function equals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function isOperator(request: Request): boolean {
  const password = process.env.SOCIAL_ADMIN_PASSWORD;
  if (!password) return false;
  const header = request.headers.get('authorization') ?? '';
  if (!header.startsWith('Basic ')) return false;
  try {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const separator = decoded.indexOf(':');
    const user = decoded.slice(0, separator);
    const secret = decoded.slice(separator + 1);
    return user === 'owner' && Boolean(secret) && equals(secret, password);
  } catch {
    return false;
  }
}

export function isWatcher(request: Request): boolean {
  const token = process.env.SOCIAL_CRON_TOKEN;
  const header = request.headers.get('authorization') ?? '';
  return Boolean(token) && header.startsWith('Bearer ') && equals(header.slice(7), token!);
}

export function unauthorized(): Response {
  return new Response('Owner sign-in required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="OurCoordinates social approvals", charset="UTF-8"', 'Cache-Control': 'no-store' }
  });
}

export function sameOrigin(request: Request): boolean {
  return request.headers.get('origin') === new URL(request.url).origin;
}
