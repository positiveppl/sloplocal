import {
  Env,
  adminSupabase,
  assertUrlResolves,
  approvedSubmissions,
  checkSubmissionLimit,
  handleOptions,
  hotScore,
  json,
  jsonWithRateLimit,
  mapSubmission,
  recordSubmissionAttempt,
  validateApiKeyProfile,
  validateSubmissionUrl,
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
    const apiUser = await validateApiKeyProfile(request, env);
    if (!apiUser) return json({ error: 'Valid Bearer API key required.' }, { status: 401 });
    if (apiUser.isBanned) return json({ error: 'This account cannot submit right now.' }, { status: 403 });

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
    const urlCheck = validateSubmissionUrl(projectUrl);
    if (!urlCheck.valid || !urlCheck.normalizedUrl) return json({ error: urlCheck.reason ?? 'Invalid URL.' }, { status: 400 });
    const resolveCheck = await assertUrlResolves(projectUrl);
    if (!resolveCheck.valid) return json({ error: resolveCheck.reason }, { status: 400 });

    const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slug = slugBase || `slop-${Date.now()}`;
    const supabase = adminSupabase(env);
    const limit = await checkSubmissionLimit(env, apiUser.userId, 'api');
    if (!limit.allowed) {
      return jsonWithRateLimit({
        error: `Submission limit reached. You can submit 3 tools per day via API. Resets ${limit.resetAt.toISOString()}.`,
        reset_at: limit.resetAt.toISOString(),
      }, limit, { status: 429 });
    }

    let { data: existing, error: existingError } = await supabase
      .from('submissions')
      .select('id, status')
      .eq('normalized_url', urlCheck.normalizedUrl)
      .maybeSingle();
    if (isMissingColumn(existingError, 'normalized_url')) {
      const fallback = await supabase
        .from('submissions')
        .select('id, status')
        .eq('url', urlCheck.normalizedUrl)
        .maybeSingle();
      existing = fallback.data;
      existingError = fallback.error;
    }
    if (existingError) return json({ error: existingError.message }, { status: 400 });
    if (existing) {
      return json({ error: existing.status === 'approved' ? 'This tool is already listed on SLOP LOCAL.' : 'This URL has already been submitted and is pending review.' }, { status: 409 });
    }

    await recordSubmissionAttempt(env, apiUser.userId, 'api');
    const baseInsert = {
      submitter_id: apiUser.userId,
      name,
      slug,
      url: urlCheck.normalizedUrl,
      tagline,
      description: description || null,
      category_slug: category,
      built_with: builtWith,
      status: 'pending',
    };
    let { data, error } = await supabase
      .from('submissions')
      .insert({
        ...baseInsert,
        normalized_url: urlCheck.normalizedUrl,
        type,
        submitted_via: 'api',
      })
      .select('id, status')
      .single();

    if (isMissingColumn(error, 'normalized_url') || isMissingColumn(error, 'submitted_via') || isMissingColumn(error, 'type')) {
      const fallback = await supabase
        .from('submissions')
        .insert(baseInsert)
        .select('id, status')
        .single();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      if (error.code === '23505') return json({ error: 'That project already appears to be submitted.' }, { status: 409 });
      return json({ error: error.message }, { status: 400 });
    }

    return jsonWithRateLimit({
      id: data.id,
      status: data.status,
      message: 'Submission received. Pending review before going live.',
    }, { ...limit, remaining: Math.max(0, limit.remaining - 1) }, { status: 201 });
  } catch (error: any) {
    return json({ error: error.message ?? 'Unable to create submission.' }, { status: 500 });
  }
}

function isMissingColumn(error: any, column: string): boolean {
  return Boolean(error?.message?.includes(`'${column}'`) || error?.message?.includes(`.${column}`) || error?.message?.includes(` ${column} `));
}
