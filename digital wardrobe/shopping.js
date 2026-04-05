import { supabase } from "./supabase.js";

const budgetFilter = document.getElementById("budgetFilter");
const recalcBtn = document.getElementById("recalcBtn");
const shoppingGrid = document.getElementById("shoppingGrid");
const emptyMessage = document.getElementById("shoppingEmptyMessage");

async function loadClothes() {
  const { data, error } = await supabase.from('clothes').select('*');
  if (error) {
    console.error("Error loading clothes:", error);
    return [];
  }
  return data;
}

function isDarkColor(color = "") {
  const text = color.toLowerCase();
  return ["black", "navy", "dark", "brown", "maroon", "charcoal"].some((word) =>
    text.includes(word)
  );
}

function hasTag(item, tag) {
  return (item.tags || "").toLowerCase().includes(tag);
}

function applyBudgetToQuery(baseQuery, budget) {
  if (budget === "budget") return `${baseQuery} budget`;
  if (budget === "premium") return `${baseQuery} premium branded`;
  // mid-range → leave base query as-is, "all" → as-is
  return baseQuery;
}

function buildShoppingLinks(searchTerm) {
  const encoded = encodeURIComponent(searchTerm);
  const encodedForMyntra = encodeURIComponent(searchTerm).replace(/%20/g, "-");

  return {
    amazon: `https://www.amazon.in/s?k=${encoded}`,
    flipkart: `https://www.flipkart.com/search?q=${encoded}`,
    myntra: `https://www.myntra.com/${encodedForMyntra}`,
    ajio: `https://www.ajio.com/search/?text=${encoded}`,
  };
}

function buildSuggestionsFromWardrobe(items, budget) {
  const suggestions = [];

  const jacketMissing = !items.some((i) => (i.category || "").toLowerCase() === "jacket");
  const shirts = items.filter((i) => (i.category || "").toLowerCase() === "shirt");
  const pants = items.filter((i) => (i.category || "").toLowerCase() === "pant");
  const shoes = items.filter((i) => (i.category || "").toLowerCase() === "shoes");

  const totalItems = items.length;

  // 1. No jackets
  if (jacketMissing) {
    const q = applyBudgetToQuery("men winter jacket", budget);
    suggestions.push({
      title: "Winter Jacket",
      reason: "You don’t have any jackets saved. A good jacket keeps you ready for cold and travel days.",
      query: q,
    });
  }

  // 2. Fewer shirts than pants
  if (shirts.length && pants.length && shirts.length < pants.length) {
    const q = applyBudgetToQuery("men casual shirt", budget);
    suggestions.push({
      title: "Casual Shirts",
      reason: "You own more pants than shirts. A few extra shirts will give you more outfit combos.",
      query: q,
    });
  }

  // 3. Shoes heavily used
  if (shoes.length) {
    const avgTimesWorn =
      shoes.reduce((sum, i) => sum + (i.times_worn || 0), 0) / shoes.length;
    if (avgTimesWorn > 15) {
      const q = applyBudgetToQuery("men everyday sneakers", budget);
      suggestions.push({
        title: "New Footwear",
        reason: "Your shoes are used a lot. Rotating an extra pair will increase comfort and durability.",
        query: q,
      });
    }
  }

  // 4. Mostly dark colors
  if (totalItems > 0) {
    const darkCount = items.filter((i) => isDarkColor(i.color)).length;
    if (darkCount / totalItems > 0.7) {
      const q = applyBudgetToQuery("men light colored clothes", budget);
      suggestions.push({
        title: "Light-colored Clothes",
        reason:
          "Most of your wardrobe is dark. Adding some lighter pieces will balance your outfits and work better in summers.",
        query: q,
      });
    }
  }

  // 5. No winter tag
  const hasWinterTag = items.some((i) => hasTag(i, "winter"));
  if (!hasWinterTag && totalItems > 0) {
    const q = applyBudgetToQuery("men winter wear", budget);
    suggestions.push({
      title: "Winter Wear",
      reason: "You don’t have anything tagged winter. Consider adding sweaters, hoodies or thermals.",
      query: q,
    });
  }

  // 6. No formal tag
  const hasFormalTag = items.some((i) => hasTag(i, "formal"));
  if (!hasFormalTag && totalItems > 0) {
    const q = applyBudgetToQuery("men formal outfit", budget);
    suggestions.push({
      title: "Formal Outfit",
      reason:
        "There are no items tagged formal. A basic shirt–trouser–shoes combo helps for interviews and office.",
      query: q,
    });
  }

  // 7. Dominant single category
  if (totalItems > 0) {
    const byCategory = {};
    for (const item of items) {
      const cat = (item.category || "other").toLowerCase();
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    }
    const entries = Object.entries(byCategory);
    const [topCat, topCount] = entries.reduce(
      (best, cur) => (cur[1] > best[1] ? cur : best),
      ["other", 0]
    );

    if (topCount / totalItems > 0.7 && entries.length > 1) {
      const q = applyBudgetToQuery("men wardrobe essentials", budget);
      suggestions.push({
        title: "Balance Your Wardrobe",
        reason: `Most of your items are ${topCat}s. Adding a mix of shirts, pants, shoes and jackets will give you more outfit options.`,
        query: q,
      });
    }
  }

  return suggestions;
}

function renderSuggestions(suggestions) {
  shoppingGrid.innerHTML = "";

  if (!suggestions.length) {
    emptyMessage.textContent = "Your wardrobe is well balanced!";
    return;
  }

  emptyMessage.textContent = "";

  suggestions.forEach((sugg) => {
    const links = buildShoppingLinks(sugg.query);

    const card = document.createElement("article");
    card.className = "item-card";

    card.innerHTML = `
      <div class="item-meta">
        <div class="item-category">${sugg.title}</div>
        <div class="item-color" style="margin-top:0.25rem;">${sugg.reason}</div>
      </div>
      <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-top:0.6rem;">
        <a class="secondary-button" href="${links.amazon}" target="_blank" rel="noopener noreferrer">Amazon</a>
        <a class="secondary-button" href="${links.flipkart}" target="_blank" rel="noopener noreferrer">Flipkart</a>
        <a class="secondary-button" href="${links.myntra}" target="_blank" rel="noopener noreferrer">Myntra</a>
        <a class="secondary-button" href="${links.ajio}" target="_blank" rel="noopener noreferrer">Ajio</a>
      </div>
    `;

    shoppingGrid.appendChild(card);
  });
}

async function calculateAndRender() {
  try {
    shoppingGrid.innerHTML = "";
    emptyMessage.textContent = "Analyzing your wardrobe...";

    const items = await loadClothes();
    if (!items.length) {
      emptyMessage.textContent =
        "Your wardrobe is empty. Add a few items first to get shopping suggestions.";
      return;
    }

    const budget = budgetFilter?.value || "all";
    const suggestions = buildSuggestionsFromWardrobe(items, budget);
    renderSuggestions(suggestions);
  } catch (err) {
    console.error(err);
    emptyMessage.textContent = "Could not load suggestions. Check console.";
  }
}

if (recalcBtn) {
  recalcBtn.addEventListener("click", calculateAndRender);
}

// initial load
calculateAndRender();

