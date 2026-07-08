import { Env, approvedSubmissions, handleOptions, json, validCategory } from '../_shared';

type Context = EventContext<Env, string, unknown>;

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestGet({ request, env }: Context) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category') ?? undefined;
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 10), 1), 50);
    if (category && !validCategory(category)) return json({ error: 'Invalid category.' }, { status: 400 });

    const rows = await approvedSubmissions(env, category) as any[];
    const grouped = new Map<string, { count: number; votes: number }>();
    for (const row of rows) {
      for (const tag of row.built_with ?? []) {
        const current = grouped.get(tag) ?? { count: 0, votes: 0 };
        current.count += 1;
        current.votes += row.vote_count ?? 0;
        grouped.set(tag, current);
      }
    }

    const tags = [...grouped.entries()]
      .map(([tag, value]) => ({
        tag,
        submission_count: value.count,
        avg_votes: Math.round((value.votes / value.count) * 10) / 10,
      }))
      .sort((a, b) => b.avg_votes - a.avg_votes || b.submission_count - a.submission_count)
      .slice(0, limit);

    return json({ tags });
  } catch (error: any) {
    return json({ error: error.message ?? 'Unable to load tag stats.' }, { status: 500 });
  }
}
