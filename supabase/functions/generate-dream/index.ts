// @ts-nocheck - Deno runtime; IDE Node/TS kullanıyor
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Replicate from 'https://esm.sh/replicate@0.31.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { user_id, prompt, artist_id } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits, tier, language')
    .eq('id', user_id)
    .single();

  if (!profile || profile.credits < 1) {
    return new Response(
      JSON.stringify({ error: 'insufficient_credits' }),
      { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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

  if (profile.tier === 'free' && !artist.is_free) {
    return new Response(
      JSON.stringify({ error: 'artist_not_available_for_free_users' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

  await supabase
    .from('profiles')
    .update({
      credits: profile.credits - 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user_id);

  return new Response(
    JSON.stringify({
      image_url: publicUrl,
      interpretation,
      dream_id: dream.id,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});

async function generateInterpretation(
  replicate: Replicate,
  model: string,
  dreamText: string,
  language: string
): Promise<string> {
  const systemPrompt =
    language === 'tr'
      ? `Sen deneyimli bir rüya yorumcususun. Rüyaları sıcak, samimi ve kişisel bir dille yorumluyorsun - sanki bir arkadaşla sohbet ediyormuşsun gibi.

KURALLAR:
- Madde işareti, numara veya başlık kullanma. Akıcı paragraf yaz.
- "Bu çok güçlü bir rüya", "İşte yorumlar" gibi kalıp ifadeler kullanma.
- Sembolleri doğal cümleler içinde anlat. Örneğin: "Atlar genelde güç ve özgürlük demek. Senin rüyanda 15 at görmen..." 
- 3-4 kısa paragraf yaz. Her paragraf 2-4 cümle.
- Markdown, bold veya formatlama kullanma. Düz metin yaz.
- Kişiye hitap et ama abartma. "Rüyanda gördüğün..." gibi doğal başla.`
      : `You are an experienced dream interpreter. Interpret dreams in a warm, intimate, personal tone - like chatting with a friend.

RULES:
- No bullet points, numbers or headings. Write flowing paragraphs.
- Avoid clichés like "This is a powerful dream" or "Here are the interpretations".
- Explain symbols naturally in sentences. E.g. "Horses often mean power and freedom. Seeing 15 in your dream..."
- Write 3-4 short paragraphs. 2-4 sentences each.
- No markdown, bold or formatting. Plain text only.
- Address the person naturally. Start with "What you saw in your dream..."`;

  const output = await replicate.run(model, {
    input: { prompt: dreamText, system_prompt: systemPrompt },
  } as Record<string, unknown>);

  return Array.isArray(output) ? output.join('') : String(output);
}
