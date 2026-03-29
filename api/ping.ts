import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function buildHeaders(extra: Record<string, string> = {}) {
  return {
    'Cache-Control': 'no-store, max-age=0',
    ...extra,
  };
}

async function checkSupabase() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      ok: false,
      status: 500,
      body: {
        ok: false,
        error: 'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en Vercel.',
        at: new Date().toISOString(),
      },
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'x-health-check': 'uptimerobot',
      },
    },
  });

  const startedAt = Date.now();

  const { error } = await supabase
    .from('encuestas')
    .select('id')
    .eq('estado', 'publicada')
    .limit(1);

  const durationMs = Date.now() - startedAt;

  if (error) {
    return {
      ok: false,
      status: 500,
      body: {
        ok: false,
        source: 'vercel+supabase',
        error: error.message,
        durationMs,
        at: new Date().toISOString(),
      },
    };
  }

  return {
    ok: true,
    status: 200,
    body: {
      ok: true,
      source: 'vercel+supabase',
      message: 'pong',
      durationMs,
      at: new Date().toISOString(),
    },
  };
}

export async function GET() {
  const result = await checkSupabase();

  return Response.json(result.body, {
    status: result.status,
    headers: buildHeaders(),
  });
}

export async function HEAD() {
  const result = await checkSupabase();

  return new Response(null, {
    status: result.status,
    headers: buildHeaders({
      'x-health-ok': String(result.ok),
    }),
  });
}