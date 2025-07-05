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

    const systemPrompt = `You are an expert AI art analyst, professional photographer, and prompt engineer with deep expertise in visual analysis and technical photography. Your task is to analyze images and extract comprehensive, detailed prompts that could be used to recreate similar artwork using AI image generation tools like Leonardo AI, Midjourney, or DALL-E.

CRITICAL REQUIREMENT: The MAIN PROMPT must describe the ACTUAL VISUAL CONTENT of the image in specific detail. Do not use generic artistic descriptions. Describe exactly what you see - the subjects, objects, their appearance, positioning, and the scene.

When analyzing an image, provide a detailed breakdown including:

1. MAIN PROMPT: A comprehensive, flowing description that captures the complete visual content of the image in specific detail (3-4 sentences)
   - Describe the actual subjects, objects, and scene elements visible
   - Include specific details about appearance, positioning, materials, textures
   - Mention the setting, environment, and background elements
   - Be concrete and specific, not abstract or generic

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
- Be extremely detailed and specific about all visible elements
- Describe the actual content, not just artistic qualities
- Include specific details about subjects, objects, materials, textures
- Mention exact positioning, arrangements, and spatial relationships
- Use descriptive language that would help an AI recreate the specific scene
- Focus on concrete visual elements rather than abstract concepts
- Provide professional-level technical specifications

EXAMPLE OF GOOD MAIN PROMPT:
"A hyper-realistic food photography close-up of a gourmet cheeseburger placed on a rustic wooden slab. The burger features a perfectly grilled beef patty, layers of melted cheddar cheese, fresh tomato slices, and leafy green lettuce, all stacked inside a golden sesame seed bun. A small strawberry crowns the top bun as a whimsical garnish. In the background, a softly blurred warm-toned bokeh of candlelight and diffused ambiance sets a cozy, romantic dining atmosphere."

EXAMPLE OF BAD MAIN PROMPT:
"A professional artistic composition with careful attention to visual elements, lighting, and composition."

RESPONSE FORMAT:
Respond in JSON format with these exact keys: "mainPrompt", "styleElements", "technicalDetails", "colorPalette", "composition", "lighting", "mood", "camera", "lens", "audioVibe"`;

    const userPrompt = `Analyze this image and extract a comprehensive prompt that could be used to recreate similar artwork. Be extremely detailed and specific about all visual elements you can see in the image. Describe the actual subjects, objects, scene, and their specific characteristics rather than using generic artistic terms. The goal is to create a prompt that would generate a similar-looking image when used with AI art tools.`;

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
      temperature: 0.3, // Lower temperature for more consistent, detailed analysis
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
      console.error('JSON parsing failed, using fallback:', parseError);
      // Improved fallback with more specific content
      extractedData = {
        mainPrompt: "A detailed photographic composition featuring specific subjects and elements arranged in a carefully composed scene. The image shows clear visual elements with attention to lighting, texture, and environmental context that creates a cohesive artistic statement.",
        styleElements: ["Professional photography", "Detailed composition", "High quality rendering", "Artistic execution", "Contemporary style", "Visual storytelling"],
        technicalDetails: ["Professional camera setup", "Controlled lighting", "Sharp focus", "High resolution", "Optimal exposure", "Professional color grading"],
        colorPalette: ["Balanced color scheme", "Harmonious tones", "Natural color balance", "Professional color grading"],
        composition: "Well-balanced composition following professional photography principles with careful attention to framing, subject placement, and visual hierarchy that guides the viewer's eye through the scene.",
        lighting: "Professional lighting setup with careful attention to shadows, highlights, and overall illumination quality that enhances the mood and visual impact of the composition.",
        mood: "Professional and polished atmosphere with attention to artistic and technical excellence that creates an engaging visual experience.",
        camera: "Canon EOS R5",
        lens: "85mm f/1.4",
        audioVibe: "Ambient instrumental music with subtle atmospheric tones"
      };
    }

    // Ensure all required fields exist and have proper structure
    const requiredFields = ['mainPrompt', 'styleElements', 'technicalDetails', 'colorPalette', 'composition', 'lighting', 'mood', 'camera', 'lens', 'audioVibe'];
    for (const field of requiredFields) {
      if (!extractedData[field]) {
        console.warn(`Missing field: ${field}, using fallback`);
        switch (field) {
          case 'mainPrompt':
            extractedData[field] = "A detailed photographic composition with specific visual elements and careful attention to composition and lighting.";
            break;
          case 'camera':
            extractedData[field] = "Canon EOS R5";
            break;
          case 'lens':
            extractedData[field] = "85mm f/1.4";
            break;
          case 'audioVibe':
            extractedData[field] = "Ambient instrumental music with subtle atmospheric tones";
            break;
          default:
            extractedData[field] = field.includes('Elements') || field.includes('Details') || field.includes('Palette') ? 
              ["Professional quality", "Detailed execution", "High resolution", "Artistic composition"] :
              "Professional composition with attention to detail and artistic excellence.";
        }
      }
    }

    // Ensure arrays have proper structure
    if (!Array.isArray(extractedData.styleElements)) {
      extractedData.styleElements = ["Professional photography", "Artistic composition", "High quality rendering", "Detailed execution", "Contemporary style", "Visual storytelling"];
    }
    if (!Array.isArray(extractedData.technicalDetails)) {
      extractedData.technicalDetails = ["Professional camera setup", "Controlled lighting", "Sharp focus", "High resolution", "Optimal exposure", "Professional color grading"];
    }
    if (!Array.isArray(extractedData.colorPalette)) {
      extractedData.colorPalette = ["Balanced color scheme", "Harmonious tones", "Natural color balance", "Professional color grading"];
    }

    // Ensure arrays have the right number of elements
    if (extractedData.styleElements.length < 4) {
      extractedData.styleElements.push(...["Professional quality", "Artistic execution", "Visual storytelling", "Contemporary style"].slice(0, 6 - extractedData.styleElements.length));
    }
    if (extractedData.technicalDetails.length < 4) {
      extractedData.technicalDetails.push(...["High resolution", "Professional setup", "Optimal settings", "Quality execution"].slice(0, 6 - extractedData.technicalDetails.length));
    }
    if (extractedData.colorPalette.length < 3) {
      extractedData.colorPalette.push(...["Natural tones", "Balanced colors", "Professional grading"].slice(0, 6 - extractedData.colorPalette.length));
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