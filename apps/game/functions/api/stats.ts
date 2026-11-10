interface Env {
  DB: D1Database;
  ADMIN_KEY?: string;
}

// Fallback secure key if not set in Cloudflare environment
const DEFAULT_ADMIN_KEY = 'nganya_admin_sec_2026';

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-admin-key, Authorization'
    }
  });
};

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate'
  };

  // 1. STRICT ADMIN AUTHENTICATION
  // Verify x-admin-key header or Authorization: Bearer <key>
  const adminKey = env.ADMIN_KEY || DEFAULT_ADMIN_KEY;
  const clientKey = request.headers.get('x-admin-key') ||
    request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');

  if (!clientKey || clientKey !== adminKey) {
    return new Response(JSON.stringify({
      error: 'Unauthorized: Access denied. Valid Admin Key required.'
    }), {
      status: 401,
      headers: corsHeaders
    });
  }

  if (!env.DB) {
    return new Response(JSON.stringify({
      error: 'D1 database not bound'
    }), { status: 500, headers: corsHeaders });
  }

  try {
    // 2. Fetch Aggregated Analytics from D1
    const totals = await env.DB.prepare(`
      SELECT 
        COUNT(DISTINCT visitor_id) as total_visitors,
        SUM(CASE WHEN event_type = 'VISIT' THEN 1 ELSE 0 END) as total_visits,
        SUM(CASE WHEN event_type = 'PLAY' THEN 1 ELSE 0 END) as total_plays,
        SUM(CASE WHEN event_type = 'GAME_OVER' THEN 1 ELSE 0 END) as total_completed,
        MAX(distance) as best_distance,
        AVG(CASE WHEN event_type = 'GAME_OVER' AND distance > 0 THEN distance ELSE NULL END) as avg_distance
      FROM analytics_events
    `).first<{
      total_visitors: number;
      total_visits: number;
      total_plays: number;
      total_completed: number;
      best_distance: number;
      avg_distance: number;
    }>();

    // Top Countries
    const { results: topCountries } = await env.DB.prepare(`
      SELECT country, COUNT(*) as count
      FROM analytics_events
      WHERE country IS NOT NULL AND country != ''
      GROUP BY country
      ORDER BY count DESC
      LIMIT 10
    `).all<{ country: string; count: number }>();

    // Top Cities
    const { results: topCities } = await env.DB.prepare(`
      SELECT city, country, COUNT(*) as count
      FROM analytics_events
      WHERE city IS NOT NULL AND city != '' AND city != 'Unknown'
      GROUP BY city, country
      ORDER BY count DESC
      LIMIT 10
    `).all<{ city: string; country: string; count: number }>();

    // Devices
    const { results: devices } = await env.DB.prepare(`
      SELECT device, COUNT(*) as count
      FROM analytics_events
      WHERE device IS NOT NULL
      GROUP BY device
    `).all<{ device: string; count: number }>();

    // Recent Activity Feed (Cleaned, no sensitive IPs exposed)
    const { results: recentActivity } = await env.DB.prepare(`
      SELECT id, event_type, country, city, device, distance, coins, created_at
      FROM analytics_events
      ORDER BY id DESC
      LIMIT 25
    `).all<{
      id: number;
      event_type: string;
      country: string;
      city: string;
      device: string;
      distance: number;
      coins: number;
      created_at: string;
    }>();

    return new Response(JSON.stringify({
      authenticated: true,
      totals: {
        totalVisitors: totals?.total_visitors || 0,
        totalVisits: totals?.total_visits || 0,
        totalPlays: totals?.total_plays || 0,
        totalCompleted: totals?.total_completed || 0,
        bestDistance: Math.floor(totals?.best_distance || 0),
        avgDistance: Math.floor(totals?.avg_distance || 0)
      },
      topCountries,
      topCities,
      devices,
      recentActivity,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: corsHeaders
    });
  }
};
