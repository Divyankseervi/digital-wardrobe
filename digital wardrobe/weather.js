import { supabase } from "./supabase.js";
import { renderOutfitStack, showOutfitLoader } from "./visual-stack.js";
import { getCurrentUser } from "./auth.js";

const cityInput = document.getElementById("cityInput");
const weatherBtn = document.getElementById("weatherBtn");
const weatherResult = document.getElementById("weatherResult");

const API_BASE_URL = "http://localhost:4000";

async function loadWardrobe() {
  const user = await getCurrentUser();
  if (!user) return [];
  const { data, error } = await supabase.from('clothes').select('*').eq('user_id', user.id);
  if (error) {
    console.error("Error loading wardrobe:", error);
    return [];
  }
  return data;
}

if (weatherBtn) {
  weatherBtn.addEventListener("click", async () => {
    try {
      const city = cityInput.value.trim();
      if (!city) {
        alert("Please enter a city name.");
        return;
      }

      showOutfitLoader(weatherResult);

      // Load wardrobe from Firestore
      const wardrobe = await loadWardrobe();

      // Call server endpoint with wardrobe data
      const response = await fetch(`${API_BASE_URL}/api/weather-outfit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: city,
          wardrobe: wardrobe,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        weatherResult.innerHTML = `<div class='card'>${errorData.error}</div>`;
        return;
      }

      const data = await response.json();

      if (!data.outfit || (Array.isArray(data.outfit) && data.outfit.length === 0) || typeof data.outfit === 'string') {
        weatherResult.innerHTML = `<div class='card' style='padding:1.5rem;'><p style="color:var(--text-secondary);">${data.message || data.outfit || "No outfit could be generated."}</p></div>`;
        return;
      }

      // Use shared stack renderer
      // Weather response has 'message' which acts as reasoning/title
      // We can wrap it in a container if needed, but renderOutfitStack handles its own container.
      // But weatherResult might need clearing first if we append? It replaces innerHTML in the function.
      renderOutfitStack(data.outfit, weatherResult, data.reasoning || data.message || `Outfit for ${data.weather.temp}°C`);

    } catch (err) {
      console.error(err);
      weatherResult.innerHTML = "<div class='card'>AI Stylist encountered an error. Check console.</div>";
    }
  });
}

