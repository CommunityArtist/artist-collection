// Image generation utilities for Supabase Edge Functions
import { supabase } from '../lib/supabase';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import OpenAI from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '3600'
};

async function getOpenAIKey() {
  // First try environment variable (preferred for production)
  let apiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (apiKey && apiKey !== 'sk-REPLACE_WITH_YOUR_ACTUAL_OPENAI_API_KEY_FROM_PLATFORM_OPENAI_COM') {
    console.log('Using OpenAI API key from environment variable');
    return apiKey;
  }
  
  // Fallback: try to get from database
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Try to get a global API key from database
      const { data, error } = await supabase
        .from('api_config')
        .select('key_value')
        .eq('key_name', 'openai_api_key')
        .is('user_id', null) // Global key
        .single();
      
      if (!error && data?.key_value && data.key_value.startsWith('sk-')) {
        console.log('Using OpenAI API key from database (global)');
        return data.key_value;
      }
    }
  } catch (error) {
    console.error('Error fetching API key from database:', error);
  }
  
  // If no key found, throw descriptive error
  throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your Supabase Edge Functions environment variables.');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    console.log('=== DALL-E 3 Image Generation Started ===');
    
    // Get OpenAI API key with fallback logic
    const openaiApiKey = await getOpenAIKey();
    
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    const { 
      prompt, 
      imageDimensions = '1:1', 
      numberOfImages = 1,
      style = 'natural'
    } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Generating images:', {
      prompt: prompt.substring(0, 100) + '...',
      dimensions: imageDimensions,
      count: numberOfImages,
      style: style
    });

    // Convert aspect ratio to DALL-E 3 format
    let dalleSize = '1024x1024'; // default square
    if (imageDimensions === '16:9') dalleSize = '1792x1024';
    else if (imageDimensions === '9:16') dalleSize = '1024x1792';
    else if (imageDimensions === '4:3') dalleSize = '1024x1024'; // closest to square
    else if (imageDimensions === '3:4') dalleSize = '1024x1024'; // closest to square

    const imageUrls: string[] = [];
    
    // Generate images (DALL-E 3 only supports 1 image per request)
    for (let i = 0; i < Math.min(numberOfImages, 4); i++) {
      try {
        console.log(`Generating image ${i + 1}/${numberOfImages}`);
        
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: dalleSize as "1024x1024" | "1792x1024" | "1024x1792",
          quality: "standard",
          style: style === 'vivid' ? 'vivid' : 'natural',
        });

        if (response.data && response.data.length > 0 && response.data[0].url) {
          imageUrls.push(response.data[0].url);
          console.log(`Successfully generated image ${i + 1}`);
        } else {
          console.error(`No image URL in response for image ${i + 1}`);
        }
      } catch (imageError) {
        console.error(`Error generating image ${i + 1}:`, imageError);
        // Continue with other images
      }
    }

    if (imageUrls.length === 0) {
      throw new Error('Failed to generate any images');
    }

    console.log(`Successfully generated ${imageUrls.length} images`);

    return new Response(
      JSON.stringify({
        imageUrl: imageUrls, // For backward compatibility
        imageUrls: imageUrls,
        generatedCount: imageUrls.length,
        requestedCount: numberOfImages,
        dimensions: dalleSize,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-image function:', error);
    
    let errorMessage = 'Failed to generate image';
    
    if (error instanceof Error) {
      if (error.message.includes('Incorrect API key')) {
        errorMessage = 'Invalid OpenAI API key. Please check your API key configuration.';
      } else if (error.message.includes('You exceeded your current quota')) {
        errorMessage = 'OpenAI API quota exceeded. Please check your OpenAI account billing and usage limits.';
      } else if (error.message.includes('content filters') || error.message.includes('safety system')) {
        errorMessage = 'Your prompt was blocked by content filters. Please modify your prompt and try again.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (error.message.includes('API key not configured')) {
        errorMessage = 'OpenAI API key not configured. Please contact support to set up the API key.';
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

export interface ImageGenerationParams {
  prompt: string;
  dimensions: string;
  numberOfImages: number;
}

export interface ImageGenerationResult {
  success: boolean;
  imageUrls?: string[];
  error?: string;
  provider: string;
}

/**
 * Test if a Supabase Edge Function is available and accessible
 */
export async function testEdgeFunctionAvailability(
  supabaseUrl: string, 
  functionName: string, 
  timeout: number = 5000
): Promise<boolean> {
  try {
    // Validate supabaseUrl
    if (!supabaseUrl || typeof supabaseUrl !== 'string' || !supabaseUrl.startsWith('http')) {
      console.error('Invalid Supabase URL provided:', supabaseUrl);
      return false;
    }
    
    // Ensure it's a proper Supabase URL
    if (!supabaseUrl.includes('supabase.co')) {
      console.error('URL does not appear to be a Supabase URL:', supabaseUrl);
      return false;
    }
    
    // Get the current user session for authenticated requests
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('No active session found for Edge Function test');
      return false;
    }
    
    // Construct the correct Supabase Edge Function URL
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/${functionName}`;
    console.log('Testing Edge Function at:', edgeFunctionUrl);
    
    // Use AbortController to timeout the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ test: true }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Function exists if we get any HTTP response (even errors)
    const exists = response.status >= 200;
    console.log(`Edge Function ${functionName} test result:`, response.status, exists);
    return exists;
    
  } catch (error) {
    // Handle specific network errors
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('Network error - Edge Function may not be deployed:', error.message);
      return false;
    }
    
    // Handle AbortController timeout
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Edge Function test timed out after', timeout, 'ms');
      return false;
    }
    
    console.error('Edge Function test failed:', error);
    return false;
  }
}

/**
 * Generate images using Supabase Edge Function
 */
export async function generateImagesWithFallback(params: ImageGenerationParams): Promise<ImageGenerationResult> {
  const { prompt, dimensions, numberOfImages } = params;
  
  try {
    console.log('Starting image generation with fallback:', { prompt: prompt.substring(0, 50) + '...', dimensions, numberOfImages });
    
    // Validate required environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL environment variable is not configured');
    }
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('No active session found for image generation');
      throw new Error('Authentication required. Please sign in to generate images.');
    }
    
    console.log('User session found:', session.user?.email);
    
    // Construct the Edge Function URL
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/generate-image`;
    console.log('Calling Edge Function at:', edgeFunctionUrl);
    
    // Call the Supabase Edge Function
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        prompt: prompt,
        imageDimensions: dimensions,
        numberOfImages: numberOfImages,
        style: 'natural' // Default to natural style
      }),
    });
    
    console.log('Edge Function response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Edge Function error response:', errorData);
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorData);
        errorMessage = errorJson.error || errorMessage;
      } catch {
        // Use the raw text if JSON parsing fails
        errorMessage = errorData || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('Edge Function response:', data);
    
    // Handle different response formats
    let imageUrls: string[] = [];
    
    if (data.imageUrls && Array.isArray(data.imageUrls)) {
      imageUrls = data.imageUrls;
    } else if (data.imageUrl) {
      imageUrls = Array.isArray(data.imageUrl) ? data.imageUrl : [data.imageUrl];
    } else if (data.images && Array.isArray(data.images)) {
      imageUrls = data.images;
    } else {
      throw new Error('No valid image URLs returned from the API');
    }
    
    if (imageUrls.length === 0) {
      throw new Error('No images were generated');
    }
    
    return {
      success: true,
      imageUrls: imageUrls,
      provider: 'supabase-edge-function',
    };
    
  } catch (error) {
    console.error('Error in generateImagesWithFallback:', error);
    
    const errorMessage = getImageGenerationErrorMessage(error, 'supabase-edge-function');
    
    return {
      success: false,
      error: errorMessage,
      provider: 'supabase-edge-function',
    };
  }
}

