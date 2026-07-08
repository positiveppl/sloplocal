import {
  Env,
  adminSupabase,
  approvedSubmissions,
  handleOptions,
  hotScore,
  json,
  mapSubmission,
  validateApiKey,
  validCategory,
  validType,
} from './_shared';

type Context = EventContext<Env, string, unknown>;

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestGet({ request, env }: Context) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category') ?? undefined;
    const sort = url.searchParams.get('sort') ?? 'hot';
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 20), 1), 50);
    const offset = Math.max(Number(url.searchParams.get('offset') ?? 0), 0);

    if (category && !validCategory(category)) return json({ error: 'Invalid category.' }, { status: 400 });
    if (!['hot', 'new', 'top'].includes(sort)) return json({ error: 'Invalid sort.' }, { status: 400 });

    const rows = await approvedSubmissions(env, category);
    const sorted = [...rows].sort((a: any, b: any) => {
      if (sort === 'new') return +new Date(b.created_at) - +new Date(a.created_at);
      if (sort === 'top') return (b.vote_count ?? 0) - (a.vote_count ?? 0);
      return hotScore(b.vote_count ?? 0, b.created_at) - hotScore(a.vote_count ?? 0, a.created_at);
    });

    return json({
      submissions: sorted.slice(offset, offset + limit).map(mapSubmission),
      total: sorted.length,
    });
  } catch (error: any) {
    return json({ error: error.message ?? 'Unable to load submissions.' }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }: Context) {
  try {
    const userId = await validateApiKey(request, env);
    if (!userId) return json({ error: 'Valid Bearer API key required.' }, { status: 401 });

    const body = await request.json<any>();
    const name = String(body.name ?? '').trim();
    const projectUrl = String(body.url ?? '').trim();
    const tagline = String(body.tagline ?? '').trim();
    const category = String(body.category ?? '').trim();
    const description = String(body.description ?? '').trim();
    const type = body.type ? String(body.type).trim() : 'web';
    const builtWith = Array.isArray(body.built_with) ? body.built_with.map(String).slice(0, 12) : [];

    if (!name || !projectUrl || !tagline || !validCategory(category)) {
      return json({ error: 'name, url, tagline, and a valid category are required.' }, { status: 400 });
    }
    if (tagline.length > 120) return json({ error: 'tagline must be 120 characters or fewer.' }, { status: 400 });
    if (description.length > 500) return json({ error: 'description must be 500 characters or fewer.' }, { status: 400 });
    if (!validType(type)) return json({ error: 'Invalid type.' }, { status: 400 });
    try { new URL(projectUrl); } catch { return json({ error: 'url must be a valid URL.' }, { status: 400 }); }

    const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slug = slugBase || `slop-${Date.now()}`;
    const supabase = adminSupabase(env);
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        submitter_id: userId,
        name,
        slug,
        url: projectUrl,
        tagline,
        description: description || null,
        category_slug: category,
        built_with: builtWith,
        type,
        status: 'pending',
      })
      .select('id, status')
      .single();

    if (error) {
      if (error.code === '23505') return json({ error: 'That project already appears to be submitted.' }, { status: 409 });
      return json({ error: error.message }, { status: 400 });
    }

    return json({
      id: data.id,
      status: data.status,
      message: 'Submission received. Pending review before going live.',
    }, { status: 201 });
  } catch (error: any) {
    return json({ error: error.message ?? 'Unable to create submission.' }, { status: 500 });
  }
}
