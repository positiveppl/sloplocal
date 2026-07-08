import { Env, approvedSubmissions, frequency, handleOptions, json, validCategory } from '../_shared';

type Context = EventContext<Env, string, unknown>;

const LABELS: Record<string, { name: string; emoji: string }> = {
  tools: { name: 'Tools & Utilities', emoji: '🛠️' },
  creative: { name: 'Creative & Generative', emoji: '🎨' },
  games: { name: 'Games & Entertainment', emoji: '🎮' },
  productivity: { name: 'Productivity', emoji: '📈' },
  weird: { name: 'Weird & Niche', emoji: '🧪' },
};

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestGet({ request, env }: Context) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category') ?? undefined;
    if (category && !validCategory(category)) return json({ error: 'Invalid category.' }, { status: 400 });

    const rows = await approvedSubmissions(env, category);
    const byCategory = new Map<string, any[]>();
    for (const row of rows as any[]) {
      const key = row.category_slug;
      byCategory.set(key, [...(byCategory.get(key) ?? []), row]);
    }

    const stats = [...byCategory.entries()].map(([slug, items]) => {
      const votes = items.reduce((sum, item) => sum + (item.vote_count ?? 0), 0);
      return {
        category: slug,
        name: LABELS[slug]?.name ?? slug,
        emoji: LABELS[slug]?.emoji ?? '',
        count: items.length,
        avg_votes: items.length ? Math.round((votes / items.length) * 10) / 10 : 0,
        top_built_with: frequency(items.flatMap(item => item.built_with ?? []), 3),
      };
    }).sort((a, b) => b.count - a.count || b.avg_votes - a.avg_votes);

    return json({ stats });
  } catch (error: any) {
    return json({ error: error.message ?? 'Unable to load category stats.' }, { status: 500 });
  }
}
