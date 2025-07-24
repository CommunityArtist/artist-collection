import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import OpenAI from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '3600'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    // Check user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authentication required. Please sign in to use this feature.');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from auth token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication. Please sign in again.');
    }

    // Use shared OpenAI API key from environment variables
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      console.error('OpenAI API key not found in environment variables');
      throw new Error('OpenAI API key not configured in system. Please contact support.');
    }

    console.log('OpenAI API key found, initializing OpenAI client');

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    const promptData = await req.json();

    // Validate required fields
    const requiredFields = ['subjectAndSetting', 'lighting', 'style', 'mood'];
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

CRITICAL OUTPUT FORMAT REQUIREMENT:
You must respond with a valid JSON object containing exactly two keys: "prompt" and "negativePrompt". Do not include any other text, markdown formatting, or explanations outside of this JSON structure.

ABSOLUTE PRIORITY - PHOTOGRAPHIC REALISM:
Every prompt MUST result in images that look like REAL PHOTOGRAPHS, never digital art. This is the highest priority requirement.

REALISM REQUIREMENTS FOR HUMAN SUBJECTS:
REALISM KEYWORDS TO NATURALLY INTEGRATE:
Seamlessly weave these terms throughout your response: photorealistic, natural skin texture with visible pores, realistic lighting with natural shadows, authentic, genuine, detailed pores and skin imperfections, natural hair texture with realistic movement, lifelike, candid, unretouched documentary quality, real photograph.

CRITICAL HAIR AND SKIN REQUIREMENTS:
HAIR MUST ALWAYS be: natural texture, slightly imperfect, with realistic movement and natural variations, never perfectly sculpted or styled, with individual strands visible, organic and authentic appearance.
SKIN MUST ALWAYS be: natural texture with visible pores, subtle imperfections, natural color variations, never waxy or overly smooth, with authentic human characteristics and natural aging signs.

RAW PHOTOGRAPHY EMPHASIS:
Emphasize raw, unprocessed photographic qualities by including terms like: unretouched skin with natural texture, natural blemishes and imperfections, realistic skin variations, authentic lighting imperfections, natural shadows and highlights, candid moment capture, documentary-style realism, street photography authenticity, natural environmental lighting, unposed genuine expressions, and slightly imperfect natural hair. NEVER mention perfection, idealization, or flawless features.

When enhancement codes are provided, integrate them naturally into the flowing text while maintaining focus on photorealism and natural human features.

Write your response as one continuous, descriptive paragraph that reads naturally while incorporating all technical details, enhancements, and realism requirements without any formatting symbols or structure markers.

NEGATIVE PROMPT REQUIREMENTS:
The negativePrompt field MUST include strong prohibitions against: digital art, illustration, painting, CGI, rendered, artificial, synthetic, plastic skin, waxy appearance, perfect skin, sculpted hair, perfect hair, overly polished, digital portrait, beauty filter, Instagram filter, artificial perfection.`;

    let userPrompt = `Create a detailed photorealistic photography prompt as a single flowing paragraph with these specifications: Subject and Setting is ${promptData.subjectAndSetting}, Lighting is ${promptData.lighting}, Style is ${promptData.style}, Mood is ${promptData.mood}`;

    if (promptData['post-processing']) {
      userPrompt += `, Post-Processing is ${promptData['post-processing']}`;
    }

    if (promptData.enhancement) {
      userPrompt += `, Enhancement Codes are ${promptData.enhancement}`;
    }

    userPrompt += `. Create a cohesive, detailed prompt that produces REAL PHOTOGRAPHS that look like they were taken with an actual camera, NEVER digital art. The images MUST have natural skin texture with visible pores and subtle imperfections, natural hair with realistic texture and slight imperfections (never sculpted or perfect), realistic lighting that shows natural shadows and highlights, authentic human expressions and genuine emotions, realistic fabric textures and natural clothing drape, and candid, unposed feeling with authentic atmosphere. Include specific camera and lens recommendations optimized for natural human photography. Focus on creating vivid, lifelike imagery while maintaining photographic authenticity and professional quality. ABSOLUTELY AVOID any digital art appearance, artificial perfection, waxy skin, sculpted hair, or overly polished looks. The result MUST look like a real photograph taken by a professional photographer, not digital art. Write everything as one continuous paragraph without any formatting symbols, headings, or bullet points.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content?.trim();

    if (!response) {
      throw new Error('OpenAI API returned an empty response');
    }

    let promptResponse;
    try {
      // Parse the JSON response
      promptResponse = JSON.parse(response);
      
      // Validate the response structure
      if (!promptResponse.prompt || !promptResponse.negativePrompt) {
        throw new Error('Invalid response structure: missing prompt or negativePrompt');
      }
      
      if (typeof promptResponse.prompt !== 'string' || typeof promptResponse.negativePrompt !== 'string') {
        throw new Error('Invalid response structure: prompt and negativePrompt must be strings');
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.error('Raw response:', response);
      throw new Error('Failed to parse AI response. Please try again.');
    }

    console.log('Successfully generated prompt');

    return new Response(
      JSON.stringify(promptResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-prompt function:', error);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error instanceof Error) {
      if (error.message.includes('Incorrect API key')) {
        errorMessage = 'Invalid OpenAI API key. Please contact support.';
      } else if (error.message.includes('You exceeded your current quota')) {
        errorMessage = 'OpenAI API quota exceeded. Please contact support.';
      } else if (error.message.includes('API key not found')) {
        errorMessage = 'OpenAI API key not configured in system. Please contact support.';
      } else if (error.message.includes('insufficient_quota')) {
        errorMessage = 'Insufficient OpenAI credits. Please contact support.';
      } else if (error.message.includes('invalid_api_key')) {
        errorMessage = 'Invalid OpenAI API key. Please contact support.';
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