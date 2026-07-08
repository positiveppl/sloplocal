import { Tool } from '@modelcontextprotocol/sdk/types.js';

const API_BASE = (process.env.SLOP_LOCAL_API_URL ?? 'https://sloplocal.com/api').replace(/\/$/, '');
const API_KEY = process.env.SLOP_LOCAL_API_KEY ?? '';

const categoryEnum = ['tools', 'creative', 'games', 'productivity', 'weird'];
const typeEnum = ['web', 'desktop', 'cli', 'plugin', 'mobile'];

export const tools: Tool[] = [
  {
    name: 'submit_slop',
    description: 'Submit a vibe-coded app or tool to SLOP LOCAL for community discovery. Submissions are reviewed before going live.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the app or tool' },
        url: { type: 'string', description: 'Live URL where people can access it' },
        tagline: { type: 'string', description: 'One-line description, max 120 chars' },
        category: { type: 'string', enum: categoryEnum },
        type: { type: 'string', enum: typeEnum },
        built_with: { type: 'array', items: { type: 'string' } },
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
  return text(`Submitted! "${args.name}" is pending review. ID: ${data.id}`);
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

async function request(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

function text(value: string) {
  return { content: [{ type: 'text' as const, text: value }] };
}
