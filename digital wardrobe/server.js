import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// 🔐 API Keys
const CLARIFAI_API_KEY = process.env.CLARIFAI_API_KEY || "";
const CLARIFAI_USER_ID = process.env.CLARIFAI_USER_ID || "";
const CLARIFAI_APP_ID = process.env.CLARIFAI_APP_ID || "";
const CLARIFAI_MODEL_ID = process.env.CLARIFAI_MODEL_ID || "general-image-recognition";
const CLARIFAI_MODEL_VERSION_ID = process.env.CLARIFAI_MODEL_VERSION_ID || "";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || "";

app.use(
  cors({
    origin: true, // Reflect request origin — allows any local dev setup (Live Server, file://, etc.)
  })
);

app.use(express.json());

// ✨ Helper function to call Gemini API (with auto-retry on rate limit)
async function callGemini(prompt, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      // Handle HTTP-level errors (429, 500, etc)
      if (!res.ok) {
        const errBody = await res.text();
        console.error(`Gemini HTTP ${res.status} (attempt ${attempt}/${retries}):`, errBody.slice(0, 300));
        if (res.status === 429 && attempt < retries) {
          const waitSec = attempt * 10;
          console.log(`Rate limited. Waiting ${waitSec}s before retry...`);
          await new Promise(r => setTimeout(r, waitSec * 1000));
          continue;
        }
        throw new Error(`Gemini HTTP ${res.status}`);
      }

      const data = await res.json();

      // Handle API-level errors (429 inside 200 response)
      if (data.error) {
        console.error(`Gemini API error in body (attempt ${attempt}/${retries}):`, data.error.message || JSON.stringify(data.error).slice(0, 300));
        if (data.error.code === 429 && attempt < retries) {
          const waitSec = attempt * 10;
          console.log(`Rate limited (body). Waiting ${waitSec}s before retry...`);
          await new Promise(r => setTimeout(r, waitSec * 1000));
          continue;
        }
        throw new Error(data.error.message || "Gemini API error");
      }

      // Safety check 1: candidates exist
      if (!data.candidates || data.candidates.length === 0) {
        console.error("Gemini returned no candidates:", JSON.stringify(data).slice(0, 300));
        if (attempt < retries) {
          console.log(`No candidates. Waiting 5s before retry...`);
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }
        throw new Error("Gemini returned no candidates");
      }

      const candidate = data.candidates[0];

      // Safety check 2: candidate has content
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        console.error("Gemini candidate has no content. Finish reason:", candidate.finishReason);
        throw new Error("Gemini returned empty content");
      }

      const parts = candidate.content.parts;

      // Find the last part with text (handles thinking models)
      let textContent = "";
      for (let i = parts.length - 1; i >= 0; i--) {
        if (parts[i].text && parts[i].text.trim().length > 0) {
          textContent = parts[i].text.trim();
          break;
        }
      }

      if (!textContent) {
        throw new Error("Gemini returned no text content");
      }

      console.log(`Gemini OK (attempt ${attempt}), text length: ${textContent.length}`);
      return textContent;

    } catch (err) {
      console.error(`Gemini attempt ${attempt}/${retries} failed:`, err.message);
      if (attempt === retries) throw err;
    }
  }
}




// 🎯 Outfit by Occasion - Server Side
app.post("/api/outfit-by-occasion", async (req, res) => {
  try {
    const { occasion, notes, wardrobe } = req.body;

    if (!occasion) {
      return res.status(400).json({ error: "Occasion is required" });
    }

    if (!wardrobe || wardrobe.length === 0) {
      return res.json({
        outfit: "Your wardrobe is empty. Add items first.",
        items: [],
      });
    }

    // Format wardrobe for AI
    const wardrobeJson = `[${wardrobe
      .map(
        (i) =>
          `{"id":"${i.id}","category":"${i.category}","color":"${i.color}","tags":"${i.tags}"}`
      )
      .join(",")}]`;

    const prompt = `
You are a professional fashion stylist.
The user wants an outfit for this occasion: "${occasion}".
Extra notes (if any): "${notes}".

Here is their wardrobe as JSON: ${wardrobeJson}
Each item has: id, category, color, and tags.

Pick a complete outfit (top, bottom, shoes, optional jacket) using ONLY items from this wardrobe.
Ensure style fits the occasion and colors match.

Respond ONLY with a valid JSON object in this format:
{
  "reasoning": "Short text explaining why this works for the occasion.",
  "suggested_ids": ["id1", "id2", "id3"] 
}
    `;

    let aiText = await callGemini(prompt);
    console.log("--- Occasion Request ---");
    console.log("Raw AI Response:", aiText);

    aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();

    let result = {};
    try {
      result = JSON.parse(aiText);
    } catch (e) {
      console.error("AI JSON Parse Error:", aiText);
      // Valid JSON failure backup
      return res.json({ outfit: aiText, items: wardrobe, type: "text" });
    }

    // Populate items — use String() to handle int/string ID mismatch
    const stringIds = result.suggested_ids.map(String);
    const suggestedItems = wardrobe.filter(item => stringIds.includes(String(item.id)));
    console.log("Occasion - Found Items:", suggestedItems.length, "out of", result.suggested_ids.length, "suggested IDs");

    return res.json({
      reasoning: result.reasoning,
      outfit: suggestedItems,
      type: "visual",
      items: wardrobe,
    });
  } catch (err) {
    console.error("Error in outfit-by-occasion:", err);
    return res.status(500).json({ error: "Server error processing outfit request" });
  }
});

