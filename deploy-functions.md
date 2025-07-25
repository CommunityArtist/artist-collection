# Supabase Edge Functions Deployment Guide

## Prerequisites

1. **Supabase CLI installed**:
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

## Environment Variables Required

Make sure these are set in your Supabase project settings:

- `OPENAI_API_KEY` - Your OpenAI API key
- `SUPABASE_URL` - Your Supabase project URL  
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (auto-provided)
- `SUPABASE_ANON_KEY` - Anonymous key (auto-provided)

## Deploy Commands

### Deploy All Functions
```bash
supabase functions deploy
```

### Deploy Individual Functions
```bash
# Core AI functions
supabase functions deploy generate-image
supabase functions deploy generate-prompt
supabase functions deploy extract-prompt
supabase functions deploy generate-metadata

# Utility functions
supabase functions deploy test-api-key
supabase functions deploy affogato-integration
```

## Function Descriptions

| Function | Purpose | Dependencies |
|----------|---------|--------------|
| `generate-image` | DALL-E 3 image generation | OpenAI API |
| `generate-prompt` | AI prompt creation | OpenAI API |
| `extract-prompt` | Image-to-prompt extraction | OpenAI Vision API |
| `generate-metadata` | Title/metadata generation | OpenAI API |
| `test-api-key` | API key validation | OpenAI API |
| `affogato-integration` | Alternative image service | RenderNet API |

## Post-Deployment Testing

Test each function after deployment:

```bash
# Test API key function
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/test-api-key' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"

# Test image generation
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-image' \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test image","dimensions":"1:1","numberOfImages":1}'
```

## Troubleshooting

### Common Issues:

1. **"Function not found"** - Make sure the function deployed successfully
2. **"API key error"** - Check your OpenAI API key in project settings
3. **"CORS error"** - Functions include CORS headers, check browser network tab
4. **"Authentication error"** - Ensure you're passing the correct auth token

### Debug Steps:

1. Check function logs in Supabase Dashboard → Edge Functions → Logs
2. Verify environment variables in Project Settings → API
3. Test functions individually before testing from frontend

## Environment Variables Setup

In your Supabase Dashboard → Project Settings → API → Environment Variables:

```
OPENAI_API_KEY=sk-your-openai-api-key-here
```

Replace `YOUR_PROJECT_REF` with your actual Supabase project reference ID.