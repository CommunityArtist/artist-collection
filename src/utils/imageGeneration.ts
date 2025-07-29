// Image generation utilities for Supabase Edge Functions
import { supabase } from '../lib/supabase';

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
export async function generateImagesWithFallback(
  params: ImageGenerationParams, 
  provider: 'openai' | 'nebius' | 'rendernet' = 'openai'
): Promise<ImageGenerationResult> {
  const { prompt, dimensions, numberOfImages } = params;
  
  try {
    console.log('Starting image generation with fallback:', { 
      prompt: prompt.substring(0, 50) + '...', 
      dimensions, 
      numberOfImages,
      provider 
    });
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL environment variable is not configured');
    }
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Authentication required. Please sign in to generate images.');
    }
    
    // Construct the Edge Function URL based on provider
    let edgeFunctionUrl: string;
    let requestBody: any;
    
    switch (provider) {
      case 'nebius':
        edgeFunctionUrl = `${supabaseUrl}/functions/v1/nebius-ai-integration`;
        requestBody = {
          prompt: prompt,
          imageDimensions: dimensions,
          numberOfImages: numberOfImages,
          model: 'yandexart/latest'
        };
        break;
      case 'rendernet':
        edgeFunctionUrl = `${supabaseUrl}/functions/v1/affogato-integration`;
        requestBody = {
          prompt: prompt,
          dimensions: dimensions,
          numberOfImages: numberOfImages
        };
        break;
      default: // openai
        edgeFunctionUrl = `${supabaseUrl}/functions/v1/generate-image`;
        requestBody = {
          prompt: prompt,
          imageDimensions: dimensions,
          numberOfImages: numberOfImages,
          style: 'natural'
        };
    }
    
    console.log('Calling Edge Function at:', edgeFunctionUrl);
    
    // Call the Supabase Edge Function
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
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
      provider: `supabase-${provider}`,
    };
    
  } catch (error) {
    console.error('Error in generateImagesWithFallback:', error);
    
    const errorMessage = getImageGenerationErrorMessage(error, `supabase-${provider}`);
    
    return {
      success: false,
      error: errorMessage,
      provider: `supabase-${provider}`,
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