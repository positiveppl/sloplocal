import { Env, adminSupabase, handleOptions, json, publicSupabase } from '../_shared';

type Context = EventContext<Env, string, unknown>;

type ReviewBody = {
  id?: string;
  status?: 'approved' | 'rejected';
  reject_reason?: string;
};

type ScreenshotResult = {
  url: string | null;
  captured: boolean;
  error?: string;
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

    let screenshotResult: ScreenshotResult = { url: null, captured: false };
    let screenshotUrl = submission.screenshot_url as string | null;
    if (body.status === 'approved') {
      screenshotResult = await captureScreenshot(env, submission.id, submission.url, submission.name);
      screenshotUrl = screenshotResult.url ?? screenshotUrl;
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
      screenshot_captured: screenshotResult.captured,
      screenshot_error: screenshotResult.error,
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

async function captureScreenshot(env: Env, submissionId: string, targetUrl: string, name: string): Promise<ScreenshotResult> {
  const screenshotEndpoint = new URL('https://api.microlink.io/');
  screenshotEndpoint.searchParams.set('url', targetUrl);
  screenshotEndpoint.searchParams.set('screenshot', 'true');
  screenshotEndpoint.searchParams.set('meta', 'false');
  screenshotEndpoint.searchParams.set('viewport.width', '1440');
  screenshotEndpoint.searchParams.set('viewport.height', '1000');
  screenshotEndpoint.searchParams.set('waitUntil', 'networkidle2');

  const response = await fetch(screenshotEndpoint.toString());
  if (!response.ok) return { url: null, captured: false, error: `Microlink returned ${response.status}.` };

  const payload = await response.json() as { data?: { screenshot?: { url?: string } } };
  const imageUrl = payload.data?.screenshot?.url;
  if (!imageUrl) return { url: null, captured: false, error: 'Microlink did not return a screenshot URL.' };

  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    return { url: imageUrl, captured: true, error: `Screenshot image returned ${imageResponse.status}; using Microlink URL.` };
  }

  const bytes = await imageResponse.arrayBuffer();
  if (bytes.byteLength === 0) return { url: imageUrl, captured: true, error: 'Screenshot image was empty; using Microlink URL.' };

  const bucket = env.SLOP_SCREENSHOT_BUCKET || 'screenshots';
  const supabase = adminSupabase(env);
  await supabase.storage.createBucket(bucket, { public: true }).catch(() => {});

  const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'submission';
  const contentType = imageResponse.headers.get('content-type') || 'image/png';
  const extension = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'png';
  const path = `${submissionId}/${safeName}.${extension}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, {
      contentType,
      upsert: true,
      cacheControl: '31536000',
    });

  if (error) return { url: imageUrl, captured: true, error: `Storage upload failed: ${error.message}` };
  return { url: supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl, captured: true };
}
