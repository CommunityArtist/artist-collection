// Image generation utilities and fallbacks
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

// Fallback image generation using a mock service or placeholder
export async function generateImagesWithFallback(params: ImageGenerationParams): Promise<ImageGenerationResult> {
  const { prompt, dimensions, numberOfImages } = params;
  
  // For demonstration purposes, create placeholder images with different colors
  const placeholderImages = generatePlaceholderImages(numberOfImages, dimensions, prompt);
  
  return {
    success: true,
    imageUrls: placeholderImages,
    provider: 'openai (fallback mode)',
  };
}

function generatePlaceholderImages(count: number, dimensions: string, prompt: string): string[] {
  const colors = ['6366f1', '8b5cf6', 'ec4899', 'ef4444', 'f97316', '10b981'];
  const images: string[] = [];
  
  // Convert dimensions to pixel values
  const [width, height] = getDimensionsFromRatio(dimensions);
  
  for (let i = 0; i < count; i++) {
    const color = colors[i % colors.length];
    const shortPrompt = `AI+Art+${i + 1}`;
    const placeholderUrl = `https://via.placeholder.com/${width}x${height}/${color}/ffffff?text=${shortPrompt}`;
    images.push(placeholderUrl);
  }
  
  return images;
}

function getDimensionsFromRatio(ratio: string): [number, number] {
  switch (ratio) {
    case '1:1':
      return [512, 512];
    case '16:9':
      return [896, 512];
    case '9:16':
      return [512, 896];
    case '2:3':
      return [512, 768];
    case '3:2':
      return [768, 512];
    case '4:5':
      return [512, 640];
    default:
      return [512, 512];
  }
}

// Function to test if Edge Functions are available
export async function testEdgeFunctionAvailability(supabaseUrl: string, functionName: string, timeout: number = 3000): Promise<boolean> {
  try {
    // Validate supabaseUrl before making the request
    if (!supabaseUrl || typeof supabaseUrl !== 'string' || !supabaseUrl.startsWith('http')) {
      console.warn(`❌ Invalid Supabase URL for ${functionName}:`, supabaseUrl);
      return false;
    }
    
    // Ensure it's a proper Supabase URL
    if (!supabaseUrl.includes('supabase.co')) {
      console.warn(`❌ URL does not appear to be a Supabase URL for ${functionName}:`, supabaseUrl);
      return false;
    }
    
    // Get the current user session for authenticated requests
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log(`⚠️ No user session available for ${functionName}, skipping authentication test`);
      return false;
    }
    
    // Ensure we're using the correct Supabase Edge Function URL format
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/${functionName}`;
    console.log(`🔍 Testing Edge Function at:`, {
      functionName,
      url: edgeFunctionUrl,
      baseUrl: supabaseUrl
    });
    
    // Additional safety check for network connectivity
    if (typeof window !== 'undefined' && !navigator.onLine) {
      console.warn(`❌ No network connection available for ${functionName}`);
      return false;
    }
    
    // Use AbortController to timeout the request quickly
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
    
    console.log(`🔍 Testing ${functionName}:`, {
      url: edgeFunctionUrl,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    // More permissive detection - function exists if we get any HTTP response
    // Even 500 errors mean the function exists but may have runtime issues
    const exists = response.status >= 200;
    console.log(`📊 ${functionName} detection result:`, exists);
    return exists;
  } catch (error) {
    // Handle specific network errors more gracefully
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.log(`🔄 Network error for ${functionName}: ${error.message}. URL attempted: ${supabaseUrl}/functions/v1/${functionName}`);
      return false;
    }
    
    // Handle AbortController timeout
    if (error instanceof Error && error.name === 'AbortError') {
      console.log(`⏱️ Request timeout for ${functionName}, falling back to local generation`);
      return false;
    }
    
    console.warn(`❌ Unexpected error testing ${functionName}:`, error);
    return false;
  }
}

// Cached result to avoid repeated checks
let edgeFunctionCache: { [key: string]: { available: boolean; timestamp: number } } = {};
const CACHE_DURATION = 30 * 1000; // 30 seconds for faster detection of newly deployed functions

export async function testEdgeFunctionAvailabilityCached(supabaseUrl: string, functionName: string, timeout: number = 5000): Promise<boolean> {
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
  
  // Log successful detection (but not failures to avoid spam)
  if (available) {
    console.log(`✅ Edge Functions detected and available: ${functionName}`);
  }
  
  return available;
}

// Force refresh cache (useful after deployment)
export function clearEdgeFunctionCache() {
  edgeFunctionCache = {};
  console.log('🔄 Edge Function detection cache cleared');
}

// Enhanced error messages for different scenarios
export function getImageGenerationErrorMessage(error: unknown, provider: string): string {
  if (error instanceof Error) {
    if (error.message.includes('Failed to fetch')) {
      return 'Unable to connect to OpenAI. Using fallback image generation. Please deploy Edge Functions for full functionality.';
    } else if (error.message.includes('CORS')) {
      return 'CORS error with OpenAI. Edge Functions may not be properly deployed.';
    } else if (error.message.includes('quota')) {
      return 'OpenAI API quota exceeded. Please check your account billing.';
    } else if (error.message.includes('content filters')) {
      return 'Prompt was blocked by content filters. Please modify your prompt to comply with usage policies.';
    } else {
      return error.message;
    }
  }
  return 'Unknown error occurred with OpenAI';
}