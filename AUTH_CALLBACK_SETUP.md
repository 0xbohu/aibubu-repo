# Auth Callback Setup Guide

## What I Created

I've set up proper email confirmation handling for your registration flow:

1. **`src/app/auth/callback/route.ts`** - Server-side callback handler (for PKCE flow)
2. **`src/app/auth/confirm/page.tsx`** - Client-side confirmation page (for implicit flow with hash fragments)
3. **Updated `src/app/signup/page.tsx`** - Added `emailRedirectTo` option

## How It Works

When a user signs up:
1. They receive a confirmation email with a link like: `https://your-app.com/#access_token=...&refresh_token=...`
2. The link redirects to `/auth/confirm`
3. The confirm page extracts tokens from the URL hash
4. Sets the session using `supabase.auth.setSession()`
5. Creates player record if it doesn't exist
6. Redirects to `/dashboard`

## Supabase Configuration Required

You need to add the redirect URL to your Supabase project:

### Steps:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**
4. Add these URLs to **Redirect URLs**:
   - `http://localhost:3000/auth/confirm` (for local development)
   - `https://your-production-domain.com/auth/confirm` (for production)

### Alternative: Site URL

You can also set the **Site URL** to:
- Development: `http://localhost:3007`
- Production: `https://your-production-domain.com`

## Testing

1. Sign up with a new email
2. Check your email for the confirmation link
3. Click the link - it should redirect to `/auth/confirm`
4. You should see a loading spinner, then success message
5. Automatically redirects to `/dashboard` after 2 seconds

## Troubleshooting

If the confirmation fails:
- Check browser console for errors
- Verify the redirect URL is added in Supabase settings
- Make sure your `.env.local` has correct Supabase credentials
- Check that the email link hasn't expired (default: 1 hour)
