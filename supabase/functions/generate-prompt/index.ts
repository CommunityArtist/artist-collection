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
      console.error('API key fetch error:', fetchError);
      throw new Error('OpenAI API key not found. Please configure your API key in the API Configuration page. Go to Account > API Config to set up your OpenAI API key.');
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

    const systemPrompt = `You are an expert professional photographer and prompt engineer specializing in creating detailed prompts for AI image generation that produce photorealistic, human-like results.

CRITICAL REALISM REQUIREMENTS:
- Always emphasize PHOTOREALISTIC and NATURAL human features
- Include specific details about natural skin texture, pores, and subtle imperfections
- Mention realistic lighting that shows natural shadows and highlights on skin
- Avoid overly perfect or artificial-looking descriptions
- Focus on authentic human expressions and natural poses
- Include environmental details that enhance realism

HUMAN-LIKE ENHANCEMENT GUIDELINES:
- Describe natural skin texture: "detailed skin texture with visible pores", "natural skin imperfections", "realistic skin tone variations"
- Emphasize authentic expressions: "genuine smile", "natural eye contact", "subtle facial expressions"
- Include realistic hair details: "individual hair strands", "natural hair texture", "realistic hair movement"
- Mention natural lighting effects: "soft natural lighting on skin", "realistic shadows", "natural skin glow"
- Add environmental realism: "natural depth of field", "realistic background blur", "authentic atmospheric perspective"

Your prompts should be comprehensive and include:

1. Subject Description (with enhanced realism):
   - Detailed physical attributes with natural imperfections
   - Authentic pose and genuine expression
   - Realistic clothing with natural fabric textures
   - Natural skin texture and realistic features

2. Environment & Setting:
   - Location details with realistic lighting
   - Time of day with natural atmospheric conditions
   - Authentic environmental elements

3. Technical Photography Specifications:
   - Camera recommendations (choose from: Canon EOS R5, Sony A7R IV, Nikon Z9, Hasselblad X2D)
   - Lens selection with specific focal lengths and apertures for natural perspective
   - Professional lighting setup that enhances natural features
   - Camera settings optimized for realistic skin tones (ISO, color temperature)

4. Artistic Elements (focused on realism):
   - Photorealistic style with natural color grading
   - Authentic mood and atmosphere
   - Natural color palette that enhances skin tones
   - Minimal post-processing for natural appearance
   - Composition that feels candid and authentic

REALISM KEYWORDS TO INCLUDE:
Always incorporate these terms naturally: "photorealistic", "natural skin texture", "realistic lighting", "authentic", "genuine", "detailed pores", "natural imperfections", "lifelike", "candid", "unretouched quality"

When enhancement codes are provided, seamlessly integrate them while maintaining the focus on photorealism and natural human features.

Format your response as a clear, detailed prompt that reads naturally while incorporating all technical details, enhancements, and realism requirements.`;

    let userPrompt = `Create a detailed PHOTOREALISTIC photography prompt with these specifications:
- Subject: ${promptData.subject}
- Lighting: ${promptData.lighting}
- Style: ${promptData.style}
- Mood: ${promptData.mood}
- Setting: ${promptData.setting}`;

    if (promptData['post-processing']) {
      userPrompt += `\n- Post-Processing: ${promptData['post-processing']}`;
    }

    if (promptData.enhancement) {
      userPrompt += `\n- Enhancement Codes: ${promptData.enhancement}`;
    }

    userPrompt += `

IMPORTANT: Create a cohesive, detailed prompt that produces PHOTOREALISTIC, HUMAN-LIKE images with:
- Natural skin texture with visible pores and subtle imperfections
- Realistic lighting that shows natural shadows and highlights
- Authentic human expressions and genuine emotions
- Natural hair texture and individual strand details
- Realistic fabric textures and natural clothing drape
- Candid, unposed feeling with authentic atmosphere

Include specific camera and lens recommendations optimized for natural human photography.
Focus on creating vivid, lifelike imagery while maintaining photographic authenticity and professional quality.
Avoid artificial or overly perfect descriptions - emphasize natural, realistic human features.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
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