import { supabase } from "./supabase.js";
import { renderOutfitStack, showOutfitLoader } from "./visual-stack.js";
import { getCurrentUser } from "./auth.js";

const occasionSelect = document.getElementById("occasionSelect");
const occasionNotes = document.getElementById("occasionNotes");
const occasionBtn = document.getElementById("occasionBtn");
const occasionResult = document.getElementById("occasionResult");

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

if (occasionBtn) {
  occasionBtn.addEventListener("click", async () => {
    try {
      const occasion = occasionSelect.value;
      const notes = occasionNotes.value.trim();

      if (!occasion) {
        alert("Please select an occasion.");
        return;
      }

      showOutfitLoader(occasionResult);

      // Load wardrobe from Firestore
      const wardrobe = await loadWardrobe();

      if (wardrobe.length === 0) {
        occasionResult.innerText = "Your wardrobe is empty. Add items first.";
        return;
      }

      // Call server endpoint with wardrobe data
      const response = await fetch(`${API_BASE_URL}/api/outfit-by-occasion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occasion: occasion,
          notes: notes,
          wardrobe: wardrobe,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        occasionResult.innerText = `Error: ${errorData.error}`;
        return;
      }

      const data = await response.json();

      if (data.type === "visual") {
        renderOutfitStack(data.outfit, occasionResult, data.reasoning);
      } else {
        occasionResult.innerText = data.outfit;
      }
    } catch (err) {
      console.error(err);
      occasionResult.innerText = "AI stylist had an error. Check console.";
    }
  });
}

