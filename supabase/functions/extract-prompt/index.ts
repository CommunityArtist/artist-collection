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

    const systemPrompt = `You are an expert AI art analyst, professional photographer, and prompt engineer with deep expertise in visual analysis and technical photography. Your task is to analyze images and extract comprehensive, detailed prompts that could be used to recreate similar artwork using AI image generation tools.

When analyzing an image, provide a detailed breakdown including:

1. MAIN PROMPT: A comprehensive, flowing description that captures the complete essence of the image in natural language (2-3 sentences)

2. STYLE ELEMENTS: Artistic style, aesthetic choices, and visual approach (provide exactly 5-6 specific style descriptors as an array)

3. TECHNICAL DETAILS: Camera settings, lens information, lighting setup, and technical specifications (provide exactly 5-6 specific technical items as an array)

4. COLOR PALETTE: Dominant colors, color schemes, and color relationships (provide exactly 4-6 specific color descriptions as an array)

5. COMPOSITION: Layout, framing, rule of thirds, focal points, and visual balance (single detailed paragraph)

6. LIGHTING: Light sources, direction, quality, mood, and shadows (single detailed paragraph)

7. MOOD: Emotional tone, feeling, and overall atmosphere (single detailed paragraph)

8. CAMERA: Specific camera model recommendation that would best capture this type of shot (single camera model)

9. LENS: Specific lens recommendation with focal length and aperture (single lens specification)

10. AUDIO VIBE: Suggested audio atmosphere that would complement the visual mood (single descriptive phrase)

ANALYSIS GUIDELINES:
- Be extremely detailed and specific about all visual elements
- Include technical photography terms and artistic styles
- Focus on elements that are actually visible in the image
- Provide professional-level technical specifications
- Consider the mood and atmosphere for audio suggestions
- Use descriptive language that would help an AI understand exactly what to create

RESPONSE FORMAT:
Respond in JSON format with these exact keys: "mainPrompt", "styleElements", "technicalDetails", "colorPalette", "composition", "lighting", "mood", "camera", "lens", "audioVibe"

EXAMPLE STRUCTURE:
{
  "mainPrompt": "A hyper-realistic food photography close-up of a gourmet cheeseburger...",
  "styleElements": ["Hyper-realistic food photography", "Commercial advertising style", "Professional product shot", "Gourmet presentation", "Restaurant quality styling"],
  "technicalDetails": ["Macro lens photography", "f/8 aperture for sharp focus", "Controlled studio lighting", "Focus stacking technique", "High-resolution capture"],
  "colorPalette": ["Golden brown sesame bun", "Rich red tomato", "Fresh green lettuce", "Warm amber lighting", "Deep teal wood tones"],
  "composition": "The composition follows classic food photography principles...",
  "lighting": "Soft diffused tungsten lighting creates warm, inviting tones...",
  "mood": "The overall mood is cozy and appetizing...",
  "camera": "Canon EOS R5",
  "lens": "RF 50mm f/1.2L",
  "audioVibe": "Lo-fi jazz with soft crackling ambiance – like a cozy evening bistro"
}`;

    const userPrompt = `Analyze this image and extract a comprehensive prompt that could be used to recreate similar artwork. Be extremely detailed and specific about all visual elements, technical aspects, and artistic choices you observe. Include professional camera and lens recommendations, and suggest an audio vibe that would complement the visual atmosphere.`;

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
      max_tokens: 2000,
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
        mainPrompt: "A professional artistic composition with careful attention to visual elements, lighting, and composition. The image demonstrates high-quality execution with detailed focus on subject matter and environmental context.",
        styleElements: ["Professional photography", "Artistic composition", "High quality rendering", "Detailed execution", "Contemporary style"],
        technicalDetails: ["Professional camera setup", "Optimal lighting", "Sharp focus", "High resolution", "Controlled exposure"],
        colorPalette: ["Balanced color scheme", "Harmonious tones", "Professional color grading", "Natural color balance"],
        composition: "Well-balanced composition following professional photography principles with careful attention to framing and visual hierarchy.",
        lighting: "Professional lighting setup with careful attention to shadows, highlights, and overall illumination quality.",
        mood: "Professional and polished atmosphere with attention to artistic and technical excellence.",
        camera: "Canon EOS R5",
        lens: "85mm f/1.4",
        audioVibe: "Ambient instrumental music with subtle atmospheric tones"
      };
    }

    // Ensure all required fields exist
    const requiredFields = ['mainPrompt', 'styleElements', 'technicalDetails', 'colorPalette', 'composition', 'lighting', 'mood', 'camera', 'lens', 'audioVibe'];
    for (const field of requiredFields) {
      if (!extractedData[field]) {
        throw new Error(`Generated response is missing required field: ${field}`);
      }
    }

    // Ensure arrays have proper structure
    if (!Array.isArray(extractedData.styleElements)) {
      extractedData.styleElements = ["Professional photography", "Artistic composition", "High quality rendering", "Detailed execution"];
    }
    if (!Array.isArray(extractedData.technicalDetails)) {
      extractedData.technicalDetails = ["Professional camera setup", "Optimal lighting", "Sharp focus", "High resolution"];
    }
    if (!Array.isArray(extractedData.colorPalette)) {
      extractedData.colorPalette = ["Balanced color scheme", "Harmonious tones", "Professional color grading", "Natural color balance"];
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