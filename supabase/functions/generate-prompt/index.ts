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

    const promptData = await req.json();

    // Validate required fields
    const requiredFields = ['subject', 'setting', 'lighting', 'style', 'mood'];
    const missingFields = requiredFields.filter(field => !promptData[field]?.trim());

    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const systemPrompt = `You are an expert professional photographer and prompt engineer specializing in creating detailed prompts for AI image generation. 

Your prompts should be comprehensive and include:
1. Subject Description:
   - Detailed physical attributes
   - Pose and expression
   - Clothing and accessories

2. Environment & Setting:
   - Location details
   - Time of day
   - Atmospheric elements

3. Technical Photography Specifications:
   - Camera recommendations (choose from: Canon EOS R5, Sony A7R IV, Nikon Z9, Hasselblad X2D)
   - Lens selection with specific focal lengths and apertures
   - Lighting setup (main light, fill, rim lights, etc.)
   - Camera settings (ISO, shutter speed when relevant)

4. Artistic Elements:
   - Style and mood
   - Color palette
   - Post-processing suggestions
   - Composition guidelines

Always include specific camera and lens recommendations that would best capture the desired effect, even if not explicitly provided in the input.

When enhancement codes are provided, seamlessly integrate them into the prompt to improve realism, technical quality, and professional appearance.

Format your response as a clear, detailed prompt that reads naturally while incorporating all technical details and enhancements.`;

    let userPrompt = `Create a detailed image generation prompt using these elements:

Main Elements:
- Subject: ${promptData.subject}
- Setting: ${promptData.setting}
- Lighting: ${promptData.lighting}
- Style: ${promptData.style}
- Mood: ${promptData.mood}

Additional Details:
${promptData['color palette'] ? `- Color Palette: ${promptData['color palette']}\n` : ''}
${promptData['camera settings'] ? `- Camera Settings: ${promptData['camera settings']}\n` : ''}
${promptData['post-processing'] ? `- Post-Processing: ${promptData['post-processing']}\n` : ''}
${promptData['additional details'] ? `- Additional Details: ${promptData['additional details']}\n` : ''}`;

    // Add enhancement codes if provided
    if (promptData.enhancement) {
      userPrompt += `\n\nProfessional Enhancement Codes (integrate these seamlessly for maximum realism and quality):
${promptData.enhancement}`;
    }

    userPrompt += `\n\nCreate a cohesive, detailed prompt that incorporates all these elements naturally.
Include specific camera and lens recommendations that would best capture this type of shot.
Focus on creating vivid imagery while maintaining technical accuracy and professional quality.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const generatedPrompt = completion.choices[0]?.message?.content?.trim();

    if (!generatedPrompt) {
      throw new Error('OpenAI API returned an empty response');
    }

    return new Response(
      JSON.stringify({ prompt: generatedPrompt }),
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