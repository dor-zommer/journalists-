<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1uXvwWt5rRW7y9ErwWeqjrbdj7_gf5JQb

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   Then edit `.env.local` and set your `GEMINI_API_KEY` to your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

3. Run the app:
   ```bash
   npm run dev
   ```

4. Preview the app:
   - **Local development**: Open [http://localhost:3000](http://localhost:3000)
   - **GitHub Codespaces**: Click the "Ports" tab and open the forwarded port 3000
   - **Other cloud IDEs**: Use the preview URL provided by your environment

The dev server is configured to run on `0.0.0.0:3000` to support previewing in cloud development environments.

## Build for Production

To create a production build:
```bash
npm run build
```

To preview the production build locally:
```bash
npm run preview
```

## Development in Cloud Environments

This app is configured to work seamlessly in cloud development environments like GitHub Codespaces:
- The Vite dev server binds to `0.0.0.0` to allow external access
- Port 3000 is automatically forwarded in most cloud IDEs
- No additional configuration needed for preview functionality
