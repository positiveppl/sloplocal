import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// ============ TYPES ============

export type CategorySlug = 'tools' | 'creative' | 'games' | 'productivity' | 'weird';

export const CATS: Record<CategorySlug, { label: string; full: string }> = {
  creative:     { label: '🎨 Creative',     full: '🎨 Creative & Generative' },
  tools:        { label: '🛠 Tools',        full: '🛠️ Tools & Utilities' },
  games:        { label: '🎮 Games',        full: '🎮 Games & Entertainment' },
  productivity: { label: '📈 Productivity', full: '📈 Productivity' },
  weird:        { label: '🧪 Weird',        full: '🧪 Weird & Niche' },
};

export const BUILT_WITH_OPTIONS = ['Claude', 'Cursor', 'v0', 'Replit', 'Lovable', 'Bolt', 'GPT-4', 'Other'];

export interface Slop {
  id: string;
  slug: string;
  name: string;
  url: string;
  tagline: string;
  description: string | null;
  category_slug: CategorySlug;
  built_with: string[];
  type?: 'web' | 'desktop' | 'cli' | 'plugin' | 'mobile';
  screenshot_url: string | null;
  vote_count: number;
  status: 'pending' | 'approved' | 'rejected';
  reject_reason?: string | null;
  created_at: string;
  submitter_id: string | null;
  builder_username: string;
  builder_avatar?: string | null;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_admin: boolean;
}

export interface ApiKey {
  id: string;
  key_preview: string;
  label: string | null;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
}

// ============ SUPABASE CLIENT (or demo mode) ============

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const DEMO_MODE = !url || !anon;
export const supabase: SupabaseClient | null = DEMO_MODE ? null : createClient(url!, anon!);

// ============ HOT SCORE ============

export function hotScore(votes: number, createdAt: string): number {
  const ageInHours = (Date.now() - new Date(createdAt).getTime()) / 3600000;
  const gravity = 1.8;
  return (votes - 1) / Math.pow(ageInHours + 2, gravity);
}

export function isHot(s: Slop): boolean {
  const age = (Date.now() - new Date(s.created_at).getTime()) / 3600000;
  return age < 72 && hotScore(s.vote_count, s.created_at) > 1.5;
}

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ============ DEMO SEED DATA ============

const h = 3600000;
const ago = (hours: number) => new Date(Date.now() - hours * h).toISOString();

