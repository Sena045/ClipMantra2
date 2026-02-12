
# 🎬 ClipMantra Free Replica

A powerful, standalone AI engine that converts long-form videos into high-retention viral shorts using Google's Gemini 3.0 Flash.

## 💰 Zero Cost Guarantee
This project is architected to cost $0.00 to run:
- **AI Engine**: Uses the **Gemini 3.0 Flash Free Tier** (15 Requests Per Minute / 1M Tokens Per Minute).
- **Hosting**: Designed for **Netlify/Vercel Free Tiers**.
- **Processing**: All video clipping happens **locally in your browser** (No server costs).
- **Assets**: Background music is sourced from **Pixabay's royalty-free catalog**.

## 🚀 How to Host on Netlify
To ensure the API key is handled securely for free:

1.  **Set Environment Variables**: 
    - Go to **Site Settings** > **Environment Variables**.
    - Add `API_KEY` and paste your Gemini key from [Google AI Studio](https://aistudio.google.com/).
2.  **Configure Build Settings**:
    - **Build Command**: `npm run build`
    - **Publish Directory**: `dist`
3.  **Redeploy**: Trigger a new deploy.

## 📦 GitHub Troubleshooting
If `git push` fails:
1.  Go to GitHub **Settings** > **Developer Settings** > **Personal Access Tokens**.
2.  Generate a token with `repo` access.
3.  Use this token instead of your password when pushing.

## 🛠 Local Development
```bash
npm install
npm run dev
```

## 📜 License
Built as a community-first replica. No subscriptions, just code.
