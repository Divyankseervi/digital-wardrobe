import { supabase } from "./supabase.js";
import { renderOutfitStack, showOutfitLoader } from "./visual-stack.js";
import { getCurrentUser } from "./auth.js";

const baseItemInput = document.getElementById("baseItemInput");
const pairBtn = document.getElementById("pairBtn");
const pairResult = document.getElementById("pairResult");
const openWardrobeBtn = document.getElementById("openWardrobeBtn");
const wardrobeModal = document.getElementById("wardrobeModal");
const closeModal = document.getElementById("closeModal");
const modalGrid = document.getElementById("modalGrid");
const selectedPreview = document.getElementById("selectedPreview");
const selectedImage = document.getElementById("selectedImage");
const selectedDetails = document.getElementById("selectedDetails");
const clearSelection = document.getElementById("clearSelection");

const API_BASE_URL = "http://localhost:4000";

let wardrobeCache = [];

// --- Wardrobe Loading & Modal Logic ---

async function loadWardrobeForModal() {
  if (wardrobeCache.length > 0) {
    renderModalItems(wardrobeCache);
    return;
  }

  const user = await getCurrentUser();
  if (!user) return;

  const { data, error } = await supabase.from('clothes').select('*').eq('user_id', user.id);
  if (error) {
    console.error("Error loading wardrobe:", error);
    modalGrid.innerHTML = `<p style="grid-column:1/-1; color:red;">Failed to load items.</p>`;
    return;
  }

  wardrobeCache = data || [];
  renderModalItems(wardrobeCache);
}

function renderModalItems(items) {
  modalGrid.innerHTML = "";
  if (items.length === 0) {
    modalGrid.innerHTML = `<p style="text-align:center; grid-column:1/-1; padding:2rem; color:#64748b;">No items found in your wardrobe.</p>`;
    return;
  }

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "select-card";

    // Fallback if no image
    const imgUrl = item.image_url || "https://via.placeholder.com/150?text=No+Image";

    card.innerHTML = `
      <div class="item-image" style="width:100%; aspect-ratio:1; overflow:hidden; border-radius:8px;">
        <img src="${imgUrl}" alt="${item.category}" loading="lazy" style="width:100%; height:100%; object-fit:cover;">
      </div>
      <div style="font-weight:600; font-size:0.95rem; color:#0f172a; margin-bottom:0.1rem;">${item.category}</div>
      <div style="font-size:0.8rem; color:#64748b;">${item.color}</div>
    `;

    card.onclick = () => selectItem(item, card);
    modalGrid.appendChild(card);
  });
}

function selectItem(item, cardElement) {
  // Visual Feedback
  document.querySelectorAll('.select-card').forEach(c => c.classList.remove('selected'));
  cardElement.classList.add('selected');

  // Short delay to let user see selection
  setTimeout(() => {
    wardrobeModal.classList.remove("active");

    // Fill input and show preview
    baseItemInput.value = `${item.color} ${item.category}`; // Hidden or used as prompt

    selectedImage.src = item.image_url || "https://via.placeholder.com/150";
    selectedDetails.textContent = `${item.color} ${item.category}`;
    selectedPreview.style.display = "flex";
  }, 150);
}

// --- Event Listeners ---

openWardrobeBtn.addEventListener("click", () => {
  wardrobeModal.classList.add("active");
  loadWardrobeForModal();
});

closeModal.addEventListener("click", () => {
  wardrobeModal.classList.remove("active");
});

window.addEventListener("click", (e) => {
  if (e.target === wardrobeModal) {
    wardrobeModal.classList.remove("active");
  }
});

clearSelection.addEventListener("click", () => {
  selectedPreview.style.display = "none";
  baseItemInput.value = "";
});

// --- AI Logic ---

pairBtn.addEventListener("click", async () => {
  const baseItem = baseItemInput.value.trim();
  if (!baseItem) {
    alert("Please enter an item or select one from your wardrobe.");
    return;
  }

  pairBtn.textContent = "Asking AI...";
  pairBtn.disabled = true;
  showOutfitLoader(pairResult);

  try {
    // 1. Get wardrobe
    const user = await getCurrentUser();
    const { data: wardrobe, error } = await supabase.from('clothes').select('*').eq('user_id', user.id);
    if (error) throw error;

    console.log("--- Pair Item: Wardrobe loaded, items:", wardrobe.length);

    // 2. Call API
    const response = await fetch(`${API_BASE_URL}/api/pair-item`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseItem, wardrobe }),
    });

    const result = await response.json();
    console.log("--- Pair Item: Server response:", result);

    if (result.error) {
      pairResult.innerHTML = `<div style="color:red; font-weight:500;">Error: ${result.error}</div>`;
    } else if (result.type === "visual") {
      // Visual Stack Logic
      renderVisualOutfit(baseItem, result.suggested_ids, result.reasoning, result.items);
    } else {
      // Fallback Text Logic
      const lines = (result.pairing || "").split('\n').filter(l => l.trim().length > 0);
      const html = lines.map(line => `
        <div style="margin-bottom:0.4rem; padding-left:1rem; position:relative;">
          <span style="position:absolute; left:0; color:#4f46e5;">•</span>
          ${line.replace(/\*\*/g, '<strong>').replace(/\*/g, '')}
        </div>
      `).join("");

      pairResult.innerHTML = `
        <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:12px; padding:1rem; margin-top:1rem;">
          <h3 style="font-size:1rem; color:#0369a1; margin-bottom:0.5rem;">AI Suggestion:</h3>
          ${html}
        </div>
      `;
    }

  } catch (err) {
    console.error(err);
    pairResult.textContent = "Failed to get suggestions. Make sure the server is running.";
  } finally {
    pairBtn.textContent = "Complete My Look";
    pairBtn.disabled = false;
  }
});

function renderVisualOutfit(baseItemQuery, suggestedIds, reasoning, allItems) {
  console.log("--- renderVisualOutfit called ---");
  console.log("Suggested IDs from server:", suggestedIds);
  console.log("All items count:", allItems ? allItems.length : 0);

  // 1. Identify Base Item Object
  let baseObj = null;

  if (selectedPreview.style.display !== "none") {
    const currentSrc = selectedImage.src;
    const currentDetails = selectedDetails.textContent;
    baseObj = {
      id: "base_visual",
      image_url: currentSrc,
      category: currentDetails.split(" ").slice(1).join(" "),
      details: currentDetails,
      isBase: true
    };
  } else {
    baseObj = {
      id: "base_text",
      text: baseItemQuery,
      category: "unknown",
      isBase: true
    };
  }

  // 2. Get Suggested Item Objects — use String() to handle int/string ID mismatch
  const stringIds = suggestedIds.map(String);
  const suggestedItems = allItems.filter(item => stringIds.includes(String(item.id)));

  console.log("Matched suggested items:", suggestedItems.length);
  if (suggestedItems.length === 0) {
    console.warn("No items matched! IDs:", stringIds, "vs wardrobe IDs:", allItems.map(i => i.id));
  }

  // 3. Merge
  const outfit = [baseObj, ...suggestedItems];

  // 4. Render using shared visual stack
  renderOutfitStack(outfit, pairResult, reasoning);
}
