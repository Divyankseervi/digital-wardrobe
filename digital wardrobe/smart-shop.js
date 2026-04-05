import { supabase } from "./supabase.js";
import { getCurrentUser } from "./auth.js";

const analyzeBtn = document.getElementById("analyzeBtn");
const resultSection = document.getElementById("resultSection");
const currentCountEl = document.getElementById("currentCount");
const recGrid = document.getElementById("recGrid");
const statusText = document.getElementById("statusText");

const API_BASE_URL = "http://localhost:4000";

function buildShoppingLinks(name, category) {
  const query = `${name}`.trim();
  const encoded = encodeURIComponent(query);
  const encodedMyntra = encodeURIComponent(query).replace(/%20/g, "-");

  return {
    amazon: `https://www.amazon.in/s?k=${encoded}`,
    flipkart: `https://www.flipkart.com/search?q=${encoded}`,
    myntra: `https://www.myntra.com/${encodedMyntra}`,
    ajio: `https://www.ajio.com/search/?text=${encoded}`,
  };
}

function getFormalityBadgeClass(formality) {
  const f = (formality || "").toLowerCase();
  if (f === "formal") return "formality-badge--formal";
  if (f === "semi-formal") return "formality-badge--semi-formal";
  return "formality-badge--casual";
}

function renderSkeletons() {
  recGrid.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    recGrid.innerHTML += `
      <div class="rec-card rec-card--skeleton">
        <div class="skeleton-line skeleton-line--short"></div>
        <div class="skeleton-line skeleton-line--long"></div>
        <div class="skeleton-line skeleton-line--medium"></div>
        <div class="skeleton-line skeleton-line--long"></div>
        <div class="skeleton-line skeleton-line--short"></div>
      </div>
    `;
  }
}

function animateCounter(el, target) {
  let current = 0;
  const step = Math.max(1, Math.floor(target / 30));
  const interval = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(interval);
    }
    el.textContent = current;
  }, 30);
}

function renderResults(data) {
  // Current outfit count
  animateCounter(currentCountEl, data.current_outfit_count || 0);

  // Recommendation cards
  recGrid.innerHTML = "";

  if (!data.recommendations || data.recommendations.length === 0) {
    recGrid.innerHTML = `
      <div class="card" style="grid-column:1/-1; text-align:center; padding:2rem;">
        <p style="color: var(--text-secondary);">No recommendations available. Add more items to your wardrobe first.</p>
      </div>`;
    return;
  }

  data.recommendations.forEach((rec, i) => {
    const links = buildShoppingLinks(rec.name, rec.category);
    const badgeClass = getFormalityBadgeClass(rec.formality);
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉";

    const card = document.createElement("div");
    card.className = "rec-card";
    card.style.animationDelay = `${i * 0.15}s`;

    card.innerHTML = `
      <div class="rec-card__rank">${medal} #${i + 1} Pick</div>
      <div class="rec-card__name">${rec.name}</div>
      <div class="rec-card__meta">
        <span class="rec-card__category">${rec.category}</span>
        <span class="rec-card__color-dot" style="background:${rec.color?.toLowerCase() || '#888'};"></span>
        <span>${rec.color}</span>
        <span class="formality-badge ${badgeClass}" style="font-size:0.7rem; padding:0.15rem 0.5rem;">${rec.formality}</span>
      </div>
      <div class="rec-card__impact">
        <div class="impact-label">Impact Score</div>
        <div class="impact-value">+${rec.impact_score}</div>
        <div class="impact-bar">
          <div class="impact-bar__fill" style="width:${Math.min(100, (rec.impact_score / (data.recommendations[0]?.impact_score || 1)) * 100)}%;"></div>
        </div>
        <div class="impact-detail">${rec.new_outfit_count} total outfits possible</div>
      </div>
      <div class="rec-card__reason">${rec.reason}</div>
      <div class="rec-card__links">
        <a href="${links.amazon}" target="_blank" rel="noopener" class="shop-link shop-link--amazon">Amazon</a>
        <a href="${links.flipkart}" target="_blank" rel="noopener" class="shop-link shop-link--flipkart">Flipkart</a>
        <a href="${links.myntra}" target="_blank" rel="noopener" class="shop-link shop-link--myntra">Myntra</a>
        <a href="${links.ajio}" target="_blank" rel="noopener" class="shop-link shop-link--ajio">Ajio</a>
      </div>
    `;
    recGrid.appendChild(card);
  });
}

analyzeBtn.addEventListener("click", async () => {
  analyzeBtn.disabled = true;
  analyzeBtn.textContent = "🔍 Analyzing Wardrobe...";
  statusText.textContent = "Loading your wardrobe & running AI simulation...";
  resultSection.classList.add("show");
  currentCountEl.textContent = "—";
  renderSkeletons();

  try {
    // Load wardrobe from Supabase with a timeout
    statusText.textContent = "Connecting to database...";

    const supabasePromise = supabase.from("clothes").select("*").eq('user_id', (await getCurrentUser())?.id);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("SUPABASE_TIMEOUT")), 15000)
    );

    let wardrobe, error;
    try {
      const result = await Promise.race([supabasePromise, timeoutPromise]);
      wardrobe = result.data;
      error = result.error;
    } catch (timeoutErr) {
      if (timeoutErr.message === "SUPABASE_TIMEOUT") {
        throw new Error("SUPABASE_TIMEOUT");
      }
      throw timeoutErr;
    }

    if (error) throw new Error(`Database error: ${error.message}`);

    if (!wardrobe || wardrobe.length === 0) {
      recGrid.innerHTML = `
        <div class="card" style="grid-column:1/-1; text-align:center; padding:2rem;">
          <p style="color: var(--text-secondary);">Your wardrobe is empty. Add items first to get smart recommendations.</p>
          <a href="add.html" class="primary-button" style="margin-top:1rem; text-decoration:none;">Add Item</a>
        </div>`;
      statusText.textContent = "No items found in your wardrobe.";
      return;
    }

    statusText.textContent = `Found ${wardrobe.length} items. AI is simulating outfit combinations (this may take 15-30s)...`;

    // Call smart-shop API
    const response = await fetch(`${API_BASE_URL}/api/smart-shop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wardrobe }),
    });

    const result = await response.json();
    console.log("Smart Shop Result:", result);

    if (result.error) {
      throw new Error(result.error);
    }

    statusText.textContent = `Analysis complete! Your wardrobe has ${result.current_outfit_count} outfit combinations.`;
    renderResults(result);
  } catch (err) {
    console.error("Smart Shop Error:", err);

    let errorTitle = err.message;
    let errorHint = "Make sure the Node.js server is running on localhost:4000";

    if (err.message === "SUPABASE_TIMEOUT" || err.message.includes("Failed to fetch")) {
      errorTitle = "Could not connect to the database (Supabase)";
      errorHint = "Your Supabase project may be paused or your network may be blocking the connection. Try refreshing the page or check your Supabase dashboard.";
    }

    recGrid.innerHTML = `
      <div class="card" style="grid-column:1/-1; text-align:center; padding:2rem;">
        <p style="color: #ef4444; font-size:1rem;">⚠️ ${errorTitle}</p>
        <p style="color: var(--text-muted); margin-top:0.5rem; font-size:0.85rem;">
          ${errorHint}
        </p>
        <button onclick="location.reload()" class="ghost-button" style="margin-top:1rem;">🔄 Retry</button>
      </div>`;
    statusText.textContent = "Error occurred. Please try again.";
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = "🧠 Analyze My Wardrobe";
  }
});
