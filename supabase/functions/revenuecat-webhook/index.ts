// @ts-nocheck - Deno
/**
 * RevenueCat → Supabase: virtual currency bakiyesini `profiles.credits` ile hizala (okuma / raporlama).
 * Kredi satın alma ve harcama yalnızca RevenueCat’te; bu endpoint sadece ayna günceller.
 *
 * Dashboard: Integrations → Webhooks → URL: .../revenuecat-webhook
 * Authorization: RevenueCat’te (Bearer <REVENUECAT_WEBHOOK_AUTH> ile) Supabase’teki aynı secret
 * Gizl.: REVENUECAT_API_SECRET, REVENUECAT_PROJECT_ID, REVENUECAT_WEBHOOK_AUTH, REVENUECAT_VIRTUAL_CURRENCY_CODE
 */
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RC_V2 = 'https://api.revenuecat.com/v2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const SYNC_EVENT_TYPES = new Set([
  'VIRTUAL_CURRENCY_TRANSACTION',
  'TEST',
]);

function expectAuth(req: Request): boolean {
  const want = Deno.env.get('REVENUECAT_WEBHOOK_AUTH');
  if (!want) {
    console.warn('REVENUECAT_WEBHOOK_AUTH yok: webhook açık');
    return true;
  }
  const a = (req.headers.get('authorization') ?? req.headers.get('Authorization') ?? '').trim();
  return a === `Bearer ${want}` || a === want;
}

async function fetchVcBalance(
  projectId: string,
  appUserId: string,
  currencyCode: string,
  secret: string
): Promise<number | null> {
  const url = `${RC_V2}/projects/${projectId}/customers/${encodeURIComponent(
    appUserId
  )}/virtual_currencies`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const t = await res.text();
    console.error('RevenueCat GET virtual_currencies', res.status, t);
    return null;
  }
  const j = await res.json();
  const items = j.items ?? [];
  const row = items.find(
    (i: { currency_code: string; balance: number }) =>
      i.currency_code === currencyCode
  );
  return row?.balance ?? 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  if (!expectAuth(req)) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  let body: { event?: { type?: string; id?: string; app_user_id?: string } };
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: corsHeaders });
  }

  const event = body.event;
  if (!event) {
    return new Response(JSON.stringify({ ok: true, skipped: 'no event' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (event.type && !SYNC_EVENT_TYPES.has(event.type)) {
    return new Response(
      JSON.stringify({ ok: true, skipped: true, type: event.type }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const appUserId = event.app_user_id;
  if (!appUserId || typeof appUserId !== 'string') {
    return new Response(
      JSON.stringify({ ok: true, skipped: 'no app_user_id' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const projectId = Deno.env.get('REVENUECAT_PROJECT_ID');
  const secret = Deno.env.get('REVENUECAT_API_SECRET');
  if (!projectId || !secret) {
    return new Response(
      JSON.stringify({ error: 'revenuecat_env_missing' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const code = Deno.env.get('REVENUECAT_VIRTUAL_CURRENCY_CODE') ?? 'CRD';
  const balance = await fetchVcBalance(projectId, appUserId, code, secret);
  if (balance === null) {
    return new Response(
      JSON.stringify({ error: 'revenuecat_fetch_failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { error } = await supabase
    .from('profiles')
    .update({ credits: balance, updated_at: new Date().toISOString() })
    .eq('id', appUserId);

  if (error) {
    console.error('profiles update:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({ ok: true, app_user_id: appUserId, credits: balance, event_id: event.id }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
