import { Env, approvedSubmissions, handleOptions, json, validCategory } from '../_shared';

type Context = EventContext<Env, string, unknown>;

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestGet({ request, env }: Context) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category') ?? undefined;
    const minVotes = Math.max(Number(url.searchParams.get('min_votes') ?? 50), 0);
    if (category && !validCategory(category)) return json({ error: 'Invalid category.' }, { status: 400 });

    const rows = (await approvedSubmissions(env, category) as any[]).filter(row => (row.vote_count ?? 0) >= minVotes);
    const byCategory = new Map<string, any[]>();
    for (const row of rows) {
      byCategory.set(row.category_slug, [...(byCategory.get(row.category_slug) ?? []), row]);
    }

    const gaps = [...byCategory.entries()].map(([slug, items]) => {
      const voteDemand = items.reduce((sum, item) => sum + (item.vote_count ?? 0), 0);
      const top = [...items].sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0))[0];
      const demandScore = voteDemand / Math.max(items.length, 1);
      return {
        signal: `${slug} > high-vote tools`,
        category: slug,
        vote_demand: voteDemand,
        submission_count: items.length,
        demand_score: Math.round(demandScore * 10) / 10,
        example: top
          ? `People are voting for "${top.name}" (${top.vote_count ?? 0} votes). More tools near that need may land.`
          : 'No proof-of-demand example available.',
      };
    }).sort((a, b) => b.demand_score - a.demand_score);

    return json({ gaps });
  } catch (error: any) {
    return json({ error: error.message ?? 'Unable to load market gaps.' }, { status: 500 });
  }
}