let demoSlops: Slop[] = [
  { id: '1', slug: 'choppl', name: 'CHOPPL', url: 'https://example.com', tagline: 'Visual drum machine meets video sampler. Chop clips like breaks.', description: 'CHOPPL turns video into a playable instrument. Load clips, slice them across pads, and perform them like a drum machine — every hit triggers both sound and image. Ships with a Max for Live bridge so it locks to Ableton\'s clock, plus Syphon input for feeding live visuals in.', category_slug: 'creative', built_with: ['Claude', 'Electron', 'Max for Live'], screenshot_url: null, vote_count: 312, status: 'approved', created_at: ago(30), submitter_id: 'demo-acedout', builder_username: 'acedout' },
  { id: '2', slug: 'pinskate', name: 'PinSkate', url: 'https://example.com', tagline: 'GPS-powered skate spot discovery. Find ledges, rails, and DIYs near you.', description: 'A community map of skate spots — every ledge, rail, gap, and DIY park, pinned by skaters who actually ride them. Filter by spot type, check ground quality, see photos before you drive out.', category_slug: 'tools', built_with: ['Claude', 'Next.js', 'Supabase', 'Mapbox'], screenshot_url: null, vote_count: 201, status: 'approved', created_at: ago(200), submitter_id: 'demo-acedout', builder_username: 'acedout' },
  { id: '3', slug: 'posterlab', name: 'PosterLab', url: 'https://example.com', tagline: 'Browser-based poster design studio. No account, no watermark, no upsell.', description: 'A full poster design tool that runs in your browser. Drag type around, layer shapes, export print-ready files. No signup wall, no watermark on export, no "upgrade to unlock."', category_slug: 'creative', built_with: ['Claude', 'Next.js', 'Konva'], screenshot_url: null, vote_count: 154, status: 'approved', created_at: ago(400), submitter_id: 'demo-acedout', builder_username: 'acedout' },
  { id: '4', slug: 'risoforge', name: 'RisoForge', url: 'https://example.com', tagline: 'Risograph print simulation in the browser. Misregistration included.', description: 'Simulates the whole risograph workflow — color separation, ink layers, paper texture, and the slightly-off registration that makes riso prints feel alive.', category_slug: 'creative', built_with: ['Claude', 'Canvas API'], screenshot_url: null, vote_count: 143, status: 'approved', created_at: ago(500), submitter_id: 'demo-acedout', builder_username: 'acedout' },
  { id: '5', slug: 'deal-pro', name: 'Deal Pro', url: 'https://example.com', tagline: 'Inventory and storefront platform for small resellers. One dashboard, no bloat.', description: 'Track inventory, list products, and run a storefront from one place. Built for small resellers who were duct-taping spreadsheets to marketplace tabs.', category_slug: 'productivity', built_with: ['Claude', 'Next.js', 'SQL'], screenshot_url: null, vote_count: 97, status: 'approved', created_at: ago(700), submitter_id: 'demo-acedout', builder_username: 'acedout' },
  { id: '6', slug: 'plantdad', name: 'PlantDad', url: 'https://example.com', tagline: 'Watering reminders that guilt-trip you in your plant\'s voice.', description: 'Your monstera texts you when it\'s thirsty. That\'s it. That\'s the app.', category_slug: 'productivity', built_with: ['GPT-4', 'Replit'], screenshot_url: null, vote_count: 88, status: 'approved', created_at: ago(90), submitter_id: 'demo-mossgirl', builder_username: 'mossgirl' },
  { id: '7', slug: 'loopdig', name: 'LoopDig', url: 'https://example.com', tagline: 'Random obscure record picker for sample diggers. No algorithm, pure chaos.', description: 'Hit the button, get a random deep-catalog record from open archives. The digital equivalent of pulling a dusty sleeve from the dollar bin.', category_slug: 'creative', built_with: ['Cursor', 'Svelte'], screenshot_url: null, vote_count: 76, status: 'approved', created_at: ago(18), submitter_id: 'demo-cratemind', builder_username: 'cratemind' },
  { id: '8', slug: 'queuewatch', name: 'QueueWatch', url: 'https://example.com', tagline: 'Live lobby wait times for government offices. Know before you go.', description: 'Crowdsourced wait times for DMVs, county offices, and social services lobbies. Built by someone who works the counter.', category_slug: 'tools', built_with: ['Claude', 'Vue'], screenshot_url: null, vote_count: 64, status: 'approved', created_at: ago(60), submitter_id: 'demo-countyline', builder_username: 'countyline' },
  { id: '9', slug: 'font-crimes', name: 'Font Crimes', url: 'https://example.com', tagline: 'A daily game where you guess which typeface committed the crime.', description: 'Every day, one kerning disaster. You get five guesses to name the font.', category_slug: 'weird', built_with: ['v0', 'React'], screenshot_url: null, vote_count: 59, status: 'approved', created_at: ago(14), submitter_id: 'demo-kernhater', builder_username: 'kernhater' },
  { id: '10', slug: 'napmath', name: 'NapMath', url: 'https://example.com', tagline: 'Tells you if a nap right now ruins tonight\'s sleep. Brutally honest.', description: 'Enter the time and how tired you are. NapMath runs the sleep-cycle arithmetic and tells you "yes, 20 minutes" or "absolutely not, drink water."', category_slug: 'weird', built_with: ['Lovable'], screenshot_url: null, vote_count: 41, status: 'approved', created_at: ago(8), submitter_id: 'demo-mossgirl', builder_username: 'mossgirl' },
  { id: '11', slug: 'gigsheet', name: 'GigSheet', url: 'https://example.com', tagline: 'Setlists, stage plots, and payout splits for bands that hate spreadsheets.', description: 'One link for the whole band: tonight\'s setlist, who\'s bringing the PA, and how the door money splits.', category_slug: 'productivity', built_with: ['Claude', 'Bolt'], screenshot_url: null, vote_count: 38, status: 'approved', created_at: ago(260), submitter_id: 'demo-basscase', builder_username: 'basscase' },
  { id: '12', slug: 'pixelwash', name: 'PixelWash', url: 'https://example.com', tagline: 'Datamosh your webcam in real time. Melt yourself on video calls.', description: 'Real-time datamoshing as a virtual camera. I-frame destruction, motion vector smearing, piped straight into Zoom.', category_slug: 'games', built_with: ['Cursor', 'WebGL'], screenshot_url: null, vote_count: 33, status: 'approved', created_at: ago(44), submitter_id: 'demo-vhsghost', builder_username: 'vhsghost' },
  { id: '13', slug: 'sludgefax', name: 'SludgeFax', url: 'https://example.com', tagline: 'Pending example — this is what the admin queue looks like.', description: 'A pending submission so the admin view has something to review in demo mode.', category_slug: 'weird', built_with: ['Other'], screenshot_url: null, vote_count: 0, status: 'pending', created_at: ago(2), submitter_id: 'demo-vhsghost', builder_username: 'vhsghost' },
];

