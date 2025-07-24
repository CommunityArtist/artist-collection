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

REALISM REQUIREMENTS FOR HUMAN SUBJECTS:
REALISM KEYWORDS TO NATURALLY INTEGRATE:
Seamlessly weave these terms throughout your response: photorealistic, natural skin texture, realistic lighting, authentic, genuine, detailed pores, natural imperfections, lifelike, candid, unretouched quality.

RAW PHOTOGRAPHY EMPHASIS:
Emphasize raw, unprocessed photographic qualities by including terms like: unretouched skin, natural blemishes, realistic skin variations, authentic lighting imperfections, natural shadows and highlights, candid moment capture, documentary-style realism, street photography authenticity, natural environmental lighting, and unposed genuine expressions. Avoid any mention of perfection or idealization.

When enhancement codes are provided, integrate them naturally into the flowing text while maintaining focus on photorealism and natural human features.

Write your response as one continuous, descriptive paragraph that reads naturally while incorporating all technical details, enhancements, and realism requirements without any formatting symbols or structure markers.`;

    let userPrompt = `Create a detailed photorealistic photography prompt as a single flowing paragraph with these specifications: Subject is ${promptData.subject}, Lighting is ${promptData.lighting}, Style is ${promptData.style}, Mood is ${promptData.mood}, Setting is ${promptData.setting}`;
    let userPrompt = `Create a detailed photorealistic photography prompt as a single flowing paragraph with these specifications: Subject and Setting is ${promptData.subjectAndSetting}, Lighting is ${promptData.lighting}, Style is ${promptData.style}, Mood is ${promptData.mood}`;

    if (promptData['post-processing']) {
      userPrompt += `, Post-Processing is ${promptData['post-processing']}`;
    }

    if (promptData.enhancement) {
      userPrompt += `, Enhancement Codes are ${promptData.enhancement}`;
    }

    userPrompt += `. Create a cohesive, detailed prompt that produces photorealistic, human-like images with natural skin texture with visible pores and subtle imperfections, realistic lighting that shows natural shadows and highlights, authentic human expressions and genuine emotions, natural hair texture and individual strand details, realistic fabric textures and natural clothing drape, and candid, unposed feeling with authentic atmosphere. Include specific camera and lens recommendations optimized for natural human photography. Focus on creating vivid, lifelike imagery while maintaining photographic authenticity and professional quality. Avoid artificial or overly perfect descriptions and emphasize natural, realistic human features. Write everything as one continuous paragraph without any formatting symbols, headings, or bullet points.`;
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