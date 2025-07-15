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

CRITICAL OUTPUT FORMAT REQUIREMENT:
Generate your response as a single, flowing, cohesive paragraph of text. Do NOT use any markdown formatting, bold text, headings, bullet points, numbered lists, asterisks, or any special symbols. Write everything as continuous prose in a natural, descriptive narrative format.

NEGATIVE PROMPT INTEGRATION REQUIREMENT:
You must naturally integrate negative concepts throughout your prompt to guide the AI away from artificial or stylized results. Seamlessly weave in phrases that instruct the model to avoid: rendered appearance, digital art aesthetics, CGI-like features, smooth or perfect skin, artificial lighting effects, overly stylized features, plastic-like skin texture, airbrushed appearance, synthetic materials, glossy or shiny skin, cartoon-like qualities, illustration style, painting-like effects, fantasy elements, surreal characteristics, overly saturated colors, artificial enhancement, digital manipulation appearance, computer-generated look, and polished or retouched aesthetic. These should be integrated naturally as "avoid" or "not" statements within the flowing description.

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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2,
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