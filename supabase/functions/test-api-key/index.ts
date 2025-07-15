import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import OpenAI from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Testing API key...');
    
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

    console.log('Fetching user-specific API key from database...');
    const { data: apiConfig, error: fetchError } = await supabaseClient
      .from('api_config')
      .select('key_value')
      .eq('key_name', 'openai_api_key')
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('Database fetch error:', fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }

    if (!apiConfig?.key_value) {
      throw new Error('No OpenAI API key found. Please configure your API key in the API Configuration page. Go to Account > API Config to set up your OpenAI API key.');
    }

    console.log('API key found, testing with OpenAI...');
    
    const openai = new OpenAI({
      apiKey: apiConfig.key_value,
    });

    // Test with a simple completion
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "user", content: "Say 'API test successful' if you can read this." }
      ],
      max_tokens: 10,
    });

    const response = completion.choices[0]?.message?.content?.trim();
    console.log('OpenAI test response:', response);

    if (!response) {
      throw new Error('OpenAI API returned empty response');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'API key is working correctly',
        testResponse: response 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('API test error:', error);
    
    let errorMessage = 'API test failed';
    
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
        errorMessage = 'OpenAI API quota exceeded';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error connecting to OpenAI';
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