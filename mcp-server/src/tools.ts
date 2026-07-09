import { Tool } from '@modelcontextprotocol/sdk/types.js';

const API_BASE = (process.env.SLOP_LOCAL_API_URL ?? 'https://sloplocal.com/api').replace(/\/$/, '');
const API_KEY = process.env.SLOP_LOCAL_API_KEY ?? '';
const ADMIN_TOKEN = process.env.SLOP_LOCAL_ADMIN_TOKEN ?? '';

const categoryEnum = ['tools', 'creative', 'games', 'productivity', 'weird'];
const typeEnum = ['web', 'desktop', 'cli', 'plugin', 'mobile'];

export const tools: Tool[] = [
  {
    name: 'submit_slop',
    description: 'Submit a vibe-coded app or tool to SLOP LOCAL for community discovery. Use this after building something free that solves a real problem, raises a civic issue, or serves a specific community — even a small or hyperlocal one. Submissions are reviewed before going live.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the app or tool' },
        url: { type: 'string', description: 'Live URL where people can access it' },
        tagline: { type: 'string', description: 'One-line description, max 120 chars' },
        category: { type: 'string', enum: categoryEnum },
        type: { type: 'string', enum: typeEnum },
        built_with: { type: 'array', items: { type: 'string' }, description: 'AI tools or tags used: Codex, Claude, Cursor, v0, Replit, Lovable, Bolt, GPT-4, civic, local, hyperlocal, community, etc' },
        access_model: { type: 'string', enum: ['free', 'account', 'freemium', 'byok'], description: 'How people access it. Use byok if users must bring their own AI API key.' },
        api_provider: { type: 'string', description: 'Required when access_model is byok, e.g. Claude, OpenAI, Gemini, Other AI.' },
        description: { type: 'string', description: 'Optional longer description, max 500 chars' },
        builder_handle: { type: 'string', description: 'Your @handle to credit on the listing' }
      },
      required: ['name', 'url', 'tagline', 'category']
    }
  },
  {
    name: 'get_trending_slop',
    description: 'Get the current top 10 trending apps and tools on SLOP LOCAL.',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: categoryEnum }
      }
    }
  },
  {
    name: 'search_slop',
    description: 'Browse SLOP LOCAL listings by category and sort order.',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: categoryEnum },
        sort: { type: 'string', enum: ['hot', 'new', 'top'], default: 'hot' },
        limit: { type: 'number', default: 10 }
      }
    }
  },
  {
    name: 'get_categories',
    description: 'List all valid SLOP LOCAL categories.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'get_category_stats',
    description: 'Get submission count, average votes, and top built-with tools per category.',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: categoryEnum }
      }
    }
  },
  {
    name: 'get_market_gaps',
    description: 'Identify underserved niches with high vote demand but few submissions.',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: categoryEnum },
        min_votes: { type: 'number', description: 'Minimum vote threshold, default 50' }
      }
    }
  },
  {
    name: 'get_trending_tags',
    description: 'See which AI tools and frameworks are producing the highest-voted submissions.',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: categoryEnum },
        limit: { type: 'number', default: 10 }
      }
    }
  },
  {
    name: 'get_pending_submissions',
    description: 'Admin-only: fetch pending SLOP LOCAL submissions for moderation triage.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', default: 25 },
        offset: { type: 'number', default: 0 }
      }
    }
  },
  {
    name: 'get_flagged_submissions',
    description: 'Admin-only: fetch flagged SLOP LOCAL submissions for moderation triage.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
        limit: { type: 'number', default: 25 },
        offset: { type: 'number', default: 0 }
      }
    }
  }
];

