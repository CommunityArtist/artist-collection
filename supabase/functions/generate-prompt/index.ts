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

CRITICAL OUTPUT FORMAT REQUIREMENT:
You must respond with a valid JSON object containing exactly two keys: "prompt" and "negativePrompt". Do not include any other text, markdown formatting, or explanations outside of this JSON structure.

POSITIVE PROMPT REQUIREMENTS:
The "prompt" key should contain a single, flowing, cohesive paragraph describing the desired visual elements. Focus purely on what you WANT to see in the image. Include detailed descriptions of subject, setting, lighting, mood, technical specifications, and photorealistic qualities. Write as continuous prose without any formatting symbols.

NEGATIVE PROMPT REQUIREMENTS:
The "negativePrompt" key should contain a comprehensive list of concepts to avoid, formatted as a flowing sentence with comma-separated terms. Include concepts like: rendered appearance, digital art aesthetics, CGI-like features, smooth or perfect skin, artificial lighting effects, overly stylized features, plastic-like skin texture, airbrushed appearance, synthetic materials, glossy or shiny skin, cartoon-like qualities, illustration style, painting-like effects, fantasy elements, surreal characteristics, overly saturated colors, artificial enhancement, digital manipulation appearance, computer-generated look, polished or retouched aesthetic, fake appearance, synthetic look, overly processed, artificial perfection, digital artifacts, unrealistic proportions, and stylized rendering.

REALISM REQUIREMENTS FOR HUMAN SUBJECTS:
Always emphasize photorealistic and natural human features. Include specific details about natural skin texture with visible pores and subtle imperfections. Mention realistic lighting that shows natural shadows and highlights on skin. Focus on authentic human expressions and natural poses. Include environmental details that enhance realism. Describe natural skin texture, authentic expressions, realistic hair details, natural lighting effects, and environmental realism.

Your prompts should comprehensively include subject description with enhanced realism featuring detailed physical attributes with natural imperfections, authentic pose and genuine expression, realistic clothing with natural fabric textures, and natural skin texture with realistic features. Include environment and setting with location details and realistic lighting, time of day with natural atmospheric conditions, and authentic environmental elements. Add technical photography specifications with camera recommendations from Canon EOS R5, Sony A7R IV, Nikon Z9, or Hasselblad X2D, lens selection with specific focal lengths and apertures for natural perspective, professional lighting setup that enhances natural features, and camera settings optimized for realistic skin tones including ISO and color temperature. Include artistic elements focused on realism with photorealistic style and natural color grading, authentic mood and atmosphere, natural color palette that enhances skin tones, minimal post-processing for natural appearance, and composition that feels candid and authentic.

REALISM KEYWORDS TO NATURALLY INTEGRATE:
Seamlessly weave these terms throughout your response: photorealistic, natural skin texture, realistic lighting, authentic, genuine, detailed pores, natural imperfections, lifelike, candid, unretouched quality.

RAW PHOTOGRAPHY EMPHASIS:
Emphasize raw, unprocessed photographic qualities by including terms like: unretouched skin, natural blemishes, realistic skin variations, authentic lighting imperfections, natural shadows and highlights, candid moment capture, documentary-style realism, street photography authenticity, natural environmental lighting, and unposed genuine expressions. Avoid any mention of perfection or idealization.

When enhancement codes are provided, integrate them naturally into the flowing text while maintaining focus on photorealism and natural human features.

Write your response as one continuous, descriptive paragraph that reads naturally while incorporating all technical details, enhancements, and realism requirements without any formatting symbols or structure markers.`;

    let userPrompt = `Create a detailed photorealistic photography prompt as a single flowing paragraph with these specifications: Subject is ${promptData.subject}, Lighting is ${promptData.lighting}, Style is ${promptData.style}, Mood is ${promptData.mood}, Setting is ${promptData.setting}`;

    if (promptData['post-processing']) {
      userPrompt += `, Post-Processing is ${promptData['post-processing']}`;
    }

    if (promptData.enhancement) {
      userPrompt += `, Enhancement Codes are ${promptData.enhancement}`;
    }

    userPrompt += `. Create a cohesive, detailed prompt that produces photorealistic, human-like images with natural skin texture with visible pores and subtle imperfections, realistic lighting that shows natural shadows and highlights, authentic human expressions and genuine emotions, natural hair texture and individual strand details, realistic fabric textures and natural clothing drape, and candid, unposed feeling with authentic atmosphere. Include specific camera and lens recommendations optimized for natural human photography. Focus on creating vivid, lifelike imagery while maintaining photographic authenticity and professional quality. Avoid artificial or overly perfect descriptions and emphasize natural, realistic human features. Write everything as one continuous paragraph without any formatting symbols, headings, or bullet points.`;

    console.log('Calling OpenAI API to generate prompt');

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 600,
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