import { supabase } from "./supabase.js";
import { getCurrentUser } from "./auth.js";

export async function loadClothes() {
  const user = await getCurrentUser();
  if (!user) return;

  const { data: clothes, error } = await supabase.from('clothes').select('*').eq('user_id', user.id);

  if (error) {
    console.error("Error loading clothes:", error);
    return;
  }

  const grid = document.getElementById("wardrobeGrid");
  if (!grid) return;

  grid.innerHTML = "";

  clothes.forEach((item) => {
    grid.innerHTML += `
      <article class="item-card">
        <div class="item-image">
          <img src="${item.image_url}" />
        </div>
        <div class="item-meta">
          <div class="item-category">${item.category ?? ""}</div>
          <div class="item-color">Color: ${item.color ?? ""}</div>
          <div class="item-tags">Tags: ${item.tags ?? ""}</div>
        </div>
        <button class="secondary-button" type="button" onclick="markWorn('${item.id}')">Mark as Worn</button>
      </article>
    `;
  });
}

window.markWorn = async function (id) {
  const { data: item } = await supabase.from('clothes').select('times_worn').eq('id', id).single();

  if (item) {
    await supabase.from('clothes').update({ times_worn: (item.times_worn || 0) + 1 }).eq('id', id);
    loadClothes();
  }
};
