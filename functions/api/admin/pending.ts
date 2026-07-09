import { Env, adminSupabase, handleOptions, json, mapAdminSubmission, validateAdmin } from '../_shared';

type Context = EventContext<Env, string, unknown>;

const ADMIN_SELECT = `
  *,
  profiles:submitter_id (
    username,
    avatar_url,
    agreed_to_terms,
    agreed_to_terms_at
  )
`;

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestGet({ request, env }: Context) {
  try {
    const adminUserId = await validateAdmin(request, env);
    if (!adminUserId) return json({ error: 'Admins only.' }, { status: 403 });

    const url = new URL(request.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 50), 1), 100);
    const offset = Math.max(Number(url.searchParams.get('offset') ?? 0), 0);

    const { data, error, count } = await adminSupabase(env)
      .from('submissions')
      .select(ADMIN_SELECT, { count: 'exact' })
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) return json({ error: error.message }, { status: 400 });

    return json({
      submissions: (data ?? []).map(mapAdminSubmission),
      total: count ?? data?.length ?? 0,
      limit,
      offset,
    });
  } catch (error: any) {
    return json({ error: error.message ?? 'Unable to load pending submissions.' }, { status: 500 });
  }
}
