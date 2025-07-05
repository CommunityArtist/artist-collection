import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import OpenAI from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header to identify the user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '');
    
    // Get user from the token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Invalid authentication token');
    }

    // Fetch user-specific API key
    const { data: apiConfig, error: fetchError } = await supabaseClient
      .from('api_config')
      .select('key_value')
      .eq('key_name', 'openai_api_key')
      .eq('user_id', user.id)
      .single();

    if (fetchError || !apiConfig?.key_value) {
      throw new Error('OpenAI API key not found. Please configure your API key in the settings.');
    }

    const openai = new OpenAI({
      apiKey: apiConfig.key_value,
    });

    const { prompt, promptData } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const systemPrompt = `You are an expert content creator and metadata specialist for AI art generation. Your task is to create compelling titles, detailed notes, and appropriate SREF numbers based on the generated prompt and input data.

Guidelines:
1. TITLE: Create a catchy, descriptive title (3-8 words) that captures the essence and style of the image
2. NOTES: Write detailed notes about the creation process, techniques used, and artistic choices (2-3 sentences)
3. SREF: Generate a realistic SREF number in the format "SREF-XXXX" where XXXX is a 4-digit number

The title should be engaging and suitable for social media sharing.
The notes should be informative for other creators who want to understand the process.
The SREF should feel authentic and professional.

Respond in JSON format with exactly these keys: "title", "notes", "sref"`;

    const userPrompt = `Based on this generated prompt and input data, create metadata:

GENERATED PROMPT:
${prompt}

ORIGINAL INPUT DATA:
- Subject: ${promptData.subject || 'Not specified'}
- Setting: ${promptData.setting || 'Not specified'}
- Style: ${promptData.style || 'Not specified'}
- Mood: ${promptData.mood || 'Not specified'}
- Enhancement Level: ${promptData.enhanceLevel || 0}
- Category: ${promptData.selectedCategory || 'General'}

Create engaging title, informative notes, and professional SREF number.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    const response = completion.choices[0]?.message?.content?.trim();

    if (!response) {
      throw new Error('OpenAI API returned an empty response');
    }

    let metadata;
    try {
      metadata = JSON.parse(response);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      metadata = {
        title: "AI Generated Artwork",
        notes: "Created using advanced AI prompt engineering techniques with professional enhancement codes for maximum realism and quality.",
        sref: `SREF-${Math.floor(1000 + Math.random() * 9000)}`
      };
    }

    // Ensure all required fields exist
    if (!metadata.title || !metadata.notes || !metadata.sref) {
      throw new Error('Generated metadata is incomplete');
    }

    return new Response(
      JSON.stringify(metadata),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error:', error);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error instanceof Error) {
      if (error.message.includes('Incorrect API key')) {
        errorMessage = 'Invalid OpenAI API key. Please check your API key in settings.';
      } else if (error.message.includes('You exceeded your current quota')) {
        errorMessage = 'OpenAI API quota exceeded. Please check your OpenAI account billing and usage limits.';
      } else if (error.message.includes('API key not found')) {
        errorMessage = 'OpenAI API key not found. Please configure your API key in the settings.';
      } else if (error.message.includes('insufficient_quota')) {
        errorMessage = 'Insufficient OpenAI credits. Please add credits to your OpenAI account.';
      } else if (error.message.includes('invalid_api_key')) {
        errorMessage = 'Invalid OpenAI API key format. Please check your API key in settings.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error occurred while connecting to OpenAI';
      } else {
        errorMessage = error.message;
      }
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});