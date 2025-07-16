import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import OpenAI from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '3600',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    // Use shared OpenAI API key from environment variables
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured. Please contact support.');
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    const { prompt, promptData } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const systemPrompt = `You are an expert art curator and photography specialist who creates compelling metadata for professional photography and AI-generated artwork. Your expertise lies in crafting evocative titles and detailed technical descriptions that capture both the artistic vision and technical execution.

TITLE CREATION GUIDELINES:
- Create titles that primarily describe the MAIN SUBJECT with artistic flair (2-5 words)
- Focus on the subject itself, enhanced with mood or setting descriptors
- Examples based on subjects:
  * "Confident Woman" → "Radiant Portrait Study"
  * "Mountain Landscape" → "Majestic Alpine Vista" 
  * "Vintage Car" → "Classic Chrome Beauty"
  * "Garden Scene" → "Blooming Garden Sanctuary"
  * "Urban Architecture" → "Modern Steel Cathedral"
- Start with the subject, then add atmospheric or artistic qualifiers
- Avoid generic terms like "AI Generated", "Image", "Photo", etc.
- Make it descriptive of what the subject actually is, enhanced with artistic language

NOTES CREATION GUIDELINES:
- Write 2-3 detailed sentences describing the technical approach and artistic vision
- Include specific lighting techniques, camera settings, and compositional choices
- Mention the mood, atmosphere, and emotional impact
- Reference professional photography techniques used
- Example format: "Using [lighting technique] and [camera setup], this portrait captures [subject description] in [emotional state/setting]. The composition highlights [specific elements] while emphasizing [artistic approach]. [Additional technical or artistic detail]."

SREF GUIDELINES:
- Generate realistic reference numbers in format "SREF-XXXX" where XXXX is 4 digits
- Use numbers that feel professional and authentic (1000-9999 range)

STYLE REQUIREMENTS:
- Titles should be Instagram/social media ready
- Notes should sound like professional photography descriptions
- Use sophisticated, artistic language
- Focus on the craft and technique behind the image
- Emphasize the emotional and visual impact
- Avoid mentioning "AI" or "generated" in titles or notes
- Write as if describing a professional photographer's work

Respond in JSON format with exactly these keys: "title", "notes", "sref"`;

    const userPrompt = `Based on this generated prompt and input data, create metadata with a title that primarily describes the main subject:

GENERATED PROMPT:
${prompt}

KEY ELEMENTS TO CONSIDER:
- Main Subject: ${promptData.main_subject || promptData.subject || 'Not specified'}
- Setting/Environment: ${promptData.setting || 'Not specified'}  
- Photography Style: ${promptData.art_style || promptData.style || 'Not specified'}
- Mood & Atmosphere: ${promptData['mood_&_atmosphere'] || promptData.mood || 'Not specified'}
- Lighting Setup: ${promptData.lighting_setup || promptData.lighting || 'Not specified'}
- Camera & Technical: ${promptData['camera_&_lens'] || promptData.camera_lens || 'Professional camera setup'}
- Enhancement Category: ${promptData.selectedCategory || 'Natural Photography'}
- Enhancement Level: ${promptData.enhanceLevel || 0}/5

IMPORTANT: Create a title that describes the main subject (${promptData.main_subject || promptData.subject || 'the subject'}) with artistic enhancement. The title should make it clear what the subject is while adding poetic or atmospheric qualities.

Create a descriptive title focused on the main subject, detailed professional notes about the photographic technique and artistic vision, and a realistic SREF number.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    const response = completion.choices[0]?.message?.content?.trim();

    if (!response) {
      throw new Error('OpenAI API returned an empty response');
    }

    let metadata;
    try {
      metadata = JSON.parse(response);
    } catch (parseError) {
      // Fallback if JSON parsing fails - create subject-focused title
      const subject = promptData.main_subject || promptData.subject || 'Artistic Subject';
      const subjectWords = subject.split(' ').slice(0, 3).join(' '); // Take first 3 words
      
      metadata = {
        title: `${subjectWords} Study`,
        notes: "Captured using professional lighting techniques and careful composition to create an intimate and contemplative mood. The natural lighting and shallow depth of field emphasize the subject's expression while maintaining authentic skin texture and detail.",
        sref: `SREF-${Math.floor(2000 + Math.random() * 7000)}`
      };
    }

    // Ensure all required fields exist
    if (!metadata.title || !metadata.notes || !metadata.sref) {
      throw new Error('Generated metadata is incomplete');
    }

    return new Response(
      JSON.stringify(metadata),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error:', error);
    
    let errorMessage = 'Failed to generate metadata';
    
    if (error instanceof Error) {
      if (error.message.includes('Incorrect API key')) {
        errorMessage = 'Invalid OpenAI API key. Please check your API key in settings.';
      } else if (error.message.includes('You exceeded your current quota')) {
        errorMessage = 'OpenAI API quota exceeded. Please check your OpenAI account billing and usage limits.';
      } else if (error.message.includes('API key not found')) {
        errorMessage = 'OpenAI API key not found. Please configure your API key in the settings.';
      } else if (error.message.includes('insufficient_quota')) {
        errorMessage = 'Insufficient OpenAI credits. Please add credits to your OpenAI account.';
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