// Cached result to avoid repeated checks
let edgeFunctionCache: { [key: string]: { available: boolean; timestamp: number } } = {};
const CACHE_DURATION = 30 * 1000; // 30 seconds

export async function testEdgeFunctionAvailabilityCached(
  supabaseUrl: string, 
  functionName: string, 
  timeout: number = 5000
): Promise<boolean> {
  const cacheKey = `${supabaseUrl}/${functionName}`;
  const now = Date.now();
  
  // Check cache first
  if (edgeFunctionCache[cacheKey] && (now - edgeFunctionCache[cacheKey].timestamp < CACHE_DURATION)) {
    return edgeFunctionCache[cacheKey].available;
  }
  
  // Test availability
  const available = await testEdgeFunctionAvailability(supabaseUrl, functionName, timeout);
  
  // Cache result
  edgeFunctionCache[cacheKey] = {
    available,
    timestamp: now
  };
  
  return available;
}

// Force refresh cache (useful after deployment)
export function clearEdgeFunctionCache() {
  edgeFunctionCache = {};
}

/**
 * Get user-friendly error messages for different scenarios
 */
export function getImageGenerationErrorMessage(error: unknown, provider: string): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network and connectivity errors
    if (message.includes('failed to fetch') || message.includes('network error')) {
      return 'Unable to connect to the image generation service. Please check your internet connection and try again.';
    }
    
    // CORS errors
    if (message.includes('cors')) {
      return 'Cross-origin request blocked. The image generation service may not be properly configured.';
    }
    
    // Authentication errors
    if (message.includes('authentication') || message.includes('unauthorized') || message.includes('401')) {
      return 'Authentication failed. Please sign in again and try generating images.';
    }
    
    // OpenAI API specific errors
    if (message.includes('incorrect api key') || message.includes('invalid api key')) {
      return 'Invalid OpenAI API key. Please contact support to configure the API key.';
    }
    
    if (message.includes('quota') || message.includes('insufficient_quota')) {
      return 'OpenAI API quota exceeded. Please contact support or try again later.';
    }
    
    if (message.includes('content filters') || message.includes('safety system')) {
      return 'Your prompt was blocked by content filters. Please modify your prompt to comply with usage policies.';
    }
    
    if (message.includes('rate limit')) {
      return 'Rate limit exceeded. Please wait a moment and try again.';
    }
    
    // Configuration errors
    if (message.includes('environment variable') || message.includes('not configured')) {
      return 'Image generation service is not properly configured. Please contact support.';
    }
    
    // Supabase specific errors
    if (message.includes('supabase')) {
      return 'Database service error. Please try again or contact support if the problem persists.';
    }
    
    // Generic HTTP errors
    if (message.includes('http 500')) {
      return 'Internal server error. Please try again or contact support if the problem persists.';
    }
    
    if (message.includes('http 404')) {
      return 'Image generation service not found. Please contact support.';
    }
    
    if (message.includes('http 429')) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    
    // Return the original error message for specific known errors
    if (message.includes('no valid image urls') || 
        message.includes('no images were generated') ||
        message.includes('prompt was blocked')) {
      return error.message;
    }
    
    // Generic fallback
    return `Image generation failed: ${error.message}`;
  }
  
  return 'An unexpected error occurred during image generation. Please try again.';
}

/**
 * Utility function to validate Supabase configuration
 */
export function validateSupabaseConfig(): { valid: boolean; error?: string } {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl) {
    return { valid: false, error: 'VITE_SUPABASE_URL environment variable is missing' };
  }
  
  if (!supabaseAnonKey) {
    return { valid: false, error: 'VITE_SUPABASE_ANON_KEY environment variable is missing' };
  }
  
  if (!supabaseUrl.includes('supabase.co')) {
    return { valid: false, error: 'VITE_SUPABASE_URL does not appear to be a valid Supabase URL' };
  }
  
  return { valid: true };
}