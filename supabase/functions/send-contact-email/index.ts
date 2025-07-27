import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '3600'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    console.log('Send contact email function called');
    
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

    const { fullName, reason, email, message } = await req.json();

    if (!fullName || !reason || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'All form fields are required.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get email service credentials from environment variables
    const emailServiceApiKey = Deno.env.get('EMAIL_SERVICE_API_KEY');
    const senderEmail = Deno.env.get('SENDER_EMAIL_ADDRESS') || 'noreply@communityartist.com';
    
    if (!emailServiceApiKey) {
      console.error('Email service API key not found in environment variables');
      throw new Error('Email service not configured. Please contact support.');
    }

    console.log('Sending email using Resend API...');

    // Use Resend API to send email (you can replace this with your preferred email service)
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${emailServiceApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: senderEmail,
        to: ['narrativebottv@gmail.com'],
        subject: `New Contact Form Submission: ${reason}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Full Name:</strong> ${fullName}</p>
          <p><strong>Reason for Contact:</strong> ${reason}</p>
          <p><strong>Contact Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <hr>
          <p><small>Sent from Community Artist contact form</small></p>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error('Email service error:', errorData);
      throw new Error('Failed to send email. Please try again later.');
    }

    const emailData = await emailResponse.json();
    console.log('Email sent successfully:', emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully!',
        emailId: emailData.id 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in send-contact-email function:', error);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error instanceof Error) {
      if (error.message.includes('Authentication required')) {
        errorMessage = 'Please sign in to send a message.';
      } else if (error.message.includes('All form fields are required')) {
        errorMessage = 'Please fill in all required fields.';
      } else if (error.message.includes('Email service not configured')) {
        errorMessage = 'Email service is not configured. Please contact support.';
      } else if (error.message.includes('Failed to send email')) {
        errorMessage = 'Failed to send email. Please try again later.';
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