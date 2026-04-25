// @ts-nocheck - Deno runtime; IDE Node/TS kullanıyor
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Replicate from 'https://esm.sh/replicate@0.31.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const RC_API = 'https://api.revenuecat.com/v2';

function rcAuthHeaders() {
  const key = Deno.env.get('REVENUECAT_API_SECRET');
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

async function rcGetBalanceForCode(
  projectId: string,
  customerId: string,
  currencyCode: string
): Promise<number> {
  const url = `${RC_API}/projects/${projectId}/customers/${encodeURIComponent(
    customerId
  )}/virtual_currencies`;
  const res = await fetch(url, { headers: rcAuthHeaders() });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`RevenueCat virtual_currencies: ${res.status} ${t}`);
  }
  const j = await res.json();
  const items = j.items ?? [];
  const row = items.find(
    (i: { currency_code: string; balance: number }) =>
      i.currency_code === currencyCode
  );
  return row?.balance ?? 0;
}

async function rcSpendOneCredit(
  projectId: string,
  customerId: string,
  currencyCode: string,
  idempotencyKey: string
) {
  const url = `${RC_API}/projects/${projectId}/customers/${encodeURIComponent(
    customerId
  )}/virtual_currencies/transactions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...rcAuthHeaders(),
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      adjustments: { [currencyCode]: -1 },
      reference: idempotencyKey,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`RevenueCat spend: ${res.status} ${t}`);
  }
  return res.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { user_id, prompt, artist_id } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const rcProject = Deno.env.get('REVENUECAT_PROJECT_ID');
  const rcSecret = Deno.env.get('REVENUECAT_API_SECRET');
  const vcCode = Deno.env.get('REVENUECAT_VIRTUAL_CURRENCY_CODE') ?? 'CRD';
  const useRevenueCatVc = Boolean(rcProject && rcSecret);

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits, language')
    .eq('id', user_id)
    .single();

  if (useRevenueCatVc) {
    try {
      const bal = await rcGetBalanceForCode(rcProject!, user_id, vcCode);
      if (bal < 1) {
        return new Response(
          JSON.stringify({ error: 'insufficient_credits' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (e) {
      console.error('RevenueCat balance check:', e);
      return new Response(
        JSON.stringify({ error: 'revenuecat_balance_error' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } else {
    if (!profile || profile.credits < 1) {
      return new Response(
        JSON.stringify({ error: 'insufficient_credits' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  const { data: artist } = await supabase
    .from('artists')
    .select('id, name, style_description, is_free')
    .eq('id', artist_id)
    .single();

  if (!artist) {
    return new Response(
      JSON.stringify({ error: 'artist_not_found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { data: modelData } = await supabase
    .from('replicate_models')
    .select('model_identifier, input_extra')
    .eq('key', 'image_generation')
    .single();

  const imagePrompt = `A dreamlike scene in the style of ${artist.name}. ${artist.style_description}. Scene: ${prompt}. Highly detailed, artistic, dream interpretation artwork.`;

  const replicate = new Replicate({
    auth: Deno.env.get('REPLICATE_API_TOKEN')!,
  });

  const output = (await replicate.run(
    modelData?.model_identifier ?? 'google/imagen-4',
    {
      input: {
        prompt: imagePrompt,
        ...(modelData?.input_extra ?? { aspect_ratio: '9:16' }),
      },
    }
  )) as string;

  const imageResponse = await fetch(output);
  const imageBuffer = await imageResponse.arrayBuffer();
  const fileName = `dreams/${crypto.randomUUID()}.png`;

  await supabase.storage
    .from('dream-images')
    .upload(fileName, imageBuffer, { contentType: 'image/png' });

  const {
    data: { publicUrl },
  } = supabase.storage.from('dream-images').getPublicUrl(fileName);

  const { data: llmModel } = await supabase
    .from('replicate_models')
    .select('model_identifier')
    .eq('key', 'interpretation')
    .single();

  const interpretation = await generateInterpretation(
    replicate,
    llmModel?.model_identifier ?? 'google/gemini-2.5-flash',
    prompt,
    profile.language ?? 'tr'
  );

  const { data: dream } = await supabase
    .from('dreams')
    .insert({
      user_id,
      prompt,
      artist_id,
      image_url: publicUrl,
      interpretation,
      moderation_status: 'approved',
    })
    .select()
    .single();

  if (useRevenueCatVc) {
    try {
      await rcSpendOneCredit(
        rcProject!,
        user_id,
        vcCode,
        `dream_spend_${dream.id}`
      );
    } catch (e) {
      console.error('RevenueCat spend failed, rolling back dream row:', e);
      await supabase.from('dreams').delete().eq('id', dream.id);
      return new Response(
        JSON.stringify({ error: 'credit_deduction_failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } else {
    await supabase
      .from('profiles')
      .update({
        credits: (profile?.credits ?? 0) - 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user_id);
  }

  return new Response(
    JSON.stringify({
      image_url: publicUrl,
      interpretation,
      dream_id: dream.id,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});

const INTERPRETATION_OUTPUT_LANGUAGE: Record<string, string> = {
  en: 'English',
  ru: 'Russian',
  ar: 'Arabic',
  de: 'German',
  el: 'Greek',
  es: 'Spanish',
  fi: 'Finnish',
  fr: 'French',
  hi: 'Hindi',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  nl: 'Dutch',
  pl: 'Polish',
  pt: 'Portuguese',
};

function buildInterpretationSystemPrompt(language: string): string {
  if (language === 'tr') {
    return `Sen deneyimli bir rüya yorumcususun. Rüyaları sıcak, samimi ve kişisel bir dille yorumluyorsun - sanki bir arkadaşla sohbet ediyormuşsun gibi.

KURALLAR:
- Madde işareti, numara, başlık veya bölüm numarası (ör. "2.", "1)") kullanma. Satır başında *, -, •, # asla yazma.
- "Bu çok güçlü bir rüya", "İşte yorumlar" gibi kalıp ifadeler kullanma.
- Sembolleri doğal cümleler içinde anlat. Örneğin: "Atlar genelde güç ve özgürlük demek. Senin rüyanda 15 at görmen..." 
- 3-4 kısa paragraf yaz. Her paragraf 2-4 cümle; paragraflar arasında boş satır bırak.
- **, *, #, _ ve kod tırnağı gibi hiçbir markdown veya liste sembolü kullanma. Sadece düz cümleler ve noktalama.
- Kişiye hitap et ama abartma. "Rüyanda gördüğün..." gibi doğal başla.`;
  }

  const outputLanguage =
    INTERPRETATION_OUTPUT_LANGUAGE[language] ?? 'English';

  return `You are an experienced dream interpreter. Interpret dreams in a warm, intimate, personal tone - like chatting with a friend.

RULES:
- No bullet points, numbered lists, section titles, or lines starting with *, -, •, or #.
- No patterns like "2." or "1)" at the start of a line. Use only flowing prose paragraphs separated by blank lines.
- Avoid clichés like "This is a powerful dream" or "Here are the interpretations".
- Explain symbols naturally in sentences. E.g. "Horses often mean power and freedom. Seeing 15 in your dream..."
- Write 3-4 short paragraphs. 2-4 sentences each.
- Never use **, *, #, _, backticks, or any markdown. Plain text and punctuation only.
- Address the person naturally. Start with "What you saw in your dream..."
- Write the entire interpretation in ${outputLanguage}.`;
}

function sanitizeInterpretationOutput(raw: string): string {
  let t = String(raw).replace(/\r\n/g, '\n').trim();
  t = t.replace(/^[\s*\-–—_#]+$/gm, '');
  const blocks = t.split(/\n{2,}/);
  const paragraphs: string[] = [];
  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((line) => {
        let s = line.trim();
        for (let i = 0; i < 6; i += 1) {
          const n = s
            .replace(/^#{1,6}\s+/u, '')
            .replace(/^\d{1,2}[\.\)]\s+/u, '')
            .replace(/^[-*+–—•·▪]\s*/u, '');
          if (n === s) break;
          s = n.trim();
        }
        return s;
      })
      .filter((l) => l.length > 0);
    if (lines.length === 0) continue;
    let merged = lines.join(' ');
    merged = merged.replace(/\*\*([\s\S]*?)\*\*/g, '$1');
    merged = merged.replace(/__([\s\S]*?)__/g, '$1');
    merged = merged.replace(/\*([^*\n]+)\*/g, '$1');
    merged = merged.replace(/\*+/g, '');
    merged = merged.replace(/#{1,6}\s*/g, '');
    merged = merged.replace(/\s+/g, ' ').trim();
    if (merged.length > 0) paragraphs.push(merged);
  }
  return paragraphs.join('\n\n');
}

async function generateInterpretation(
  replicate: Replicate,
  model: string,
  dreamText: string,
  language: string
): Promise<string> {
  const systemPrompt = buildInterpretationSystemPrompt(language);

  const output = await replicate.run(model, {
    input: { prompt: dreamText, system_prompt: systemPrompt },
  } as Record<string, unknown>);

  const raw = Array.isArray(output) ? output.join('') : String(output);
  return sanitizeInterpretationOutput(raw);
}
