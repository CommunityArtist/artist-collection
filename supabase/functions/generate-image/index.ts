import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import OpenAI from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '3600'
};

// Map frontend dimension ratios to DALL-E 3 supported sizes
const mapDimensionsToSize = (dimensions: string): string => {
  switch (dimensions) {
    case '1:1':
      return '1024x1024';
    case '3:2': // Closest landscape
    case '16:9':
      return '1792x1024';
    case '2:3': // Closest portrait
    case '4:5': // Closest portrait
    case '9:16':
      return '1024x1792';
    default:
      // For unsupported ratios, default to square
      return '1024x1024';
  }
};

// Get orientation hint for prompt optimization
const getOrientationHint = (dimensions: string): string => {
  switch (dimensions) {
    case '2:3':
    case '4:5':
    case '9:16':
      return 'tall vertical portrait format, subject positioned vertically from top to bottom of frame';
    case '3:2':
    case '16:9':
      return 'wide horizontal landscape format, subject positioned horizontally from left to right of frame';
    case '1:1':
      return 'perfectly square composition, centered subject';
    default:
      return 'balanced vertical composition';
  }
};

// Get composition guidance for better orientation consistency
const getCompositionGuidance = (dimensions: string): string => {
  switch (dimensions) {
    case '2:3':
    case '4:5':
    case '9:16':
      return 'Frame the subject from head to torso or full body, emphasizing the vertical height of the composition. Position elements to fill the tall frame naturally.';
    case '3:2':
    case '16:9':
      return 'Frame the subject across the width of the image, emphasizing the horizontal breadth of the composition. Use the wide format to show more of the environment or context.';
    case '1:1':
      return 'Center the subject in a balanced square frame with equal space on all sides.';
    default:
      return 'Frame the subject naturally within the vertical format.';
  }
};
// Optimize prompt for DALL-E 3
const optimizePromptForDALLE3 = (prompt: string, dimensions: string): string => {
  const orientationHint = getOrientationHint(dimensions);
  const compositionGuidance = getCompositionGuidance(dimensions);
  
  // DALL-E 3 works best with descriptive, natural language prompts
  // Remove technical photography jargon that might confuse the model
  let optimized = prompt
    // Remove common technical terms that don't translate well to DALL-E 3
    .replace(/\b(shot on|captured with|photographed with)\s+[^,]+,?\s*/gi, '')
    .replace(/\b(canon|nikon|sony|leica)\s+[^,]+,?\s*/gi, '')
    .replace(/\b\d+mm\s+(lens|f\/[\d.]+|aperture),?\s*/gi, '')
    .replace(/\bISO\s+\d+,?\s*/gi, '')
    .replace(/\b(depth of field|bokeh|DOF),?\s*/gi, 'with blurred background, ')
    .replace(/\b(professional|commercial|studio)\s+photography,?\s*/gi, '')
    .replace(/\bhigh\s+resolution,?\s*/gi, '')
    .replace(/\b(RAW|JPEG|file format),?\s*/gi, '')
    // Remove any existing orientation terms that might conflict
    .replace(/\b(horizontal|vertical|landscape|portrait)\s*(orientation|format)?,?\s*/gi, '')
    // Clean up multiple spaces and commas
    .replace(/,\s*,/g, ',')
    .replace(/\s+/g, ' ')
    .replace(/,\s*$/, '')
    .trim();

  // Add EXTREMELY strong anti-digital-art prefixes to prevent artificial appearance
  const realismPrefix = "REAL PHOTOGRAPH - NOT DIGITAL ART: ";
  const antiArtificial = "ABSOLUTELY NOT digital art, NEVER illustration, NEVER painting, NEVER CGI, NEVER rendered, NEVER artificial, NEVER perfect, NEVER waxy skin, NEVER sculpted hair, ";
  
  // Ensure the prompt starts with a clear subject description
  if (!optimized.match(/^(A|An|The)\s/i)) {
    if (optimized.toLowerCase().includes('woman') || optimized.toLowerCase().includes('girl')) {
      optimized = 'A ' + optimized;
    } else if (optimized.toLowerCase().includes('man') || optimized.toLowerCase().includes('boy')) {
      optimized = 'A ' + optimized;
    } else if (optimized.toLowerCase().includes('person') || optimized.toLowerCase().includes('people')) {
      optimized = 'A ' + optimized;
    } else {
      optimized = 'An image of ' + optimized;
    }
  }

  // Add STRONG realism emphasis and natural texture requirements
  const realismRequirements = ", MUST HAVE natural skin with visible pores and subtle imperfections, MUST HAVE slightly imperfect hair with natural texture and movement, MUST HAVE realistic lighting with natural shadows and highlights, MUST HAVE authentic human expression with genuine emotion, MUST HAVE candid documentary photography style, MUST AVOID any digital art appearance";
  
  // Add strong orientation and composition guidance at the beginning for better consistency
  if (dimensions === '9:16' || dimensions === '2:3' || dimensions === '4:5') {
    // For portrait ratios, make orientation guidance very explicit and early in prompt
    optimized = `${realismPrefix}${antiArtificial}IMPORTANT: Create this image in ${orientationHint}. ${optimized}${realismRequirements}. ${compositionGuidance}`;
  } else if (dimensions === '16:9' || dimensions === '3:2') {
    // For landscape ratios, emphasize horizontal composition
    optimized = `${realismPrefix}${antiArtificial}IMPORTANT: Create this image in ${orientationHint}. ${optimized}${realismRequirements}. ${compositionGuidance}`;
  } else {
    // For square, add balanced composition guidance
    optimized = `${realismPrefix}${antiArtificial}${optimized}${realismRequirements}. ${compositionGuidance}`;
  }
  
  return optimized;
};