// 🌦 Weather Outfit - Server Side
app.post("/api/weather-outfit", async (req, res) => {
  try {
    const { city, wardrobe } = req.body;

    if (!city) {
      return res.status(400).json({ error: "City is required" });
    }

    // 1. Fetch weather data
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        city
      )}&appid=${WEATHER_API_KEY}&units=metric`
    );

    if (!weatherRes.ok) {
      return res.status(404).json({ error: "City not found" });
    }

    const weatherData = await weatherRes.json();
    const temp = weatherData.main.temp;
    const condition = weatherData.weather[0].main;

    if (!wardrobe || wardrobe.length === 0) {
      return res.json({
        weather: { temp, condition, city },
        outfit: "Your wardrobe is empty! Add items first.",
        items: [],
      });
    }

    // 3. Format wardrobe data
    const wardrobeContext = wardrobe
      .map(
        (i) =>
          `{"id": "${i.id}", "category": "${i.category}", "color": "${i.color}", "tags": "${i.tags}"}`
      )
      .join(",\n");

    // 4. Build prompt
    const prompt = `
You are an elite fashion stylist. 
The current weather is ${temp}°C and ${condition}.
Here is the user's available wardrobe: [${wardrobeContext}]

Rules:
1. Weather-Appropriate: Pick items for ${temp}°C and ${condition}.
2. Color/Style Match: Ensure harmony.
3. Select exactly ONE top, ONE bottom, and ONE pair of shoes (Jacket optional).

Respond ONLY with a valid JSON object:
{
  "reasoning": "Explain why this outfit fits the weather.",
  "suggested_ids": ["id1", "id2", "id3"]
}
    `;

    // 5. Call Gemini API
    console.log("--- Weather Outfit Request ---");
    // console.log("Prompt:", prompt); // Too long

    let aiText = await callGemini(prompt);
    console.log("Raw AI Response:", aiText);

    aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();

    let result = {};
    try {
      result = JSON.parse(aiText);
    } catch (e) {
      console.error("AI JSON Parse Error:", aiText);
      // Fallback
      return res.json({
        weather: { temp, condition, city },
        outfit: [],
        message: "AI could not generate a structured outfit."
      });
    }

    // Filter with loose equality for IDs to handle string/int number mismatches
    const outfit = wardrobe.filter((item) => result.suggested_ids.map(String).includes(String(item.id)));
    console.log("Found Items:", outfit.length);

    return res.json({
      weather: { temp, condition, city },
      outfit: outfit,
      reasoning: result.reasoning,
      type: "visual",
      message: `Outfit curated for ${temp}°C (${condition}).`,
    });
  } catch (err) {
    console.error("Error in weather-outfit:", err);
    return res.status(500).json({ error: "Server error processing weather outfit request" });
  }
});

// 👔 Pair Item - Server Side
app.post("/api/pair-item", async (req, res) => {
  try {
    const { baseItem, wardrobe } = req.body;
    console.log("--- Pair Item Request ---");
    console.log("Base Item:", baseItem);

    if (!baseItem) {
      return res.status(400).json({ error: "baseItem is required" });
    }

    if (!wardrobe || wardrobe.length === 0) {
      return res.json({
        pairing: "Your wardrobe is empty. Add items first.",
        items: [],
      });
    }

    // Format wardrobe for AI
    const wardrobeJson = `[${wardrobe
      .map(
        (i) =>
          `{"id":"${i.id}","category":"${i.category}","color":"${i.color}","tags":"${i.tags}"}`
      )
      .join(",")}]`;

    const prompt = `
You are a fashion stylist.
The user says they will definitely wear: "${baseItem}".

Here is their wardrobe as JSON: ${wardrobeJson}
Use these items to recommend what should go with "${baseItem}".
Suggest:
- A bottom (pants/shorts/skirt) [IF base is a top]
- A top (shirt/jacket) [IF base is a bottom]
- Shoes
- Optional jacket or layer

Respond ONLY with a valid JSON object in this format:
{
  "reasoning": "Short text explaining the style choice.",
  "suggested_ids": ["id1", "id2"] 
}
Do not include the base item ID in suggested_ids if it was from the wardrobe.
    `;

    console.log("Prompt:", prompt);
    let aiText = await callGemini(prompt);
    console.log("Raw AI Response:", aiText);

    aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();

    let result = {};
    try {
      result = JSON.parse(aiText);
    } catch (e) {
      console.error("AI JSON Parse Error:", aiText);
      // Fallback or error
      return res.json({ pairing: aiText, items: wardrobe, type: "text" });
    }

    console.log("Suggested IDs:", result.suggested_ids);

    return res.json({
      reasoning: result.reasoning,
      suggested_ids: result.suggested_ids,
      type: "visual",
      items: wardrobe,
    });
  } catch (err) {
    console.error("Error in pair-item:", err);
    return res.status(500).json({ error: "Server error processing pairing request" });
  }
});

// 👕 Clothing Detection
app.post("/api/detect-clothing", async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "imageUrl is required" });
    }

    const clarifaiRes = await fetch(
      `https://api.clarifai.com/v2/models/${CLARIFAI_MODEL_ID}/versions/${CLARIFAI_MODEL_VERSION_ID}/outputs`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${CLARIFAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_app_id: {
            user_id: CLARIFAI_USER_ID,
            app_id: CLARIFAI_APP_ID,
          },
          inputs: [{ data: { image: { url: imageUrl } } }],
        }),
      }
    );

    const data = await clarifaiRes.json();

    console.log("Clarifai HTTP status:", clarifaiRes.status);
    console.log("Clarifai status object:", data.status);

    if (!clarifaiRes.ok || data.status?.code !== 10000) {
      console.error("Clarifai FULL ERROR:", data);
      return res.json({
        category: "other",
        error: "Clarifai API error",
        details: data.status || {},
      });
    }

    const conceptsRaw = data.outputs?.[0]?.data?.concepts || [];
    const concepts = conceptsRaw.map((c) => c.name.toLowerCase());

    const hasWord = (word) => concepts.some((name) => name.includes(word));

    let category = "other";
    if (hasWord("shirt") || hasWord("t-shirt") || hasWord("top")) category = "shirt";
    else if (hasWord("jacket") || hasWord("coat") || hasWord("hoodie")) category = "jacket";
    else if (hasWord("jeans") || hasWord("pant") || hasWord("trouser")) category = "pant";
    else if (hasWord("shoe") || hasWord("sneaker") || hasWord("boot")) category = "shoes";

    return res.json({
      category,
      top_concepts: conceptsRaw.slice(0, 5),
    });
  } catch (err) {
    console.error("Server detect-clothing error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// 🛍️ Smart Shopping — Wardrobe Optimizer
app.post("/api/smart-shop", async (req, res) => {
  try {
    const { wardrobe } = req.body;
    console.log("--- Smart Shop Request ---");

    if (!wardrobe || wardrobe.length === 0) {
      return res.json({
        current_outfit_count: 0,
        recommendations: [],
        message: "Your wardrobe is empty. Add items first.",
      });
    }

    // Format wardrobe for AI
    const wardrobeJson = JSON.stringify(
      wardrobe.map((i) => ({
        id: i.id,
        category: i.category,
        color: i.color,
        tags: i.tags,
      }))
    );

    const prompt = `
You are a wardrobe optimization AI. Your goal is to recommend what clothing item the user should BUY NEXT to maximize the number of valid outfit combinations they can create.

WARDROBE DATA:
${wardrobeJson}

RULES FOR VALID OUTFIT COMBINATIONS:
1. A valid outfit needs at minimum: 1 top (shirt, t-shirt, polo, hoodie, sweatshirt) + 1 bottom (jeans, trousers, pants, shorts, skirt, chinos) + 1 pair of shoes (sneakers, boots, loafers, sandals)
2. Optional: jacket, blazer, coat (adds variety but not required)
3. Formality must be compatible: casual items pair with casual/semi-formal, formal items pair with formal/semi-formal
4. Colors should be harmonious (neutrals like black, white, grey, navy go with everything; avoid clashing brights)

TASK:
1. First, count how many valid outfit combinations exist with the CURRENT wardrobe. Call this current_outfit_count.
2. Generate exactly 5 candidate items the user could buy. Focus on categories they are MISSING or have few of. Candidates should be versatile (neutral colors, widely compatible formality).
3. For EACH candidate, simulate adding it to the wardrobe and count how many valid outfits are possible. Calculate: impact_score = new_outfit_count - current_outfit_count
4. Sort by impact_score descending and return the top 3.

Respond ONLY with valid JSON:
{
  "current_outfit_count": <number>,
  "recommendations": [
    {
      "name": "White Canvas Sneakers",
      "category": "Shoes",
      "color": "White",
      "formality": "Casual",
      "impact_score": 6,
      "new_outfit_count": 18,
      "reason": "Short explanation of why this item creates the most new combos"
    }
  ]
}

Return exactly 3 recommendations sorted by highest impact_score first.
    `;

    let aiText = await callGemini(prompt);
    console.log("Smart Shop Raw AI Response:", aiText);

    aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();

    let result = {};
    try {
      result = JSON.parse(aiText);
    } catch (e) {
      console.error("Smart Shop JSON Parse Error:", aiText);
      return res.status(500).json({ error: "AI returned invalid format. Please try again." });
    }

    console.log("Smart Shop - Current outfits:", result.current_outfit_count);
    console.log("Smart Shop - Recommendations:", result.recommendations?.length);

    return res.json(result);
  } catch (err) {
    console.error("Error in smart-shop:", err);
    return res.status(500).json({ error: "Server error processing smart shop request" });
  }
});

app.listen(PORT, () => {
  console.log(`Digital Wardrobe server running at http://localhost:${PORT}`);
});

