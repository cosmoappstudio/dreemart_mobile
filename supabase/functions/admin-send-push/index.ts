// @ts-nocheck - Deno
/**
 * Yönetici paneli: POST JSON ile basit giriş + push.
 *
 * Supabase → Project Settings → Edge Functions → Secrets:
 *   ADMIN_PANEL_USERNAME  (örn. admin)
 *   ADMIN_PANEL_PASSWORD  (güçlü şifre; repoya yazma)
 *
 * İstek gövdesi:
 * {
 *   "admin_username": "admin",
 *   "admin_password": "…",
 *   "title": "Başlık",
 *   "body": "Bildirim metni",
 *   "user_ids": ["uuid", ...],
 *   "data": { } // isteğe bağlı
 * }
 *
 * Çağrı: Authorization: Bearer <SUPABASE_ANON_KEY> (Supabase gateway; mobil uygulamadaki anon key ile aynı)
 */
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const MAX_IDS = 500;
const CHUNK = 100;

const panelOrigin = Deno.env.get('ADMIN_PANEL_ORIGIN') ?? 'https://dreemart.app';

const corsHeaders = {
  'Access-Control-Allow-Origin': panelOrigin,
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function panelLoginOk(raw: Record<string, unknown>): boolean {
  const wantUser = Deno.env.get('ADMIN_PANEL_USERNAME')?.trim();
  const wantPass = Deno.env.get('ADMIN_PANEL_PASSWORD');
  if (!wantUser || wantPass === undefined || wantPass === '') {
    return false;
  }
  const gotUser =
    typeof raw.admin_username === 'string' ? raw.admin_username.trim() : '';
  const gotPass =
    typeof raw.admin_password === 'string' ? raw.admin_password : '';
  return gotUser === wantUser && gotPass === wantPass;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'method_not_allowed' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceKey) {
    return json(500, { error: 'server_misconfigured' });
  }

  let raw: Record<string, unknown>;
  try {
    raw = await req.json();
  } catch {
    return json(400, { error: 'invalid_json' });
  }

  if (!panelLoginOk(raw)) {
    return json(401, { error: 'geçersiz_giriş' });
  }

  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  const text = typeof raw.body === 'string' ? raw.body.trim() : '';
  const userIds = Array.isArray(raw.user_ids) ? raw.user_ids : [];

  if (!title || !text) {
    return json(400, { error: 'title_and_body_required' });
  }
  if (userIds.length === 0) {
    return json(400, { error: 'user_ids_required', hint: 'En az bir kullanıcı UUID gönderin' });
  }
  if (userIds.length > MAX_IDS) {
    return json(400, { error: 'too_many_recipients', max: MAX_IDS });
  }

  const uniqueIds = [...new Set(userIds.map((id) => String(id).trim()).filter(Boolean))];
  const service = createClient(supabaseUrl, serviceKey);

  const { data: rows, error: qErr } = await service
    .from('profiles')
    .select('id, push_token')
    .in('id', uniqueIds);

  if (qErr) {
    return json(500, { error: 'db_error', details: qErr.message });
  }

  const tokens = (rows ?? [])
    .map((r: { id: string; push_token: string | null }) => ({
      id: r.id,
      token: r.push_token?.trim() ?? '',
    }))
    .filter((r) => r.token.startsWith('ExponentPushToken['));

  if (tokens.length === 0) {
    return json(200, {
      ok: true,
      sent: 0,
      skipped_no_token: uniqueIds.length,
      message: 'Hiçbir hedefte geçerli Expo push token yok (iOS kayıtlı mı?)',
    });
  }

  const data =
    raw.data && typeof raw.data === 'object' && raw.data !== null && !Array.isArray(raw.data)
      ? (raw.data as Record<string, unknown>)
      : undefined;

  const basePayload = {
    title,
    body: text,
    sound: 'default' as const,
    ...(data ? { data } : {}),
  };

  let sent = 0;
  const ticketErrors: string[] = [];

  for (let i = 0; i < tokens.length; i += CHUNK) {
    const slice = tokens.slice(i, i + CHUNK);
    const messages = slice.map((t) => ({
      to: t.token,
      ...basePayload,
    }));

    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const rawText = await res.text();
    let parsed: { data?: unknown; errors?: unknown };
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return json(502, { error: 'expo_push_invalid_response', status: res.status, raw: rawText });
    }

    if (!res.ok) {
      return json(502, {
        error: 'expo_push_http_error',
        status: res.status,
        expo: parsed,
      });
    }

    const tickets = Array.isArray(parsed.data) ? parsed.data : parsed.data ? [parsed.data] : [];
    for (const ticket of tickets) {
      if (ticket && typeof ticket === 'object' && 'status' in ticket) {
        if ((ticket as { status: string }).status === 'ok') {
          sent += 1;
        } else {
          const msg = (ticket as { message?: string }).message ?? JSON.stringify(ticket);
          ticketErrors.push(msg);
        }
      }
    }
  }

  return json(200, {
    ok: true,
    sent,
    targets_with_token: tokens.length,
    requested_users: uniqueIds.length,
    ticket_errors: ticketErrors.slice(0, 20),
  });
});
