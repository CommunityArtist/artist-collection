import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

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
    console.log('Affogato integration function called');
    
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

    // Get Affogato AI API key from environment variables
    const affogatoApiKey = Deno.env.get('AFFOGATO_API_KEY');
    if (!affogatoApiKey) {
      console.error('Affogato API key not found in environment variables');
      throw new Error('Affogato API key not configured in system. Please contact support.');
    }

    console.log('Affogato API key found, processing request');

    // Parse request body
    const requestData = await req.json();
    const { prompt, model = 'default', width = 1024, height = 1024, numberOfImages = 1 } = requestData;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const imagesToGenerate = Math.min(numberOfImages, 4); // Limit to 4 for performance
    const imageUrls: string[] = [];
    let lastError: Error | null = null;

    console.log(`Generating ${imagesToGenerate} images with Affogato AI`);

    for (let i = 0; i < imagesToGenerate; i++) {
      try {
        console.log(`Generating image ${i + 1}/${imagesToGenerate}`);
        
        const affogatoResponse = await fetch('https://api.affogato.ai/v1/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${affogatoApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
            model: model,
            width: width,
            height: height,
          }),
        });

        if (!affogatoResponse.ok) {
          const errorData = await affogatoResponse.text();
          console.error('Affogato AI API error:', errorData);
          throw new Error(`Affogato AI API error: ${affogatoResponse.status} ${affogatoResponse.statusText}`);
        }

        const affogatoData = await affogatoResponse.json();
        
        if (affogatoData.output_url) {
          imageUrls.push(affogatoData.output_url);
          console.log(`Successfully generated image ${i + 1}`);
        } else {
          throw new Error('Affogato AI did not return an image URL.');
        }

      } catch (imageError) {
        console.error(`Error generating image ${i + 1}:`, imageError);
        lastError = imageError instanceof Error ? imageError : new Error(String(imageError));
        // Continue with other images if one fails
      }
    }

    if (imageUrls.length === 0) {
      if (lastError) {
        throw lastError;
      } else {
        throw new Error('Failed to generate any images from Affogato AI. Please try again.');
      }
    }

    console.log(`Successfully generated ${imageUrls.length} images from Affogato AI`);

    return new Response(
      JSON.stringify({
        imageUrl: imageUrls, // For backward compatibility
        imageUrls: imageUrls,
        generatedCount: imageUrls.length,
        requestedCount: numberOfImages,
        dimensions: `${width}x${height}`, // Return actual dimensions used
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in affogato-integration function:', error);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid API key')) {
        errorMessage = 'Invalid Affogato API key. Please contact support.';
      } else if (error.message.includes('quota')) {
        errorMessage = 'Affogato API quota exceeded. Please contact support.';
      } else if (error.message.includes('API key not found')) {
        errorMessage = 'Affogato API key not configured in system. Please contact support.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error occurred while connecting to Affogato AI';
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