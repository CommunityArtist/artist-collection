import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import OpenAI from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '3600',
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
    return new Response('ok', { 
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

    console.log(`Generating ${imagesToGenerate} images with DALL-E 3`);

    for (let i = 0; i < imagesToGenerate; i++) {
      try {
        console.log(`Generating image ${i + 1}/${imagesToGenerate}`);
        
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
          console.log(`Successfully generated image ${i + 1}`);
        }
      } catch (imageError) {
        console.error(`Error generating image ${i + 1}:`, imageError);
        lastError = imageError instanceof Error ? imageError : new Error(String(imageError));
        
        // If it's a content filter error, stop trying to generate more images
        if (imageError instanceof Error && imageError.message.includes('content filters')) {
          break;
        }
        // Continue with other images if one fails
      }
    }

    if (imageUrls.length === 0) {
      // Provide more specific error information
      if (lastError) {
        throw lastError;
      } else {
        throw new Error('Failed to generate any images. Please try again.');
      }
    }

    console.log(`Successfully generated ${imageUrls.length} images`);

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
    console.error('Error in generate-image function:', error);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error instanceof Error) {
      if (error.message.includes('Incorrect API key')) {
        errorMessage = 'Invalid OpenAI API key. Please contact support.';
      } else if (error.message.includes('content filters')) {
        errorMessage = 'Your prompt was blocked by OpenAI\'s content filters. Please modify your prompt to comply with OpenAI\'s usage policies and avoid content that may be considered inappropriate, violent, sexual, or hateful.';
      } else if (error.message.includes('You exceeded your current quota')) {
        errorMessage = 'OpenAI API quota exceeded. Please contact support.';
      } else if (error.message.includes('API key not found')) {
        errorMessage = 'OpenAI API key not configured in system. Please contact support.';
      } else if (error.message.includes('insufficient_quota')) {
        errorMessage = 'Insufficient OpenAI credits. Please contact support.';
      } else if (error.message.includes('invalid_api_key')) {
        errorMessage = 'Invalid OpenAI API key. Please contact support.';
      } else if (error.message.includes('quota')) {
        errorMessage = 'OpenAI API quota exceeded. Please contact support.';
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