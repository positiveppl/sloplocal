import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type Env = {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SLOP_SCREENSHOT_BUCKET?: string;
};

export const CATEGORIES = ['tools', 'creative', 'games', 'productivity', 'weird'] as const;
export const TYPES = ['web', 'desktop', 'cli', 'plugin', 'mobile'] as const;

export function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'content-type, authorization',
      ...init.headers,
    },
  });
}

export function jsonWithRateLimit(data: unknown, limit: RateLimitResult, init: ResponseInit = {}) {
  return json(data, {
    ...init,
    headers: {
      'x-ratelimit-limit': String(limit.limit),
      'x-ratelimit-remaining': String(limit.remaining),
      'x-ratelimit-reset': limit.resetAt.toISOString(),
      ...init.headers,
    },
  });
}

export function handleOptions() {
  return json({}, { status: 204 });
}

export function publicSupabase(env: Env): SupabaseClient {
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    throw new Error('Supabase public env vars are not configured.');
  }
  return createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
}

export function adminSupabase(env: Env): SupabaseClient {
  if (!env.VITE_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase service role env vars are not configured.');
  }
  return createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

export async function hashKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(key);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function validateApiKey(request: Request, env: Env): Promise<string | null> {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const rawKey = auth.slice(7).trim();
  if (!rawKey.startsWith('slop_live_')) return null;

  const keyHash = await hashKey(rawKey);
  const supabase = adminSupabase(env);
  const { data, error } = await supabase
    .from('api_keys')
    .select('user_id, is_active')
    .eq('key_hash', keyHash)
    .maybeSingle();

  if (error || !data?.is_active) return null;

  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', keyHash);

  return data.user_id as string;
}

export async function validateApiKeyProfile(request: Request, env: Env): Promise<{ userId: string; isBanned: boolean; createdAt: string } | null> {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const rawKey = auth.slice(7).trim();
  if (!rawKey.startsWith('slop_live_')) return null;

  const keyHash = await hashKey(rawKey);
  const supabase = adminSupabase(env);
  const { data, error } = await supabase
    .from('api_keys')
    .select('user_id, is_active')
    .eq('key_hash', keyHash)
    .maybeSingle();

  if (error || !data?.is_active) return null;
  await supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('key_hash', keyHash);

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_banned, created_at')
    .eq('id', data.user_id)
    .maybeSingle();
  return {
    userId: data.user_id as string,
    isBanned: Boolean(profile?.is_banned),
    createdAt: String(profile?.created_at ?? ''),
  };
}

export function normalizeUrl(rawUrl: string): string {
  const u = new URL(rawUrl);
  return `${u.protocol}//${u.hostname}${u.pathname}`.replace(/\/$/, '').toLowerCase();
}

export function validateSubmissionUrl(rawUrl: string): { valid: boolean; reason?: string; normalizedUrl?: string } {
  let parsed: URL;
  try { parsed = new URL(rawUrl); } catch { return { valid: false, reason: 'Invalid URL format.' }; }
  if (!['http:', 'https:'].includes(parsed.protocol)) return { valid: false, reason: 'Only http and https URLs are allowed.' };
  const host = parsed.hostname.toLowerCase();
  if (['localhost', '127.0.0.1', '0.0.0.0'].includes(host) || host.endsWith('.local') || host.startsWith('10.') || host.startsWith('192.168.')) {
    return { valid: false, reason: 'Local or private URLs are not allowed.' };
  }
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return { valid: false, reason: 'Local or private URLs are not allowed.' };
  return { valid: true, normalizedUrl: normalizeUrl(rawUrl) };
}

export async function assertUrlResolves(rawUrl: string): Promise<{ valid: boolean; reason?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    let res = await fetch(rawUrl, { method: 'HEAD', signal: controller.signal });
    if (res.status === 405) res = await fetch(rawUrl, { method: 'GET', signal: controller.signal });
    if (!res.ok) return { valid: false, reason: `URL returned ${res.status}.` };
    return { valid: true };
  } catch {
    return { valid: false, reason: 'URL did not resolve. Make sure the site is live.' };
  } finally {
    clearTimeout(timeout);
  }
}

export type RateLimitResult = { allowed: boolean; limit: number; remaining: number; resetAt: Date };

export async function checkSubmissionLimit(env: Env, userId: string, source: 'web' | 'api'): Promise<RateLimitResult> {
  const limit = source === 'api' ? 3 : 5;
  const windowStart = new Date(Date.now() - 24 * 3600000);
  const { count, error } = await adminSupabase(env)
    .from('submission_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('attempted_at', windowStart.toISOString());
  if (error) throw error;
  const remaining = Math.max(0, limit - (count ?? 0));
  return { allowed: remaining > 0, limit, remaining, resetAt: new Date(Date.now() + 24 * 3600000) };
}

export async function recordSubmissionAttempt(env: Env, userId: string, source: 'web' | 'api') {
  await adminSupabase(env).from('submission_attempts').insert({ user_id: userId, source });
}

export function hotScore(votes: number, createdAt: string): number {
  const ageInHours = (Date.now() - new Date(createdAt).getTime()) / 3600000;
  return (votes - 1) / Math.pow(ageInHours + 2, 1.8);
}

export function validCategory(value: unknown): value is typeof CATEGORIES[number] {
  return typeof value === 'string' && CATEGORIES.includes(value as typeof CATEGORIES[number]);
}

export function validType(value: unknown): value is typeof TYPES[number] {
  return typeof value === 'string' && TYPES.includes(value as typeof TYPES[number]);
}

export function mapSubmission(row: any) {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    tagline: row.tagline,
    category: row.category_slug,
    built_with: row.built_with ?? [],
    type: row.type ?? 'web',
    vote_count: row.vote_count ?? 0,
    builder_handle: row.profiles?.username ?? 'unknown',
    created_at: row.created_at,
  };
}

export async function approvedSubmissions(env: Env, category?: string) {
  let query = publicSupabase(env)
    .from('submissions')
    .select('id, name, url, tagline, category_slug, built_with, type, vote_count, created_at, profiles:submitter_id (username)')
    .eq('status', 'approved');

  if (category) query = query.eq('category_slug', category);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export function frequency(values: string[], limit = 3): string[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([value]) => value);
}
