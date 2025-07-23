// Image generation utilities and fallbacks

export interface ImageGenerationParams {
  prompt: string;
  dimensions: string;
  numberOfImages: number;
  provider: 'openai' | 'affogato';
}

export interface ImageGenerationResult {
  success: boolean;
  imageUrls?: string[];
  error?: string;
  provider: string;
}

// Fallback image generation using a mock service or placeholder
export async function generateImagesWithFallback(params: ImageGenerationParams): Promise<ImageGenerationResult> {
  const { prompt, dimensions, numberOfImages, provider } = params;
  
  // For demonstration purposes, create placeholder images with different colors
  const placeholderImages = generatePlaceholderImages(numberOfImages, dimensions, prompt);
  
  return {
    success: true,
    imageUrls: placeholderImages,
    provider: `${provider} (fallback mode)`,
  };
}

function generatePlaceholderImages(count: number, dimensions: string, prompt: string): string[] {
  const colors = ['4F46E5', '7C3AED', 'DB2777', 'DC2626', 'EA580C', '059669'];
  const images: string[] = [];
  
  // Convert dimensions to pixel values
  const [width, height] = getDimensionsFromRatio(dimensions);
  
  for (let i = 0; i < count; i++) {
    const color = colors[i % colors.length];
    const encodedPrompt = encodeURIComponent(prompt.substring(0, 50));
    const placeholderUrl = `https://via.placeholder.com/${width}x${height}/${color}/FFFFFF?text=${encodedPrompt}`;
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
export async function testEdgeFunctionAvailability(supabaseUrl: string, functionName: string, timeout: number = 5000): Promise<boolean> {
  try {
    // Use AbortController to timeout the request quickly
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'OPTIONS',
      signal: controller.signal,
      // Add headers to avoid preflight issues
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    // Even a 404 or 405 means the function endpoint exists
    return response.status !== 0 && response.status < 500;
  } catch (error) {
    // Don't log expected errors for unavailable functions
    return false;
  }
}

// Cached result to avoid repeated checks
let edgeFunctionCache: { [key: string]: { available: boolean; timestamp: number } } = {};
const CACHE_DURATION = 30 * 1000; // 30 seconds for faster detection of newly deployed functions

export async function testEdgeFunctionAvailabilityCached(supabaseUrl: string, functionName: string): Promise<boolean> {
  const cacheKey = `${supabaseUrl}/${functionName}`;
  const now = Date.now();
  
  // Check cache first
  if (edgeFunctionCache[cacheKey] && (now - edgeFunctionCache[cacheKey].timestamp < CACHE_DURATION)) {
    return edgeFunctionCache[cacheKey].available;
  }
  
  // Test availability
  const available = await testEdgeFunctionAvailability(supabaseUrl, functionName, 5000);
  
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
      return `Unable to connect to ${provider}. Using fallback image generation. Please deploy Edge Functions for full functionality.`;
    } else if (error.message.includes('CORS')) {
      return `CORS error with ${provider}. Edge Functions may not be properly deployed.`;
    } else if (error.message.includes('quota')) {
      return `${provider} API quota exceeded. Please check your account billing.`;
    } else if (error.message.includes('content filters')) {
      return 'Prompt was blocked by content filters. Please modify your prompt to comply with usage policies.';
    } else {
      return error.message;
    }
  }
  return `Unknown error occurred with ${provider}`;
}