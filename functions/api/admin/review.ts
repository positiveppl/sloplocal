import { Env, adminSupabase, handleOptions, json, publicSupabase } from '../_shared';

type Context = EventContext<Env, string, unknown>;

type ReviewBody = {
  id?: string;
  status?: 'approved' | 'rejected';
  reject_reason?: string;
};

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestPost({ request, env }: Context) {
  try {
    const adminUserId = await validateAdmin(request, env);
    if (!adminUserId) return json({ error: 'Admins only.' }, { status: 403 });

    const body = await request.json() as ReviewBody;
    if (!body.id || !['approved', 'rejected'].includes(String(body.status))) {
      return json({ error: 'id and status are required.' }, { status: 400 });
    }

    const supabase = adminSupabase(env);
    const { data: submission, error: loadError } = await supabase
      .from('submissions')
      .select('id, url, name, screenshot_url')
      .eq('id', body.id)
      .maybeSingle();

    if (loadError) return json({ error: loadError.message }, { status: 400 });
    if (!submission) return json({ error: 'Submission not found.' }, { status: 404 });

    let screenshotUrl = submission.screenshot_url as string | null;
    if (body.status === 'approved') {
      screenshotUrl = await captureScreenshot(env, submission.id, submission.url, submission.name) ?? screenshotUrl;
    }

    const update: Record<string, unknown> = {
      status: body.status,
      reject_reason: body.status === 'rejected' ? body.reject_reason ?? null : null,
    };
    if (body.status === 'approved' && screenshotUrl) update.screenshot_url = screenshotUrl;

    const { data, error } = await supabase
      .from('submissions')
      .update(update)
      .eq('id', body.id)
      .select('id, status, screenshot_url')
      .single();

    if (error) return json({ error: error.message }, { status: 400 });

    return json({
      ok: true,
      submission: data,
      screenshot_captured: Boolean(screenshotUrl),
    });
  } catch (error: any) {
    return json({ error: error.message ?? 'Unable to review submission.' }, { status: 500 });
  }
}

async function validateAdmin(request: Request, env: Env): Promise<string | null> {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();

  const { data: userData, error: userError } = await publicSupabase(env).auth.getUser(token);
  if (userError || !userData.user) return null;

  const { data: profile } = await adminSupabase(env)
    .from('profiles')
    .select('is_admin')
    .eq('id', userData.user.id)
    .maybeSingle();

  return profile?.is_admin ? userData.user.id : null;
}

async function captureScreenshot(env: Env, submissionId: string, targetUrl: string, name: string): Promise<string | null> {
  if (!env.SCREENSHOTONE_ACCESS_KEY) return null;

  const screenshotEndpoint = new URL('https://api.screenshotone.com/take');
  screenshotEndpoint.searchParams.set('access_key', env.SCREENSHOTONE_ACCESS_KEY);
  screenshotEndpoint.searchParams.set('url', targetUrl);
  screenshotEndpoint.searchParams.set('viewport_width', '1440');
  screenshotEndpoint.searchParams.set('viewport_height', '1000');
  screenshotEndpoint.searchParams.set('device_scale_factor', '1');
  screenshotEndpoint.searchParams.set('format', 'jpg');
  screenshotEndpoint.searchParams.set('image_quality', '82');
  screenshotEndpoint.searchParams.set('full_page', 'false');
  screenshotEndpoint.searchParams.set('block_ads', 'true');
  screenshotEndpoint.searchParams.set('block_cookie_banners', 'true');
  screenshotEndpoint.searchParams.set('delay', '2');
  screenshotEndpoint.searchParams.set('timeout', '30');

  const response = await fetch(screenshotEndpoint.toString());
  if (!response.ok) return null;

  const bytes = await response.arrayBuffer();
  if (bytes.byteLength === 0) return null;

  const bucket = env.SLOP_SCREENSHOT_BUCKET || 'screenshots';
  const supabase = adminSupabase(env);
  await supabase.storage.createBucket(bucket, { public: true }).catch(() => {});

  const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'submission';
  const path = `${submissionId}/${safeName}.jpg`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, {
      contentType: 'image/jpeg',
      upsert: true,
      cacheControl: '31536000',
    });

  if (error) return null;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
