# digital-wardrobe

🧥 AI‑Powered Digital Wardrobe — Manage your closet, get weather‑based outfit suggestions, style for occasions, receive smart shopping recommendations, and detect clothing categories from images.  
Built with Vanilla JS, Express (Node), FastAPI (Python), and Supabase. Integrates Gemini, Clarifai, and OpenWeather.

---

## Features

- Wardrobe management (add/update/remove items stored locally or via Supabase)
- Weather‑based outfit suggestions (OpenWeather + Gemini)
- Occasion‑based styling (Gemini)
- Pair‑an‑item recommendations (Gemini)
- Smart shopping recommendations to maximize outfit combinations (Gemini)
- Clothing detection using Clarifai (and optional local MobileNetV2 path)
- Modern UI with multiple pages for AI features

---

## Architecture

- `digital wardrobe/` — Frontend (HTML/CSS/JS) + lightweight Node server (`server.js`)
- `cloth detection/` — Optional Python FastAPI service for image analysis
- `digital wardrobe/server.js` — Express server offering AI endpoints and weather helper
- `digital wardrobe/supabase.js` — Client‑side Supabase initialization (reads from `config.js`)
- `digital wardrobe/config.example.js` — Example client config (copy to `config.js`)
- `.env` — Server‑side secrets loaded via `dotenv` (not committed)

---

## Prerequisites

- Node.js 18+ (for `fetch` support on server)
- Python 3.9+ (only if you want to run the FastAPI service)
- Git

---

## Quick Start (Windows PowerShell)

1) Clone and enter the project:
```powershell
git clone https://github.com/Divyankseervi/digital-wardrobe.git
cd "digital-wardrobe"
```

2) Create local env files (do not commit these):
- Copy `env.example` → `.env` and fill values
- Copy `digital wardrobe/config.example.js` → `digital wardrobe/config.js` and fill client values

3) Install Node dependencies and run the server:
```powershell
npm install
node "digital wardrobe/server.js"
```
Server runs at: `http://localhost:4000`

4) Open the frontend pages from `digital wardrobe/` (e.g., `index.html`) using a local web server or Live Server extension.

---

## Environment Variables (.env)

Create `.env` at the project root. Example keys (see `env.example`):

```
# Server
PORT=4000

# Clarifai
CLARIFAI_API_KEY=your_clarifai_api_key
CLARIFAI_USER_ID=your_clarifai_user_id
CLARIFAI_APP_ID=your_clarifai_app_id
CLARIFAI_MODEL_ID=general-image-recognition
CLARIFAI_MODEL_VERSION_ID=your_clarifai_model_version_id

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# OpenWeather
WEATHER_API_KEY=your_openweather_api_key
```

Client‑side config (gitignored): copy `digital wardrobe/config.example.js` → `digital wardrobe/config.js` and fill:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_UPLOAD_PRESET`
- Optional Firebase keys

---

## Available NPM Scripts

If `package.json` contains scripts (add as needed):
```json
{
  "scripts": {
    "start": "node \"digital wardrobe/server.js\"",
    "dev": "nodemon \"digital wardrobe/server.js\""
  }
}
```

---

## API Endpoints (Express Server)

- POST `/api/outfit-by-occasion`
  - Body: `{ occasion: string, notes?: string, wardrobe: Array<Item> }`
  - Returns: `{ reasoning, outfit|items, type }`

- POST `/api/weather-outfit`
  - Body: `{ city: string, wardrobe: Array<Item> }`
  - Returns: `{ weather, outfit, reasoning, type }`

- POST `/api/pair-item`
  - Body: `{ baseItem: string, wardrobe: Array<Item> }`
  - Returns: `{ reasoning, suggested_ids, type, items? }`

- POST `/api/detect-clothing`
  - Body: `{ imageUrl: string }`
  - Returns: `{ category, top_concepts }`

`Item` example:
```json
{ "id": "12", "category": "shirt", "color": "blue", "tags": "casual,cotton" }
```

---

## Optional: Python FastAPI Service

Directory: `cloth detection/`

Recommended environment:
```powershell
python -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## Security and Secrets

- All secrets are externalized. Do not commit `.env` or `digital wardrobe/config.js`.
- `.gitignore` already excludes `.env*`, `env.*`, and `digital wardrobe/config.js`.
- If any keys were previously exposed, rotate them at the provider immediately and update local files.

---

## Troubleshooting

- CORS errors during local testing: the server enables permissive CORS for dev; ensure you are calling `http://localhost:4000`.
- 429 from Gemini: the server auto‑retries; if it persists, slow down requests or check quota.
- Weather not found: verify city name and your `WEATHER_API_KEY`.
- Clarifai errors: check your `CLARIFAI_*` values and model configuration.

---

## License

MIT © 2026 Divyank Seervi
