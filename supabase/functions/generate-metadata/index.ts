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

    const systemPrompt = `You are an expert art curator and photography specialist who creates compelling metadata for professional photography and AI-generated artwork. Your expertise lies in crafting evocative titles and detailed technical descriptions that capture both the artistic vision and technical execution.

TITLE CREATION GUIDELINES:
- Create poetic, evocative titles that capture the mood and essence (2-4 words)
- Use artistic language that suggests emotion, atmosphere, or narrative
- Examples: "Serene Muse in Bloom", "Golden Hour Reverie", "Ethereal Garden Dreams", "Sunlit Contemplation"
- Avoid generic terms like "AI Generated", "Portrait", "Woman", etc.
- Focus on the emotional or atmospheric qualities

NOTES CREATION GUIDELINES:
- Write 2-3 detailed sentences describing the technical approach and artistic vision
- Include specific lighting techniques, camera settings, and compositional choices
- Mention the mood, atmosphere, and emotional impact
- Reference professional photography techniques used
- Example format: "Using [lighting technique] and [camera setup], this portrait captures [subject description] in [emotional state/setting]. The composition highlights [specific elements] while emphasizing [artistic approach]. [Additional technical or artistic detail]."

SREF GUIDELINES:
- Generate realistic reference numbers in format "SREF-XXXX" where XXXX is 4 digits
- Use numbers that feel professional and authentic (1000-9999 range)

STYLE REQUIREMENTS:
- Titles should be Instagram/social media ready
- Notes should sound like professional photography descriptions
- Use sophisticated, artistic language
- Focus on the craft and technique behind the image
- Emphasize the emotional and visual impact
- Avoid mentioning "AI" or "generated" in titles or notes
- Write as if describing a professional photographer's work

Respond in JSON format with exactly these keys: "title", "notes", "sref"`;

    const userPrompt = `Based on this generated prompt and input data, create metadata:

GENERATED PROMPT:
${prompt}

KEY ELEMENTS TO CONSIDER:
- Main Subject: ${promptData.subject || 'Not specified'}
- Setting/Environment: ${promptData.setting || 'Not specified'}  
- Photography Style: ${promptData.style || 'Not specified'}
- Mood & Atmosphere: ${promptData.mood || 'Not specified'}
- Lighting Setup: ${promptData.lighting || 'Not specified'}
- Camera & Technical: ${promptData.camera_lens || 'Professional camera setup'}
- Enhancement Category: ${promptData.selectedCategory || 'Natural Photography'}
- Enhancement Level: ${promptData.enhanceLevel || 0}/5

Create a poetic title that captures the essence and mood, detailed professional notes about the photographic technique and artistic vision, and a realistic SREF number.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
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
        title: "Artistic Portrait Study",
        notes: "Captured using professional lighting techniques and careful composition to create an intimate and contemplative mood. The natural lighting and shallow depth of field emphasize the subject's expression while maintaining authentic skin texture and detail.",
        sref: `SREF-${Math.floor(2000 + Math.random() * 7000)}`
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
    
    let errorMessage = 'Failed to generate metadata';
    
    if (error instanceof Error) {
      if (error.message.includes('Incorrect API key')) {
        errorMessage = 'Invalid OpenAI API key. Please check your API key in settings.';
      } else if (error.message.includes('You exceeded your current quota')) {
        errorMessage = 'OpenAI API quota exceeded. Please check your OpenAI account billing and usage limits.';
      } else if (error.message.includes('API key not found')) {
        errorMessage = 'OpenAI API key not found. Please configure your API key in the settings.';
      } else if (error.message.includes('insufficient_quota')) {
        errorMessage = 'Insufficient OpenAI credits. Please add credits to your OpenAI account.';
      }
      if (error.message.includes('Incorrect API key')) {
        errorMessage = 'Invalid OpenAI API key. Please check your API key in settings.';
      } else if (error.message.includes('You exceeded your current quota')) {
        errorMessage = 'OpenAI API quota exceeded. Please check your OpenAI account billing and usage limits.';
      } else if (error.message.includes('API key not found')) {
        errorMessage = 'OpenAI API key not found. Please configure your API key in the settings.';
      } else if (error.message.includes('insufficient_quota')) {
        errorMessage = 'Insufficient OpenAI credits. Please add credits to your OpenAI account.';
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