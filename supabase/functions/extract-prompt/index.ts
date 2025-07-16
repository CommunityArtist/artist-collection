import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import OpenAI from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '3600',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    console.log('Extract-prompt function called');
    
    // Check user authentication and API access
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
      throw new Error('OpenAI API key not configured. Please contact support.');
    }
    
    const openai = new OpenAI({
      apiKey: openaiApiKey,
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

    const systemPrompt = `You are an expert AI art analyst, professional photographer, and prompt engineer with deep expertise in visual analysis and technical photography. Your task is to describe images and provide comprehensive, detailed prompts that could be used to recreate similar artwork using AI image generation tools like Leonardo AI, Midjourney, or DALL-E.

CRITICAL REQUIREMENT: The MAIN PROMPT must describe the ACTUAL VISUAL CONTENT of the image in specific detail. Do not use generic artistic descriptions. Describe exactly what you see - the subjects, objects, their appearance, positioning, and the scene.

When analyzing an image, provide a detailed breakdown including:

1. MAIN PROMPT: A comprehensive, flowing description that captures the complete visual content of the image in specific detail (3-4 sentences minimum)
   - Describe the actual subjects, objects, and scene elements visible
   - Include specific details about appearance, positioning, materials, textures
   - Mention the setting, environment, and background elements
   - Be concrete and specific, not abstract or generic
   - Include specific details like clothing, accessories, facial features, poses
   - Describe the exact arrangement and composition of elements
   - Mention specific colors, materials, and textures you can see

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
- If it's food, describe the specific ingredients, preparation, plating
- If it's a person, describe clothing, pose, expression, setting in detail
- If it's architecture, describe materials, style, lighting, perspective
- If it's nature, describe specific elements, weather, time of day

RESPONSE FORMAT:
Respond in JSON format with these exact keys: "mainPrompt", "styleElements", "technicalDetails", "colorPalette", "composition", "lighting", "mood", "camera", "lens", "audioVibe"`;

    const userPrompt = `Analyze this image and extract a comprehensive prompt that could be used to recreate similar artwork. Be extremely detailed and specific about all visual elements you can see in the image. Describe the actual subjects, objects, scene, and their specific characteristics rather than using generic artistic terms. 

Focus on:
- What exactly is in the image (people, objects, food, architecture, etc.)
- Specific details about appearance, materials, textures, colors
- Exact positioning and arrangement of elements
- Setting and environment details
- Specific clothing, accessories, or decorative elements
- Precise descriptions that would help an AI recreate this exact scene

The goal is to create a prompt that would generate a very similar-looking image when used with AI art tools.`;

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
      temperature: 0.2, // Very low temperature for consistent, detailed analysis
      max_tokens: 2500,
    });

    console.log('OpenAI response received');
    
    const response = completion.choices[0]?.message?.content?.trim();

    if (!response) {
      throw new Error('OpenAI API returned an empty response');
    }

    let extractedData;
    try {
      console.log('Parsing OpenAI response:', response);
      
      // Extract JSON from response, handling markdown code blocks and other formatting
      let jsonString = response.trim();
      
      // Check if response is wrapped in markdown code block
      const jsonBlockMatch = jsonString.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonBlockMatch) {
        jsonString = jsonBlockMatch[1].trim();
      } else {
        // Check if there's JSON content between other text
        const jsonMatch = jsonString.match(/(\{[\s\S]*\})/);
        if (jsonMatch) {
          jsonString = jsonMatch[1].trim();
        }
      }
      
      extractedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.error('Original response:', response);
      throw new Error('Failed to parse AI response. The AI returned invalid data. Please try again.');
    }

    // Ensure all required fields exist and have proper structure
    const requiredFields = ['mainPrompt', 'styleElements', 'technicalDetails', 'colorPalette', 'composition', 'lighting', 'mood', 'camera', 'lens', 'audioVibe'];
    for (const field of requiredFields) {
      if (!extractedData[field]) {
        throw new Error(`AI response is missing required field: ${field}. Please try again.`);
      }
    }

    // Validate array fields have proper structure
    const arrayFields = ['styleElements', 'technicalDetails', 'colorPalette'];
    for (const field of arrayFields) {
      if (!Array.isArray(extractedData[field]) || extractedData[field].length === 0) {
        throw new Error(`AI response has invalid ${field} format. Please try again.`);
      }
    }

    // Validate string fields are not empty
    const stringFields = ['mainPrompt', 'composition', 'lighting', 'mood', 'camera', 'lens', 'audioVibe'];
    for (const field of stringFields) {
      if (typeof extractedData[field] !== 'string' || extractedData[field].trim().length === 0) {
        throw new Error(`AI response has invalid ${field} format. Please try again.`);
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
      } else if (error.message.includes('Failed to parse AI response') || error.message.includes('AI response')) {
        errorMessage = error.message; // Use the specific parsing error message
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