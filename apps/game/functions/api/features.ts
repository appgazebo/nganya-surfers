interface Env {
  DB: D1Database;
  ADMIN_KEY?: string;
}

const DEFAULT_ADMIN_KEY = 'nganya_admin_sec_2026';

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-admin-key, Authorization'
    }
  });
};

// GET /api/features: Admin only
export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  const adminKey = env.ADMIN_KEY || DEFAULT_ADMIN_KEY;
  const clientKey = request.headers.get('x-admin-key') ||
    request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');

  if (!clientKey || clientKey !== adminKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Admin Key required' }), {
      status: 401,
      headers: corsHeaders
    });
  }

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database not bound' }), { status: 500, headers: corsHeaders });
  }

  try {
    const { results } = await env.DB.prepare(`
      SELECT * FROM feature_suggestions ORDER BY upvotes DESC, id DESC LIMIT 100
    `).all();

    return new Response(JSON.stringify({ features: results }), { status: 200, headers: corsHeaders });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: corsHeaders });
  }
};

// POST /api/features: Public feature suggestion
export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database not bound' }), { status: 500, headers: corsHeaders });
  }

  try {
    const body = await request.json() as {
      title?: string;
      description?: string;
      submitter_name?: string;
      category?: string;
      contact?: string;
    };

    if (!body.title || !body.description) {
      return new Response(JSON.stringify({ error: 'Title and description are required' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const title = sanitize(body.title, 120);
    const description = sanitize(body.description, 1000);
    const submitterName = sanitize(body.submitter_name || 'Anonymous Runner', 60);
    const category = sanitize(body.category || 'GAMEPLAY', 30);
    const contact = sanitize(body.contact || '', 100);

    const result = await env.DB.prepare(`
      INSERT INTO feature_suggestions (title, description, submitter_name, contact, category, upvotes, status)
      VALUES (?, ?, ?, ?, ?, 1, 'NEW')
    `).bind(title, description, submitterName, contact, category).run();

    return new Response(JSON.stringify({
      success: true,
      id: result.meta.last_row_id,
      message: 'Feature idea submitted! Asante sana!'
    }), { status: 201, headers: corsHeaders });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: corsHeaders });
  }
};

// PATCH /api/features: Admin updates status (NEW / PLANNED / COMPLETED)
export const onRequestPatch = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  const adminKey = env.ADMIN_KEY || DEFAULT_ADMIN_KEY;
  const clientKey = request.headers.get('x-admin-key') ||
    request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');

  if (!clientKey || clientKey !== adminKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }

  try {
    const body = await request.json() as { id: number; status: string };
    if (!body.id || !body.status) {
      return new Response(JSON.stringify({ error: 'ID and status required' }), { status: 400, headers: corsHeaders });
    }

    await env.DB.prepare(`
      UPDATE feature_suggestions SET status = ? WHERE id = ?
    `).bind(body.status, body.id).run();

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: corsHeaders });
  }
};

function sanitize(str: string, maxLen: number): string {
  if (!str) return '';
  return String(str).substring(0, maxLen).replace(/[<>'"]/g, '');
}