export async function handleTool(name: string, args: Record<string, any>) {
  try {
    switch (name) {
      case 'submit_slop':
        return submitSlop(args);
      case 'get_trending_slop':
        return getTrending(args);
      case 'search_slop':
        return searchSlop(args);
      case 'get_categories':
        return getCategories();
      case 'get_category_stats':
        return getCategoryStats(args);
      case 'get_market_gaps':
        return getMarketGaps(args);
      case 'get_trending_tags':
        return getTrendingTags(args);
      case 'get_pending_submissions':
        return getAdminSubmissions('/admin/pending', args, 'Pending submissions');
      case 'get_flagged_submissions':
        return getAdminSubmissions('/admin/flagged', args, 'Flagged submissions');
      default:
        return text(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return text(`SLOP LOCAL request failed: ${error.message ?? String(error)}`);
  }
}

async function submitSlop(args: Record<string, any>) {
  if (!API_KEY) return text('Set SLOP_LOCAL_API_KEY before submitting.');
  const res = await fetch(`${API_BASE}/submissions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(args),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 429) return text(`Rate limit reached: ${data.error} The builder can submit more tomorrow.`);
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return text(`Submitted! "${args.name}" is pending review. ID: ${data.id}\n${data.message ?? ''}`.trim());
}

async function getTrending(args: Record<string, any>) {
  const params = new URLSearchParams();
  if (args.category) params.set('category', args.category);
  const data = await request(`/submissions/trending?${params}`);
  const list = data.submissions.map((s: any, i: number) =>
    `${i + 1}. ${s.name} (${s.vote_count} votes) — ${s.tagline} → ${s.url}`
  ).join('\n');
  return text(list ? `Trending on SLOP LOCAL:\n\n${list}` : 'No trending submissions found.');
}

async function searchSlop(args: Record<string, any>) {
  const params = new URLSearchParams({
    sort: args.sort ?? 'hot',
    limit: String(args.limit ?? 10),
  });
  if (args.category) params.set('category', args.category);
  const data = await request(`/submissions?${params}`);
  const list = data.submissions.map((s: any) =>
    `• ${s.name} [${s.category}] — ${s.tagline} → ${s.url}`
  ).join('\n');
  return text(list || 'No results found.');
}

async function getCategories() {
  const data = await request('/categories');
  return text(data.categories.map((c: any) => `${c.emoji} ${c.name} (slug: "${c.slug}")`).join('\n'));
}

async function getCategoryStats(args: Record<string, any>) {
  const params = new URLSearchParams();
  if (args.category) params.set('category', args.category);
  const data = await request(`/stats/categories?${params}`);
  const report = data.stats.map((s: any) =>
    `${s.emoji} ${s.name}\n  ${s.count} submissions · avg ${s.avg_votes} votes · top tools: ${s.top_built_with.join(', ') || 'none yet'}`
  ).join('\n\n');
  return text(report ? `Category stats:\n\n${report}` : 'No category stats available yet.');
}

async function getMarketGaps(args: Record<string, any>) {
  const params = new URLSearchParams({ min_votes: String(args.min_votes ?? 50) });
  if (args.category) params.set('category', args.category);
  const data = await request(`/stats/gaps?${params}`);
  const gaps = data.gaps.map((g: any) =>
    `• ${g.signal} — ${g.vote_demand} votes of demand, ${g.submission_count} matching submission${g.submission_count === 1 ? '' : 's'}. ${g.example}`
  ).join('\n');
  return text(gaps ? `Market gaps on SLOP LOCAL:\n\n${gaps}` : 'No clear gaps found with current filters.');
}

async function getTrendingTags(args: Record<string, any>) {
  const params = new URLSearchParams({ limit: String(args.limit ?? 10) });
  if (args.category) params.set('category', args.category);
  const data = await request(`/stats/tags?${params}`);
  const tags = data.tags.map((t: any, i: number) =>
    `${i + 1}. ${t.tag} — used in ${t.submission_count} submissions, avg ${t.avg_votes} votes`
  ).join('\n');
  return text(tags ? `Top performing tools on SLOP LOCAL:\n\n${tags}` : 'No built-with tag stats available yet.');
}

async function getAdminSubmissions(path: string, args: Record<string, any>, title: string) {
  if (!ADMIN_TOKEN) return text('Set SLOP_LOCAL_ADMIN_TOKEN to a signed-in Supabase admin access token before using admin moderation tools.');
  const params = new URLSearchParams({
    limit: String(args.limit ?? 25),
    offset: String(args.offset ?? 0),
  });
  if (args.status) params.set('status', String(args.status));

  const data = await request(`${path}?${params}`, {
    headers: { authorization: `Bearer ${ADMIN_TOKEN}` },
  });
  const list = data.submissions.map((s: any, i: number) => {
    const accountability = [
      s.submitter_agreed_to_terms ? 'signup attested' : 'missing signup attestation',
      s.attested ? 'submission attested' : 'missing submission attestation',
      `${s.flag_count ?? 0} flag${s.flag_count === 1 ? '' : 's'}`,
    ].join(' · ');

    return [
      `${i + 1}. ${s.name} (${s.status}) — ${s.url}`,
      `   Builder: @${s.builder_username} · ${s.submitted_via ?? 'web'} · ${accountability}`,
      `   Category: ${s.category_slug} · Built with: ${(s.built_with ?? []).join(', ') || 'none'}`,
      `   Tagline: ${s.tagline}`,
      s.description ? `   Description: ${s.description}` : '',
      `   ID: ${s.id}`,
    ].filter(Boolean).join('\n');
  }).join('\n\n');

  return text(list ? `${title} (${data.total} total):\n\n${list}` : `${title}: none found.`);
}

async function request(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

function text(value: string) {
  return { content: [{ type: 'text' as const, text: value }] };
}
