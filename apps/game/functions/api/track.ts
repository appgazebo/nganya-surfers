interface Env {
  DB: D1Database;
}

function isOriginAllowed(origin: string): boolean {
  if (!origin) return true;
  return (
    origin.includes('humblesherrif.online') ||
    origin.includes('pages.dev') ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    origin.includes('192.168.')
  );
}

export const onRequestOptions = async (context: { request: Request }) => {
  const origin = context.request.headers.get('Origin') || '*';

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': isOriginAllowed(origin) ? origin : '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept'
    }
  });
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  const origin = request.headers.get('Origin') || '';
  const corsHeaders = {
    'Access-Control-Allow-Origin': isOriginAllowed(origin) ? origin : '*',
    'Content-Type': 'application/json'
  };

  // 1. HARD RATE LIMITING PER IP (Max 35 requests per minute)
  const clientIP = request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    'anon';

  const ipHash = await hashString(clientIP);
  const now = Math.floor(Date.now() / 1000);

  if (env.DB) {
    try {
      const record = await env.DB.prepare(`
        SELECT request_count, reset_at FROM rate_limits WHERE ip_hash = ?
      `).bind(ipHash).first<{ request_count: number; reset_at: number }>();

      if (!record || record.reset_at < now) {
        // Reset window for 60 seconds
        await env.DB.prepare(`
          INSERT INTO rate_limits (ip_hash, request_count, reset_at)
          VALUES (?, 1, ?)
          ON CONFLICT(ip_hash) DO UPDATE SET request_count = 1, reset_at = ?
        `).bind(ipHash, now + 60, now + 60).run();
      } else if (record.request_count >= 35) {
        // Rate limit hit
        const retryAfter = Math.max(1, record.reset_at - now);
        return new Response(JSON.stringify({
          error: 'Rate limit exceeded. Please slow down.'
        }), {
          status: 429,
          headers: {
            ...corsHeaders,
            'Retry-After': String(retryAfter)
          }
        });
      } else {
        await env.DB.prepare(`
          UPDATE rate_limits SET request_count = request_count + 1 WHERE ip_hash = ?
        `).bind(ipHash).run();
      }
    } catch {
      // Continue safely if rate limit table is momentarily locked
    }
  }

  // 2. PAYLOAD VALIDATION
  try {
    const rawBody = await request.text();
    if (rawBody.length > 4096) {
      return new Response(JSON.stringify({ error: 'Payload too large' }), { status: 413, headers: corsHeaders });
    }

    const data = JSON.parse(rawBody) as {
      event_type: string;
      visitor_id?: string;
      distance?: number;
      coins?: number;
      referrer?: string;
    };

    if (!['VISIT', 'PLAY', 'GAME_OVER'].includes(data.event_type)) {
      return new Response(JSON.stringify({ error: 'Invalid event_type' }), { status: 400, headers: corsHeaders });
    }

    // Extract Cloudflare Edge GeoIP & Client headers
    const cf = (request as unknown as { cf?: { country?: string; city?: string; region?: string } }).cf || {};
    const country = sanitize(cf.country || 'Unknown', 4);
    const city = sanitize(cf.city || 'Unknown', 64);
    const region = sanitize(cf.region || 'Unknown', 64);

    const userAgent = request.headers.get('user-agent') || '';
    const referrer = sanitize(data.referrer || request.headers.get('referer') || 'Direct', 128);

    // Accurate device platform detection
    let device = 'Desktop';
    if (/iphone|android.*mobile|mobile/i.test(userAgent)) device = 'Mobile';
    else if (/ipad|tablet|android(?!.*mobile)/i.test(userAgent)) device = 'Tablet';

    // Browser detection
    let browser = 'Other';
    if (/edg/i.test(userAgent)) browser = 'Edge';
    else if (/chrome|crios/i.test(userAgent)) browser = 'Chrome';
    else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari';
    else if (/firefox|fxios/i.test(userAgent)) browser = 'Firefox';

    const visitorId = sanitize(data.visitor_id || 'anon', 36);
    const distance = Math.min(Math.max(0, Number(data.distance) || 0), 100000);
    const coins = Math.min(Math.max(0, Math.floor(Number(data.coins) || 0)), 50000);

    // Insert into D1 Database
    if (env.DB) {
      await env.DB.prepare(`
        INSERT INTO analytics_events (
          event_type, visitor_id, country, city, region, device, browser, referrer, distance, coins
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        data.event_type,
        visitorId,
        country,
        city,
        region,
        device,
        browser,
        referrer,
        distance,
        coins
      ).run();
    }

    return new Response(JSON.stringify({ success: true, country, city, device }), {
      status: 200,
      headers: corsHeaders
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON request' }), {
      status: 400,
      headers: corsHeaders
    });
  }
};

function sanitize(str: string, maxLen: number): string {
  if (!str) return '';
  return String(str).substring(0, maxLen).replace(/[<>'"]/g, '');
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
}
