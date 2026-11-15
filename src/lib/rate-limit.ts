/**
 * Tiny in-memory fixed-window rate limiter. Fine for a single long-running
 * Node process (Railway, Docker, a VM). On serverless or multi-instance
 * deployments, swap this for Redis/Upstash or your platform's limiter.
 */
type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    if (store.size > 10_000) {
      for (const [k, v] of store) if (v.resetAt < now) store.delete(k);
    }
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}