let demoVotes = new Set<string>();
let demoUser: Profile | null = null;
let demoApiKeys: ApiKey[] = [];

// ============ DATA LAYER ============
// Every function works in both modes. Demo mode = in-memory, resets on reload.

export async function fetchApproved(): Promise<Slop[]> {
  if (DEMO_MODE) return demoSlops.filter(s => s.status === 'approved');
  const { data, error } = await supabase!
    .from('submissions')
    .select('*, profiles:submitter_id (username, avatar_url)')
    .eq('status', 'approved');
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function fetchBySlug(slug: string): Promise<Slop | null> {
  if (DEMO_MODE) return demoSlops.find(s => s.slug === slug) ?? null;
  const { data, error } = await supabase!
    .from('submissions')
    .select('*, profiles:submitter_id (username, avatar_url)')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : null;
}

export async function fetchByBuilder(username: string): Promise<Slop[]> {
  if (DEMO_MODE) return demoSlops.filter(s => s.builder_username === username && s.status === 'approved');
  const { data: prof } = await supabase!.from('profiles').select('id').eq('username', username).maybeSingle();
  if (!prof) return [];
  const { data, error } = await supabase!
    .from('submissions')
    .select('*, profiles:submitter_id (username, avatar_url)')
    .eq('submitter_id', prof.id)
    .eq('status', 'approved');
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function fetchProfile(username: string): Promise<Profile | null> {
  if (DEMO_MODE) {
    const s = demoSlops.find(x => x.builder_username === username);
    if (!s) return null;
    return { id: s.submitter_id!, username, display_name: null, avatar_url: null, bio: username === 'acedout' ? 'Building fast in Sacramento. positiveppl.com' : null, is_admin: username === 'acedout' };
  }
  const { data } = await supabase!.from('profiles').select('*').eq('username', username).maybeSingle();
  return data as Profile | null;
}

export async function fetchStats(): Promise<{ tools: number; votes: number; builders: number }> {
  const approved = await fetchApproved();
  return {
    tools: approved.length,
    votes: approved.reduce((s, a) => s + a.vote_count, 0),
    builders: new Set(approved.map(a => a.builder_username)).size,
  };
}

export async function fetchMyVotes(userId: string): Promise<Set<string>> {
  if (DEMO_MODE) return demoVotes;
  const { data } = await supabase!.from('votes').select('submission_id').eq('user_id', userId);
  return new Set((data ?? []).map(v => v.submission_id as string));
}

export async function toggleVote(submissionId: string, userId: string, currentlyVoted: boolean): Promise<void> {
  if (DEMO_MODE) {
    const s = demoSlops.find(x => x.id === submissionId);
    if (!s) return;
    if (currentlyVoted) { demoVotes.delete(submissionId); s.vote_count--; }
    else { demoVotes.add(submissionId); s.vote_count++; }
    return;
  }
  if (currentlyVoted) {
    const { error } = await supabase!.from('votes').delete().eq('submission_id', submissionId).eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase!.from('votes').insert({ submission_id: submissionId, user_id: userId });
    if (error) throw error;
  }
}

export async function submitSlop(input: {
  name: string; url: string; tagline: string; description: string;
  category_slug: CategorySlug; built_with: string[]; submitter: Profile;
}): Promise<{ ok: boolean; error?: string }> {
  const slug = slugify(input.name);
  if (DEMO_MODE) {
    if (demoSlops.some(s => s.slug === slug || s.url === input.url)) return { ok: false, error: 'That one\'s already been submitted.' };
    demoSlops.unshift({
      id: String(Date.now()), slug, name: input.name, url: input.url, tagline: input.tagline,
      description: input.description || input.tagline, category_slug: input.category_slug,
      built_with: input.built_with, screenshot_url: null, vote_count: 1, status: 'pending',
      created_at: new Date().toISOString(), submitter_id: input.submitter.id, builder_username: input.submitter.username,
    });
    return { ok: true };
  }
  const { error } = await supabase!.from('submissions').insert({
    name: input.name, slug, url: input.url, tagline: input.tagline,
    description: input.description || null, category_slug: input.category_slug,
    built_with: input.built_with, submitter_id: input.submitter.id,
  });
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'That one\'s already been submitted.' };
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// ============ ADMIN ============

export async function fetchPending(): Promise<Slop[]> {
  if (DEMO_MODE) return demoSlops.filter(s => s.status === 'pending');
  const { data, error } = await supabase!
    .from('submissions')
    .select('*, profiles:submitter_id (username, avatar_url)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function reviewSubmission(id: string, status: 'approved' | 'rejected', rejectReason?: string): Promise<void> {
  if (DEMO_MODE) {
    const s = demoSlops.find(x => x.id === id);
    if (s) { s.status = status; s.reject_reason = rejectReason ?? null; }
    return;
  }
  const { error } = await supabase!.from('submissions').update({ status, reject_reason: rejectReason ?? null }).eq('id', id);
  if (error) throw error;
}

// ============ AUTH ============

export async function getSessionProfile(): Promise<Profile | null> {
  if (DEMO_MODE) return demoUser;
  const { data: { user } } = await supabase!.auth.getUser();
  if (!user) return null;
  return profileForUser(user);
}

async function profileForUser(user: User): Promise<Profile | null> {
  const { data } = await supabase!.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return data as Profile | null;
}

export async function signInEmail(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  if (DEMO_MODE) { demoSignIn(); return { ok: true }; }
  const { error } = await supabase!.auth.signInWithPassword({ email, password });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function signUpEmail(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  if (DEMO_MODE) { demoSignIn(); return { ok: true }; }
  const { error } = await supabase!.auth.signUp({ email, password });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function signInGitHub(): Promise<void> {
  if (DEMO_MODE) { demoSignIn(); return; }
  await supabase!.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: window.location.origin } });
}

export async function signOut(): Promise<void> {
  if (DEMO_MODE) { demoUser = null; return; }
  await supabase!.auth.signOut();
}

function demoSignIn() {
  demoUser = { id: 'demo-you', username: 'you', display_name: 'Demo You', avatar_url: null, bio: null, is_admin: true };
}

export function onAuthChange(cb: () => void): () => void {
  if (DEMO_MODE) return () => {};
  const { data } = supabase!.auth.onAuthStateChange(() => cb());
  return () => data.subscription.unsubscribe();
}

// ============ AGENT API KEYS ============

export async function fetchApiKeys(userId: string): Promise<ApiKey[]> {
  if (DEMO_MODE) return demoApiKeys.filter(key => key.is_active);
  const { data, error } = await supabase!
    .from('api_keys')
    .select('id, key_preview, label, created_at, last_used_at, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ApiKey[];
}

export async function createApiKey(userId: string, label: string): Promise<{ key: string; record: ApiKey }> {
  const key = `slop_live_${randomToken()}`;
  const keyHash = await hashKey(key);
  const record = {
    user_id: userId,
    key_hash: keyHash,
    key_preview: `slop_live_${'•'.repeat(8)}${key.slice(-6)}`,
    label: label.trim() || 'Agent key',
  };

  if (DEMO_MODE) {
    const demoRecord: ApiKey = {
      id: String(Date.now()),
      key_preview: record.key_preview,
      label: record.label,
      created_at: new Date().toISOString(),
      last_used_at: null,
      is_active: true,
    };
    demoApiKeys.unshift(demoRecord);
    return { key, record: demoRecord };
  }

  const { data, error } = await supabase!
    .from('api_keys')
    .insert(record)
    .select('id, key_preview, label, created_at, last_used_at, is_active')
    .single();
  if (error) throw error;
  return { key, record: data as ApiKey };
}

export async function revokeApiKey(id: string): Promise<void> {
  if (DEMO_MODE) {
    demoApiKeys = demoApiKeys.map(key => key.id === id ? { ...key, is_active: false } : key);
    return;
  }
  const { error } = await supabase!.from('api_keys').update({ is_active: false }).eq('id', id);
  if (error) throw error;
}

// ============ HELPERS ============

function mapRow(row: any): Slop {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    url: row.url,
    tagline: row.tagline,
    description: row.description,
    category_slug: row.category_slug,
    built_with: row.built_with ?? [],
    type: row.type ?? 'web',
    screenshot_url: row.screenshot_url,
    vote_count: row.vote_count ?? 0,
    status: row.status,
    reject_reason: row.reject_reason,
    created_at: row.created_at,
    submitter_id: row.submitter_id,
    builder_username: row.profiles?.username ?? 'unknown',
    builder_avatar: row.profiles?.avatar_url ?? null,
  };
}

export function fmtVotes(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
}

function randomToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hashKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(key);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
