# How to Apply Database Migration

## Method 1: Using Supabase CLI (Recommended)

### Prerequisites:
1. Make sure you have Supabase CLI installed:
   ```bash
   npm install -g supabase
   ```

2. Make sure you're logged in to Supabase:
   ```bash
   supabase login
   ```

3. Make sure your project is linked:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

### Apply the Migration:
```bash
# Navigate to your project directory
cd /path/to/your/project

# Push all pending migrations to your Supabase project
supabase db push
```

## Method 2: Manual Application via Supabase Dashboard

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Copy Migration Content
Copy the entire content from the migration file:
`supabase/migrations/20250727045500_fix_api_access_comprehensive.sql`

### Step 3: Execute Migration
1. Paste the SQL code into the SQL Editor
2. Click **"Run"** to execute the migration
3. You should see success messages and logs showing the results

### Step 4: Verify Results
The migration will log results like:
- "Updated API access for specific users"
- "Total users: X, Users with API access: Y"

## Method 3: Using Supabase Studio (Alternative)

### Step 1: Access Database
1. In your Supabase Dashboard, go to **Database** → **SQL Editor**
2. Create a new query

### Step 2: Run Migration
1. Copy and paste the migration SQL
2. Execute the query
3. Check the results in the output

## Expected Results After Migration:

✅ **mensswag@gmail.com** will have API access  
✅ **narrativebottv@gmail.com** access confirmed  
✅ All existing users get retroactive access  
✅ All future signups automatically get access  
✅ Enhanced logging for debugging  

## Troubleshooting:

### If you get permission errors:
- Make sure you're using the correct project reference
- Verify you have admin access to the Supabase project

### If migration fails:
- Check the SQL Editor for specific error messages
- Make sure no other migrations are pending
- Try running the SQL manually in smaller chunks

### To verify the fix worked:
1. Have `mensswag@gmail.com` log into the app
2. Try generating images in the Prompt Builder
3. Check browser console for any error messages

## Important Notes:
- This migration is safe to run multiple times (uses ON CONFLICT clauses)
- It won't delete or modify existing data
- It only adds missing API access entries and creates triggers