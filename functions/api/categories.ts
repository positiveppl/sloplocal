import { Env, handleOptions, json, publicSupabase } from './_shared';

type Context = EventContext<Env, string, unknown>;

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestGet({ env }: Context) {
  try {
    const { data, error } = await publicSupabase(env)
      .from('categories')
      .select('slug, name, emoji')
      .order('id');
    if (error) throw error;
    return json({ categories: data ?? [] });
  } catch (error: any) {
    return json({ error: error.message ?? 'Unable to load categories.' }, { status: 500 });
  }
}
