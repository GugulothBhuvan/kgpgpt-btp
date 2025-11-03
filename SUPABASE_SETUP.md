# Supabase Authentication Setup Guide

## 🚀 Quick Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `kgpgpt-auth`
   - **Database Password**: Choose a strong password
   - **Region**: Choose closest to your location
6. Click "Create new project"
7. Wait for the project to be ready (2-3 minutes)

### 2. Get Your Project Credentials
1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ`)
   - **service_role** key (starts with `eyJ`)

### 3. Update Environment Variables
Add these to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4. Configure Authentication Settings
1. Go to **Authentication** → **Settings**
2. Under **Site URL**, add: `http://localhost:3000`
3. Under **Redirect URLs**, add: `http://localhost:3000`
4. **Enable email confirmations**: Toggle ON (recommended)
5. **Enable email change confirmations**: Toggle ON (recommended)

### 5. Set Up Database Schema (Optional)
If you want to store user preferences or chat history:

```sql
-- Create a profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Create policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### 6. Test the Authentication
1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000`
3. You should see a "Sign In to Continue" button
4. Click it and try to:
   - **Sign Up** with a new email
   - **Sign In** with existing credentials
   - **Sign Out** from the user profile

## 🔧 Features Implemented

### ✅ Authentication Features:
- **User Registration**: Email/password signup
- **User Login**: Email/password signin
- **User Logout**: Secure session termination
- **Protected Routes**: API endpoints require authentication
- **User Profile**: Display user email and logout option
- **Session Management**: Automatic session handling

### ✅ Security Features:
- **Route Protection**: `/api/query` requires authentication
- **Middleware**: Automatic auth checks on protected routes
- **Session Validation**: Server-side session verification
- **Secure Cookies**: HTTP-only session cookies

### ✅ UI Components:
- **AuthModal**: Login/signup modal with toggle
- **UserProfile**: User info and logout button
- **Loading States**: Proper loading indicators
- **Error Handling**: User-friendly error messages

## 🚨 Troubleshooting

### Common Issues:

1. **"Invalid API key" error**:
   - Check your `.env.local` file has correct Supabase credentials
   - Restart your development server after adding env vars

2. **"Authentication required" error**:
   - Make sure you're signed in
   - Check if the session is valid
   - Try refreshing the page

3. **Email confirmation not working**:
   - Check your Supabase project settings
   - Verify redirect URLs are correct
   - Check spam folder for confirmation emails

4. **CORS errors**:
   - Add your domain to Supabase allowed origins
   - Check Site URL in Supabase settings

### Development Tips:

1. **Test with different users**: Create multiple test accounts
2. **Check Supabase logs**: Go to Logs → Auth to see authentication events
3. **Use Supabase dashboard**: Monitor user registrations and sessions
4. **Test API protection**: Try accessing `/api/query` without authentication

## 🎯 Next Steps

After setting up authentication, you can:

1. **Add user preferences**: Store user settings in database
2. **Chat history**: Save conversations per user
3. **User roles**: Implement admin/user roles
4. **Social login**: Add Google/GitHub OAuth
5. **Email templates**: Customize auth emails
6. **Analytics**: Track user interactions

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Authentication](https://supabase.com/docs/guides/auth/nextjs)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
