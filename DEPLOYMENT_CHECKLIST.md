# Deployment & Production Handover Checklist 🚀

Follow this checklist to deploy your backend to [Render.com](https://render.com/) (Free Tier), configure Supabase, and build the final Android APK file using EAS Build.

---

## 1. Database Verification (Supabase)
- [ ] Run the complete schema script from [supabase_schema.sql](file:///c:/Users/krish%20vasoya/OneDrive/Desktop/shayona/supabase_schema.sql) in the **Supabase SQL Editor**.
- [ ] Verify Row Level Security (RLS) is active by running:
  ```sql
  SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
  ```
- [ ] Copy your Supabase Project URL (`https://your-project.supabase.co`) and `anon` / `service_role` keys from **Project Settings -> API**.

---

## 2. Backend Deployment on Render.com (Free Tier)
1. Push this repository to your GitHub account:
   ```bash
   git push origin main
   ```
2. Log in to [Render.com](https://render.com/) and click **"New +" -> "Web Service"**.
3. Select your GitHub repository (`shayona`).
4. Configure the service settings:
   - **Name**: `shayona-invoice-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
5. Under **"Advanced" -> "Environment Variables"**, add:
   - `PORT` = `5000`
   - `NODE_ENV` = `production`
   - `SUPABASE_URL` = `https://your-project.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = `your-supabase-service-key`
   - `FIREBASE_PROJECT_ID` = `your-firebase-project-id`
   - `FIREBASE_CLIENT_EMAIL` = `firebase-adminsdk@...`
   - `FIREBASE_PRIVATE_KEY` = `"-----BEGIN PRIVATE KEY-----\n..."`
6. Click **Create Web Service**.
7. Test the health check endpoint once deployed:
   ```
   https://your-app.onrender.com/health
   ```
   *Expected Response:* `{"status": "ok", "timestamp": "..."}`

---

## 3. Mobile Production Configuration
1. In `mobile/`, update your production API URL in `.env.production` or `src/config/env.ts`:
   ```text
   EXPO_PUBLIC_API_URL=https://your-app.onrender.com/api/v1
   EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID=your-google-web-client-id
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

---

## 4. Build Android APK via EAS Build (Free)
Run the following commands in the `mobile` directory:
```bash
# 1. Install EAS CLI globally (if not already installed)
npm install -g eas-cli

# 2. Login to your Expo account
eas login

# 3. Build standalone APK for Android
eas build --platform android --profile production
```
> When the build finishes, EAS will provide a direct download link to your `.apk` file ready to install on any Android phone.

---

## 5. Final Quality Checklist
- [ ] Backend deployed on Render.com and `/health` responds with 200 OK.
- [ ] Mobile app connects to live Render backend.
- [ ] Invoices generate clean PDF bills without any GST or tax fields.
- [ ] WhatsApp sharing and native Print dialog trigger successfully.
- [ ] Multi-language toggle (English & ગુજરાતી) works and persists across app restarts.
- [ ] Logout works safely and resets user session to the login screen.
