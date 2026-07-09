import { Env, adminSupabase, handleOptions, json, validateAdmin } from '../_shared';

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

async function captureScreenshot(env: Env, submissionId: string, targetUrl: string, name: string): Promise<ScreenshotResult> {
  if (!env.WORKER_URL || !env.WORKER_SECRET) {
    return { url: null, captured: false, error: 'Screenshot worker is not configured.' };
  }

  const response = await fetch(`${env.WORKER_URL.replace(/\/$/, '')}/approve-screenshot`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-worker-secret': env.WORKER_SECRET,
    },
    body: JSON.stringify({ submissionId, url: targetUrl, name }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    return {
      url: null,
      captured: false,
      error: `Screenshot worker returned ${response.status}${detail ? `: ${detail}` : '.'}`,
    };
  }

  const payload = await response.json() as { screenshotUrl?: string };
  if (!payload.screenshotUrl) return { url: null, captured: false, error: 'Screenshot worker did not return a URL.' };
  return { url: payload.screenshotUrl, captured: true };
}
