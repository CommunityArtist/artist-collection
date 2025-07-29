import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '3600'
};

async function getNebiusApiKey() {
  // First try environment variable (preferred for production)
  let apiKey = Deno.env.get('NEBIUS_API_KEY');
  
  if (apiKey && apiKey !== 'your-nebius-api-key-here' && apiKey.length > 10) {
    console.log('Using Nebius API key from environment variable');
    return apiKey;
  }
  
  // Fallback: try to get from database
  try {
    console.log('Environment API key not found, trying database...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Try to get a global API key from database
      const { data, error } = await supabase
        .from('api_config')
        .select('key_value')
        .eq('key_name', 'nebius_api_key')
        .is('user_id', null) // Global key
        .limit(1)
        .single();
      
      if (!error && data?.key_value) {
        console.log('Found Nebius API key in database');
        return data.key_value;
      }
      
      if (error) {
        console.error('Database query error:', error);
      }
    }
  } catch (error) {
    console.error('Error fetching API key from database:', error);
  }
  
  // If no key found, throw descriptive error
  throw new Error('Nebius API key not found. Please configure your API key in the settings.');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    console.log('=== Nebius AI Image Generation Started ===');
    
    // Check user authentication first
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authentication required. Please sign in to generate images.');
    }

    // Initialize Supabase client for user verification
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

    console.log('User authenticated:', user.email);

    // Check if user has API access
    const { data: apiAccess, error: accessError } = await supabase
      .from('api_access')
      .select('has_access')
      .eq('user_email', user.email)
      .single();

    if (accessError || !apiAccess?.has_access) {
      console.error('User lacks API access:', user.email, accessError);
      throw new Error(`API access denied. Your account (${user.email}) does not have permission to generate images. Please contact support.`);
    }

    console.log('User has API access confirmed:', user.email);
    
    // Get Nebius API key with fallback logic
    const nebiusApiKey = await getNebiusApiKey();

    const { 
      prompt, 
      imageDimensions = '1:1', 
      numberOfImages = 1,
      test = false
    } = await req.json();

    // Handle test requests
    if (test) {
      console.log('Test request received - checking Nebius AI API connectivity');
      
      try {
        // Simple test request to Nebius AI to check connectivity
        const testResponse = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${nebiusApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            modelUri: 'gpt://b1ghh9hpaq9fh7rrvjf8/yandexgpt-lite',
            completionOptions: {
              stream: false,
              temperature: 0.1,
              maxTokens: 10
            },
            messages: [
              {
                role: 'user',
                text: 'Say "API test successful"'
              }
            ]
          }),
        });

        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log('Nebius AI test successful:', testData);
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Nebius AI API is working correctly',
              testResponse: testData 
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        } else {
          const errorText = await testResponse.text();
          console.error('Nebius AI test failed:', testResponse.status, errorText);
          throw new Error(`Nebius AI API test failed: ${testResponse.status} ${testResponse.statusText}`);
        }
      } catch (testError) {
        console.error('Nebius AI connectivity test failed:', testError);
        throw new Error(`Nebius AI API connectivity test failed: ${testError instanceof Error ? testError.message : 'Unknown error'}`);
      }
    }

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Generating images with Nebius AI:', {
      prompt: prompt.substring(0, 100) + '...',
      dimensions: imageDimensions,
      count: numberOfImages
    });

    // Convert aspect ratio to width/height for Nebius AI
    let width = 1024, height = 1024; // default square
    if (imageDimensions === '16:9') { width = 1792; height = 1024; }
    else if (imageDimensions === '9:16') { width = 1024; height = 1792; }
    else if (imageDimensions === '4:3') { width = 1024; height = 768; }
    else if (imageDimensions === '3:4') { width = 768; height = 1024; }

    const imageUrls: string[] = [];
    
    // Generate images using Yandex Cloud AI Foundation Models
    for (let i = 0; i < Math.min(numberOfImages, 4); i++) {
      try {
        console.log(`Generating image ${i + 1}/${numberOfImages} with Nebius AI`);
        
        // Use Yandex Cloud AI Foundation Models for image generation
        const response = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/imageGenerationAsync', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${nebiusApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            modelUri: 'art://b1ghh9hpaq9fh7rrvjf8/yandex-art/latest',
            generationOptions: {
              seed: Math.floor(Math.random() * 2147483647),
              aspectRatio: {
                widthToHeightRatio: width / height
              }
            },
            messages: [
              {
                weight: 1,
                text: prompt
              }
            ]
          }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('Nebius AI API error:', errorData);
          
          if (response.status === 401) {
            throw new Error('Invalid Nebius API key. Please check your API key configuration.');
          } else if (response.status === 429) {
            throw new Error('Nebius AI rate limit exceeded. Please wait and try again.');
          } else if (response.status === 400) {
            throw new Error('Invalid request to Nebius AI. Please check your prompt.');
          } else {
            throw new Error(`Nebius AI API error: ${response.status} ${response.statusText}`);
          }
        }

        const responseData = await response.json();
        console.log('Nebius AI async response:', responseData);
        
        if (responseData.id) {
          // Poll for completion
          const operationId = responseData.id;
          let attempts = 0;
          const maxAttempts = 30; // 30 seconds max wait
          
          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            attempts++;
            
            console.log(`Checking operation status (attempt ${attempts}/${maxAttempts})`);
            
            const statusResponse = await fetch(`https://llm.api.cloud.yandex.net/operations/${operationId}`, {
              headers: {
                'Authorization': `Bearer ${nebiusApiKey}`,
              },
            });
            
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              console.log('Operation status:', statusData.done, statusData.error ? 'ERROR' : 'OK');
              
              if (statusData.done) {
                if (statusData.error) {
                  throw new Error(`Nebius AI generation failed: ${statusData.error.message || 'Unknown error'}`);
                }
                
                if (statusData.response && statusData.response.image) {
                  // Convert base64 to data URL
                  const imageUrl = `data:image/png;base64,${statusData.response.image}`;
                  imageUrls.push(imageUrl);
                  console.log(`Successfully generated image ${i + 1}`);
                  break;
                } else {
                  throw new Error('Nebius AI completed but returned no image data');
                }
              }
            } else {
              console.error('Failed to check operation status:', statusResponse.status);
            }
          }
          
          if (attempts >= maxAttempts) {
            throw new Error('Nebius AI generation timed out after 30 seconds');
          }
        } else {
          throw new Error('Nebius AI did not return an operation ID');
        }

      } catch (imageError) {
        console.error(`Error generating image ${i + 1}:`, imageError);
        // If this is the only image and it failed, throw the error
        if (numberOfImages === 1) {
          throw imageError;
        }
        // Otherwise continue with other images
      }
    }

    if (imageUrls.length === 0) {
      throw new Error('Failed to generate any images with Nebius AI. Please try again.');
    }

    console.log(`Successfully generated ${imageUrls.length} images with Nebius AI`);

    return new Response(
      JSON.stringify({
        imageUrl: imageUrls, // For backward compatibility
        imageUrls: imageUrls,
        generatedCount: imageUrls.length,
        requestedCount: numberOfImages,
        dimensions: `${width}x${height}`,
        provider: 'nebius-ai'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in nebius-ai-integration function:', error);
    
    let errorMessage = 'Failed to generate image with Nebius AI';
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid API key') || error.message.includes('401')) {
        errorMessage = 'Invalid Nebius API key. Please check your API key configuration.';
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        errorMessage = 'Nebius AI quota exceeded. Please check your account limits.';
      } else if (error.message.includes('content') || error.message.includes('safety')) {
        errorMessage = 'Your prompt was blocked by content filters. Please modify your prompt and try again.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (error.message.includes('API key not configured')) {
        errorMessage = 'Nebius AI API key not configured. Please contact support to set up the API key.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error occurred while connecting to Nebius AI. Please check your internet connection.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Nebius AI generation timed out. Please try again with a simpler prompt.';
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