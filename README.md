
# 🎬 ClipMantra Free Replica

A powerful, standalone AI engine that converts long-form videos into high-retention viral shorts using Google's Gemini 3.0 Flash.

## 🚀 How to Host on Netlify (Fixing the API Error)

If you are getting the "API Key must be set" error, follow these exact steps:

1.  **Set Environment Variables**: 
    - Go to **Site Settings** > **Environment Variables**.
    - Add `API_KEY` and paste your Gemini key.
2.  **Configure Build Settings**:
    - **Build Command**: `npm run build`
    - **Publish Directory**: `dist`
3.  **Redeploy**: Trigger a new deploy. The `vite.config.ts` will now inject your key during the build process.

## 📦 GitHub Troubleshooting (If push fails)

If `git push` asks for a password and fails:
1.  **Create a Token**: Go to GitHub **Settings** > **Developer Settings** > **Personal Access Tokens** > **Tokens (classic)**.
2.  **Permissions**: Select `repo`.
3.  **Use Token**: When the terminal asks for your password, paste this token instead.

## 🛠 Local Development

```bash
npm install
npm run dev
```

## ✨ Features

- **AI Viral Analysis**: Automatically detects high-energy segments.
- **Local Extraction**: Processes video clipping directly in your browser.
- **Audio Merging**: Overlay viral background tracks.
- **Vite Powered**: Secure environment variable handling.

## 📜 Credits
Built as a community-first replica. No subscriptions, just code.
