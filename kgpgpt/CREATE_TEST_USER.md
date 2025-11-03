# Create Test User in Supabase

## 🚨 Quick Fix: Manually Create a Test User

If you can't log in with your signup credentials, here are solutions:

---

## ✅ Solution 1: Disable Email Confirmation (Recommended for Testing)

1. Go to **Supabase Dashboard**: https://app.supabase.com
2. Select your project: `jdfakcnnvebihrjajmui`
3. Click **Authentication** in sidebar
4. Click **Providers**
5. Find **Email** provider
6. **Uncheck** "Confirm email"
7. Click **Save**

Now you can sign up and login immediately without email verification!

---

## ✅ Solution 2: Manually Confirm Existing User

If you already signed up but didn't get verification email:

1. Go to **Supabase Dashboard**
2. Click **Authentication** → **Users**
3. Find your user in the list
4. Click on the user
5. Look for **"Email Confirmed"** field
6. Change it to **true**
7. Save

Now try logging in again!

---

## ✅ Solution 3: Create User via SQL

Run this in Supabase SQL Editor:

```sql
-- Create a test user with password
-- Email: test@example.com
-- Password: testpassword123

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'test@example.com',
  crypt('testpassword123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated'
);
```

**Then login with:**
- Email: `test@example.com`
- Password: `testpassword123`

---

## ✅ Solution 4: Check Current Users

See if your user exists:

```sql
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC;
```

If `email_confirmed_at` is NULL, that's why you can't login!

**Fix it:**
```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'your-email@example.com';
```

---

## ✅ Solution 5: Reset Password

If you forgot your password:

1. On login screen, click "Forgot Password"
2. Or run this SQL to manually set a new password:

```sql
UPDATE auth.users
SET encrypted_password = crypt('newpassword123', gen_salt('bf'))
WHERE email = 'your-email@example.com';
```

---

## 🧪 Test the Fix

After applying any solution above:

1. Open browser: http://localhost:3000
2. Click **Sign In**
3. Enter email and password
4. You should see better error messages now!

---

## 🐛 Debug Mode

Open browser console (F12) when logging in. You'll now see:
- `Auth error:` - Shows the exact error
- `Login successful!` - Confirms successful login

Check the console for specific error messages!

---

## 📧 Email Configuration (Optional)

If you want email verification to work properly:

1. Supabase Dashboard → **Project Settings** → **Auth**
2. Configure SMTP settings (or use Supabase's default)
3. Test by sending a test email

For development, it's easier to **disable email confirmation**.

---

## ✅ Recommended Approach

**For Testing/Development:**
1. Disable email confirmation in Supabase
2. Create a test account
3. Login immediately

**For Production:**
1. Enable email confirmation
2. Configure proper SMTP
3. Test the full signup → verify → login flow

---

## 🎯 What Error Are You Seeing?

Try logging in now and tell me what error message you see. The updated code will show clearer errors! Common ones:

- **"Invalid email or password"** → Wrong credentials
- **"Email not confirmed"** → Need to verify email
- **"User not found"** → Account doesn't exist, sign up first

Let me know what you see! 🔍

