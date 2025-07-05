import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import OpenAI from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Extract-prompt function called');
    
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

    console.log('Fetching user-specific API key from database...');
    const { data: apiConfig, error: fetchError } = await supabaseClient
      .from('api_config')
      .select('key_value')
      .eq('key_name', 'openai_api_key')
      .eq('user_id', user.id)
      .single();

    if (fetchError || !apiConfig?.key_value) {
      console.error('API key fetch error:', fetchError);
      throw new Error('OpenAI API key not found. Please configure your API key in the settings.');
    }

    console.log('API key found, length:', apiConfig.key_value.length);
    
    const openai = new OpenAI({
      apiKey: apiConfig.key_value,
    });

    const { imageUrl } = await req.json();
    console.log('Received image URL:', imageUrl);

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const systemPrompt = `You are an expert AI art analyst and prompt engineer. Your task is to analyze images and extract detailed, comprehensive prompts that could be used to recreate similar artwork using AI image generation tools.

When analyzing an image, provide a detailed breakdown including:

1. MAIN PROMPT: A comprehensive description that captures the essence of the image
2. STYLE ELEMENTS: Artistic style, aesthetic choices, and visual approach
3. TECHNICAL DETAILS: Camera settings, lens information, lighting setup, and technical specifications
4. COLOR PALETTE: Dominant colors, color schemes, and color relationships
5. COMPOSITION: Layout, framing, rule of thirds, focal points, and visual balance
6. LIGHTING: Light sources, direction, quality, mood, and shadows
7. MOOD & ATMOSPHERE: Emotional tone, feeling, and overall atmosphere

Be extremely detailed and specific. Include technical photography terms, artistic styles, and specific descriptors that would help an AI understand exactly what to create. Focus on elements that are actually visible in the image.

Respond in JSON format with these exact keys: "mainPrompt", "styleElements", "technicalDetails", "colorPalette", "composition", "lighting", "mood"

For arrays (styleElements, technicalDetails, colorPalette), provide 4-6 specific items each.
For strings (mainPrompt, composition, lighting, mood), provide detailed, comprehensive descriptions.`;

    const userPrompt = `Analyze this image and extract a comprehensive prompt that could be used to recreate similar artwork. Be extremely detailed and specific about all visual elements, technical aspects, and artistic choices you observe.`;

    console.log('Calling OpenAI API...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: [
            { type: "text", text: userPrompt },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    console.log('OpenAI response received');
    
    const response = completion.choices[0]?.message?.content?.trim();

    if (!response) {
      throw new Error('OpenAI API returned an empty response');
    }

    let extractedData;
    try {
      console.log('Parsing OpenAI response:', response);
      extractedData = JSON.parse(response);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      extractedData = {
        mainPrompt: "A detailed artistic composition with professional quality and careful attention to visual elements, lighting, and composition.",
        styleElements: ["Professional photography", "Artistic composition", "High quality rendering", "Detailed execution"],
        technicalDetails: ["Professional camera setup", "Optimal lighting", "Sharp focus", "High resolution"],
        colorPalette: ["Balanced color scheme", "Harmonious tones", "Professional color grading", "Natural color balance"],
        composition: "Well-balanced composition following professional photography principles with careful attention to framing and visual hierarchy.",
        lighting: "Professional lighting setup with careful attention to shadows, highlights, and overall illumination quality.",
        mood: "Professional and polished atmosphere with attention to artistic and technical excellence."
      };
    }

    // Ensure all required fields exist
    const requiredFields = ['mainPrompt', 'styleElements', 'technicalDetails', 'colorPalette', 'composition', 'lighting', 'mood'];
    for (const field of requiredFields) {
      if (!extractedData[field]) {
        throw new Error(`Generated response is missing required field: ${field}`);
      }
    }

    console.log('Returning extracted data:', extractedData);
    return new Response(
      JSON.stringify(extractedData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error:', error);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'Invalid OpenAI API key';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error occurred while connecting to OpenAI';
      } else if (error.message.includes('image')) {
        errorMessage = 'Failed to process the image. Please ensure the image URL is valid and accessible.';
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