// Validate DALL-E 3 parameters
const validateDALLE3Params = (size: string, numberOfImages: number) => {
  const validSizes = ['1024x1024', '1792x1024', '1024x1792'];
  if (!validSizes.includes(size)) {
    throw new Error(`Invalid size for DALL-E 3: ${size}. Supported sizes: ${validSizes.join(', ')}`);
  }
  
  if (numberOfImages > 4) {
    throw new Error('DALL-E 3 supports maximum 4 images per request');
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
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

    console.log('OpenAI API key found, initializing DALL-E 3 client');
    
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    const { prompt, imageDimensions = '1:1', numberOfImages = 1, style = 'natural' } = await req.json();

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
    
    // Validate parameters for DALL-E 3
    validateDALLE3Params(size, numberOfImages);
    
    // Optimize prompt for DALL-E 3
    const optimizedPrompt = optimizePromptForDALLE3(prompt, imageDimensions);
    
    // Add comprehensive negative prompt to prevent artificial appearance
    const negativePromptElements = [
      "digital art", "illustration", "painting", "CGI", "rendered", "3D render",
      "artificial", "synthetic", "plastic skin", "waxy appearance", "doll-like",
      "perfect skin", "airbrushed", "retouched", "smooth skin", "glossy skin",
      "cartoon", "anime", "fantasy", "surreal", "stylized", "artistic rendering",
      "computer graphics", "digital painting", "concept art", "game art",
      "overly saturated", "artificial lighting", "neon colors", "glowing eyes",
      "perfect symmetry", "flawless features", "unnatural proportions",
      "sculpted hair", "perfect hair", "too perfect", "digital portrait",
      "overly polished", "artificial perfection", "digital makeup",
      "flawless composition", "studio perfection", "idealized features",
      "Instagram filter", "beauty filter", "digital enhancement"
    ].join(", ");
    
    // Enhanced prompt with STRONG negative guidance placed at the beginning
    const enhancedPrompt = `CRITICAL: This MUST be a real photograph, NOT digital art. AVOID: ${negativePromptElements}. ${optimizedPrompt}`;
    
    console.log('Original prompt length:', prompt.length);
    console.log('Enhanced prompt length:', enhancedPrompt.length);
    console.log('Target dimensions:', imageDimensions, '-> DALL-E size:', size);
    
    // DALL-E 3 only supports generating 1 image at a time
    // For multiple images, we'll generate them sequentially
    const imagesToGenerate = Math.min(numberOfImages, 4); // Limit to 4 for performance
    const imageUrls: string[] = [];
    const revisedPrompts: string[] = [];
    let lastError: Error | null = null;

    console.log(`Generating ${imagesToGenerate} images with DALL-E 3`);

    for (let i = 0; i < imagesToGenerate; i++) {
      try {
        console.log(`Generating image ${i + 1}/${imagesToGenerate}`);
        
        // Add a small delay between requests to avoid rate limiting
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: enhancedPrompt,
          n: 1, // DALL-E 3 only supports n=1
          size: size as "1024x1024" | "1792x1024" | "1024x1792",
          quality: "hd",
          style: style as "natural" | "vivid",
        });

        const imageData = response.data[0];
        if (imageData?.url) {
          imageUrls.push(imageData.url);
          // Store the revised prompt that DALL-E 3 actually used
          if (imageData.revised_prompt) {
            revisedPrompts.push(imageData.revised_prompt);
          }
          console.log(`Successfully generated image ${i + 1}`);
        }
      } catch (imageError) {
        console.error(`Error generating image ${i + 1}:`, imageError);
        lastError = imageError instanceof Error ? imageError : new Error(String(imageError));
        
        // If it's a content filter or safety system error, stop trying to generate more images
        if (imageError instanceof Error && 
            (imageError.message.includes('content filters') || 
             imageError.message.includes('safety system') ||
             imageError.message.includes('policy'))) {
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

    // Return comprehensive response with DALL-E 3 specific data
    return new Response(
      JSON.stringify({ 
        imageUrl: imageUrls[0],
        imageUrls: imageUrls,
        revisedPrompts: revisedPrompts,
        originalPrompt: prompt,
        optimizedPrompt: optimizedPrompt,
        generatedCount: imageUrls.length,
        requestedCount: numberOfImages,
        dimensions: imageDimensions,
        actualSize: size,
        model: "dall-e-3",
        quality: "hd",
        style: style
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
        errorMessage = 'Your prompt was blocked by DALL-E 3\'s content filters. Please modify your prompt to comply with OpenAI\'s usage policies and avoid content that may be considered inappropriate, violent, sexual, or hateful.';
      } else if (error.message.includes('safety system')) {
        errorMessage = 'Your prompt was blocked by DALL-E 3\'s safety system. Please modify your prompt to comply with OpenAI\'s usage policies and avoid content that may be considered inappropriate, violent, sexual, or hateful.';
      } else if (error.message.includes('policy')) {
        errorMessage = 'Your request violates DALL-E 3\'s usage policies. Please modify your prompt to comply with OpenAI\'s content guidelines.';
      } else if (error.message.includes('You exceeded your current quota')) {
        errorMessage = 'OpenAI API quota exceeded. Please contact support.';
      } else if (error.message.includes('API key not found')) {
        errorMessage = 'OpenAI API key not configured in system. Please contact support.';
      } else if (error.message.includes('insufficient_quota')) {
        errorMessage = 'Insufficient OpenAI credits. Please contact support.';
      } else if (error.message.includes('invalid_api_key')) {
        errorMessage = 'Invalid OpenAI API key. Please contact support.';
      } else if (error.message.includes('Invalid size')) {
        errorMessage = error.message; // Use the specific validation error
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