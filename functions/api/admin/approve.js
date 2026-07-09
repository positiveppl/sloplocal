import { adminSupabase, handleOptions, json, publicSupabase } from '../_shared';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestPost({ request, env }) {
  try {
    const adminUserId = await validateAdmin(request, env);
    if (!adminUserId) return json({ error: 'Admins only.' }, { status: 403 });

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'invalid JSON body' }, { status: 400 });
    }

    const submissionId = body.submissionId || body.id;
    if (!submissionId) return json({ error: 'submissionId is required' }, { status: 400 });

    const supabase = adminSupabase(env);
    const { data: submission, error: loadError } = await supabase
      .from('submissions')
      .select('id, url')
      .eq('id', submissionId)
      .maybeSingle();

    if (loadError) return json({ error: loadError.message }, { status: 400 });
    if (!submission) return json({ error: 'submission not found' }, { status: 404 });

    await updateSubmissionStatus(env, submissionId, 'approved');

    let screenshotUrl = null;
    let screenshotError = null;
    try {
      const result = await requestScreenshot(env, submissionId, submission.url);
      screenshotUrl = result.screenshotUrl || null;
    } catch (error) {
      screenshotError = error.message || 'Screenshot failed.';
      console.error('screenshot worker call failed', error);
    }

    return json({ ok: true, status: 'approved', screenshotUrl, screenshotError });
  } catch (error) {
    return json({ error: error.message || 'Unable to approve submission.' }, { status: 500 });
  }
}

async function validateAdmin(request, env) {
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

async function updateSubmissionStatus(env, submissionId, status) {
  const { error } = await adminSupabase(env)
    .from('submissions')
    .update({ status, reject_reason: null })
    .eq('id', submissionId);

  if (error) throw new Error(`failed to update submission status: ${error.message}`);
}

async function requestScreenshot(env, submissionId, url) {
  if (!env.WORKER_URL || !env.WORKER_SECRET) throw new Error('Screenshot worker is not configured.');

  const response = await fetch(`${env.WORKER_URL.replace(/\/$/, '')}/approve-screenshot`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-worker-secret': env.WORKER_SECRET,
    },
    body: JSON.stringify({ submissionId, url }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`worker returned ${response.status}${detail ? `: ${detail}` : ''}`);
  }

  return response.json();
}
