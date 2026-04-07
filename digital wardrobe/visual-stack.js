/**
 * visual-stack.js
 * Shared logic for rendering sorted outfit stacks.
 * Layout: Tops + Jackets side-by-side → Bottoms → Shoes
 */

/**
 * Show a skeleton shimmer loader while AI is generating
 */
export function showOutfitLoader(containerElement) {
    if (!containerElement) return;

    const skeletonCard = `
    <div class="outfit-card outfit-card--skeleton">
      <div class="skeleton skeleton--img"></div>
      <div class="outfit-card__details">
        <div class="skeleton skeleton--text skeleton--text-lg"></div>
        <div class="skeleton skeleton--text skeleton--text-sm"></div>
      </div>
    </div>
  `;

    containerElement.innerHTML = `
    <div class="outfit-composition">
      <h3 class="outfit-composition__title">
        <span class="loader-dot-pulse"></span> AI is styling your outfit...
      </h3>
      <div class="outfit-stack">
        <div class="outfit-row outfit-row--upper">
          ${skeletonCard}
          ${skeletonCard}
        </div>
        <div class="outfit-row">
          ${skeletonCard}
        </div>
        <div class="outfit-row">
          ${skeletonCard}
        </div>
      </div>
    </div>
  `;
}


// Category groups
// 0: Headwear
// 1: Outerwear (Jacket, Coat, Blazer, Hoodie, Cardigan) — shown BESIDE tops
// 2: Tops (Shirt, T-Shirt, Top, Blouse, Tee, Sweater, Polo) — main top row
// 3: Bottoms (Pant, Jeans, Trouser, Short, Skirt, Leggings, Joggers)
// 4: Shoes (Shoe, Sneaker, Boot, Sandal, Heel, Loafer)
// 5: Accessories / Other

function getCategoryGroup(category) {
    if (!category) return 5;
    const c = category.toLowerCase();

    if (c.includes("hat") || c.includes("cap") || c.includes("beanie")) return 0;
    if (c.includes("jacket") || c.includes("coat") || c.includes("blazer") || c.includes("hoodie") || c.includes("cardigan")) return 1;
    if (c.includes("shirt") || c.includes("top") || c.includes("tee") || c.includes("blouse") || c.includes("sweater") || c.includes("polo") || c.includes("tank") || c.includes("vest") || c.includes("kurta") || c.includes("jersey")) return 2;
    if (c.includes("pant") || c.includes("jean") || c.includes("trouser") || c.includes("short") || c.includes("skirt") || c.includes("legging") || c.includes("jogger") || c.includes("chino") || c.includes("lower")) return 3;
    if (c.includes("shoe") || c.includes("sneaker") || c.includes("boot") || c.includes("sandal") || c.includes("heel") || c.includes("loafer") || c.includes("trainer") || c.includes("flat") || c.includes("flip")) return 4;

    return 5;
}

function renderItemCard(item) {
    // Text-only base item (typed manually)
    if (item.text && !item.image_url) {
        return `
      <div class="outfit-card outfit-card--base">
        <div class="outfit-card__icon">🔒</div>
        <div class="outfit-card__details">
          <strong>${item.text}</strong>
          <span class="outfit-card__label">Your Base Item</span>
        </div>
      </div>`;
    }

    const imgUrl = item.image_url || "https://via.placeholder.com/150?text=No+Image";
    const isBase = item.isBase;

    return `
    <div class="outfit-card ${isBase ? 'outfit-card--base' : ''}">
      <div class="outfit-card__img">
        <img src="${imgUrl}" alt="${item.category || ''}" loading="lazy">
      </div>
      <div class="outfit-card__details">
        <strong>${item.color || ''} ${item.category || ''}</strong>
        ${isBase ? '<span class="outfit-card__label">Base Item</span>' : ''}
        ${item.tags ? `<span class="outfit-card__tags">${item.tags}</span>` : ''}
      </div>
    </div>
  `;
}

export function renderOutfitStack(items, containerElement, reasoningText = "") {
    if (!containerElement) return;

    if (!items || items.length === 0) {
        containerElement.innerHTML = `
        <div class="outfit-composition">
          <h3 class="outfit-composition__title">🤔 No Outfit Found</h3>
          <p class="outfit-composition__reasoning">${reasoningText || "AI couldn't build a complete outfit from your current wardrobe. Try adding more items (tops, bottoms, shoes) to get better results."}</p>
        </div>`;
        return;
    }

    // Group items by category
    const headwear = [];
    const outerwear = []; // jackets — shown beside tops
    const tops = [];
    const bottoms = [];
    const shoes = [];
    const other = [];

    items.forEach(item => {
        const cat = item.category || item.text || "";
        const group = getCategoryGroup(cat);
        switch (group) {
            case 0: headwear.push(item); break;
            case 1: outerwear.push(item); break;
            case 2: tops.push(item); break;
            case 3: bottoms.push(item); break;
            case 4: shoes.push(item); break;
            default: other.push(item); break;
        }
    });

    // Build rows
    let rowsHtml = '';

    // Row 0: Headwear (if any)
    if (headwear.length > 0) {
        rowsHtml += `<div class="outfit-row">${headwear.map(renderItemCard).join('')}</div>`;
    }

    // Row 1: Tops + Outerwear side by side
    if (tops.length > 0 || outerwear.length > 0) {
        rowsHtml += `<div class="outfit-row outfit-row--upper">`;
        rowsHtml += tops.map(renderItemCard).join('');
        rowsHtml += outerwear.map(renderItemCard).join('');
        rowsHtml += `</div>`;
    }

    // Row 2: Bottoms
    if (bottoms.length > 0) {
        rowsHtml += `<div class="outfit-row">${bottoms.map(renderItemCard).join('')}</div>`;
    }

    // Row 3: Shoes
    if (shoes.length > 0) {
        rowsHtml += `<div class="outfit-row">${shoes.map(renderItemCard).join('')}</div>`;
    }

    // Row 4: Other / Accessories
    if (other.length > 0) {
        rowsHtml += `<div class="outfit-row">${other.map(renderItemCard).join('')}</div>`;
    }

    containerElement.innerHTML = `
    <div class="outfit-composition">
      <h3 class="outfit-composition__title">✨ Tailored Outfit</h3>
      ${reasoningText ? `<p class="outfit-composition__reasoning">"${reasoningText}"</p>` : ''}
      <div class="outfit-stack">
        ${rowsHtml}
      </div>
    </div>
  `;
}
