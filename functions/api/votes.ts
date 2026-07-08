import { Env, adminSupabase, handleOptions, json, validateApiKeyProfile } from './_shared';

type Context = EventContext<Env, string, unknown>;

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestPost({ request, env }: Context) {
  try {
    const apiUser = await validateApiKeyProfile(request, env);
    if (!apiUser) return json({ error: 'Valid Bearer API key required.' }, { status: 401 });
    if (apiUser.isBanned) return json({ error: 'This account cannot vote right now.' }, { status: 403 });

    const body = await request.json<any>();
    const submissionId = String(body.submission_id ?? '').trim();
    if (!submissionId) return json({ error: 'submission_id is required.' }, { status: 400 });

    const { error } = await adminSupabase(env)
      .from('votes')
      .insert({ submission_id: submissionId, user_id: apiUser.userId });

    if (error) {
      if (error.code === '23505') return json({ ok: true, message: 'Already voted.' });
      return json({ error: error.message }, { status: 400 });
    }

    return json({ ok: true });
  } catch (error: any) {
    return json({ error: error.message ?? 'Unable to vote.' }, { status: 500 });
  }
}
