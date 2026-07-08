import { Env } from './_shared';

type Context = EventContext<Env, string, unknown>;

export async function onRequestGet({ env }: Context) {
  const clientEnv = {
    VITE_SUPABASE_URL: env.VITE_SUPABASE_URL ?? '',
    VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY ?? '',
  };

  return new Response(`window.__SLOPLOCAL_ENV__ = ${JSON.stringify(clientEnv)};`, {
    headers: {
      'content-type': 'application/javascript; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
