import { supabase } from "./supabase.js";
import { getCurrentUser } from "./auth.js";

export async function loadClothes() {
  const user = await getCurrentUser();
  if (!user) return;

  const { data: clothes, error } = await supabase.from('clothes').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

  if (error) {
    console.error("Error loading clothes:", error);
    return;
  }

  const grid = document.getElementById("wardrobeGrid");
  if (!grid) return;

  grid.innerHTML = "";

  clothes.forEach((item) => {
    let lastWornText = "Never worn";
    if (item.last_worn_date) {
      const d = new Date(item.last_worn_date);
      lastWornText = `Last Worn: ${d.toLocaleDateString()}`;
    }

    grid.innerHTML += `
      <article class="item-card" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div class="item-image">
            <img src="${item.image_url}" />
          </div>
          <div class="item-meta">
            <div class="item-category" style="font-weight: 600;">${item.category ?? ""}</div>
            <div class="item-color">Color: ${item.color ?? ""}</div>
            <div class="item-tags">Tags: ${item.tags ?? ""}</div>
            <div class="item-last-worn" style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.5rem;">${lastWornText} (${item.times_worn || 0}x)</div>
          </div>
        </div>
        <div style="padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
          <button class="primary-button" type="button" onclick="markWorn('${item.id}')">Mark as Worn</button>
          <div style="display:flex; gap:0.5rem;">
            <button class="ghost-button" style="flex:1; padding: 0.5rem;" type="button" onclick="editItem('${item.id}')">Edit</button>
            <button class="ghost-button" style="flex:1; padding: 0.5rem; color: #ef4444;" type="button" onclick="deleteItem('${item.id}')">Delete</button>
          </div>
        </div>
      </article>
    `;
  });
}

window.markWorn = async function (id) {
  const { data: item } = await supabase.from('clothes').select('times_worn').eq('id', id).single();
  if (item) {
    const now = new Date().toISOString();
    await supabase.from('clothes').update({ 
      times_worn: (item.times_worn || 0) + 1,
      last_worn_date: now
    }).eq('id', id);
    loadClothes();
  }
};

window.editItem = async function (id) {
  // Simple prompt-based edit
  const { data: item } = await supabase.from('clothes').select('*').eq('id', id).single();
  if (!item) return;

  const newCat = prompt("Edit Category:", item.category || "");
  if (newCat === null) return;
  
  const newColor = prompt("Edit Color:", item.color || "");
  if (newColor === null) return;

  const newTags = prompt("Edit Tags (comma separated):", item.tags || "");
  if (newTags === null) return;

  await supabase.from('clothes').update({
    category: newCat,
    color: newColor,
    tags: newTags
  }).eq('id', id);

  loadClothes();
};

window.deleteItem = async function (id) {
  if (confirm("Are you sure you want to delete this item?")) {
    await supabase.from('clothes').delete().eq('id', id);
    loadClothes();
  }
};
