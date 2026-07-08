import { Env, approvedSubmissions, handleOptions, hotScore, json, mapSubmission, validCategory } from '../_shared';

type Context = EventContext<Env, string, unknown>;

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestGet({ request, env }: Context) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category') ?? undefined;
    if (category && !validCategory(category)) return json({ error: 'Invalid category.' }, { status: 400 });

    const rows = await approvedSubmissions(env, category);
    const submissions = [...rows]
      .sort((a: any, b: any) => hotScore(b.vote_count ?? 0, b.created_at) - hotScore(a.vote_count ?? 0, a.created_at))
      .slice(0, 10)
      .map(mapSubmission);

    return json({ submissions });
  } catch (error: any) {
    return json({ error: error.message ?? 'Unable to load trending submissions.' }, { status: 500 });
  }
}
