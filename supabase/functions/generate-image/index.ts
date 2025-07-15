import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import OpenAI from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Map frontend dimension ratios to DALL-E 3 supported sizes
const mapDimensionsToSize = (dimensions: string): string => {
  switch (dimensions) {
    case '1:1':
      return '1024x1024';
    case '16:9':
      return '1792x1024';
    case '9:16':
      return '1024x1792';
    case '2:3':
    case '3:2':
    case '4:5':
    default:
      // For unsupported ratios, default to square
      return '1024x1024';
  }
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
      throw new Error('OpenAI API key not found. Please configure your API key in the settings.');
    }

    const openai = new OpenAI({
      apiKey: apiConfig.key_value,
    });

    const { prompt, imageDimensions = '1:1', numberOfImages = 1 } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Map dimensions to DALL-E 3 supported size
    const size = mapDimensionsToSize(imageDimensions);
    
    // DALL-E 3 only supports generating 1 image at a time
    // For multiple images, we'll generate them sequentially
    const imagesToGenerate = Math.min(numberOfImages, 4); // Limit to 4 for performance
    const imageUrls: string[] = [];
    let lastError: Error | null = null;

    for (let i = 0; i < imagesToGenerate; i++) {
      try {
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1, // DALL-E 3 only supports n=1
          size: size as "1024x1024" | "1792x1024" | "1024x1792",
          quality: "hd",
          style: "natural",
        });

        const imageUrl = response.data[0]?.url;
        if (imageUrl) {
          imageUrls.push(imageUrl);
        }
      } catch (imageError) {
        console.error(`Error generating image ${i + 1}:`, imageError);
        lastError = imageError instanceof Error ? imageError : new Error(String(imageError));
        // Continue with other images if one fails
      }
    }

    if (imageUrls.length === 0) {
      throw lastError || new Error('Failed to generate any images');
    }

    // Return the first image URL for backward compatibility
    // and include all URLs in the response
    return new Response(
      JSON.stringify({ 
        imageUrl: imageUrls[0],
        imageUrls: imageUrls,
        generatedCount: imageUrls.length,
        requestedCount: numberOfImages,
        dimensions: imageDimensions,
        actualSize: size
      }),
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
      } else if (error.message.includes('quota')) {
        errorMessage = 'OpenAI API quota exceeded. Please check your OpenAI account billing.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error occurred while connecting to OpenAI';
      } else if (error.message.includes('authentication')) {
        errorMessage = 'Authentication failed. Please sign in again.';
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