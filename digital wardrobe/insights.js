import { supabase } from "./supabase.js";
import { getCurrentUser } from "./auth.js";

export async function loadMostWorn() {
  const grid = document.getElementById("mostWornGrid");
  if (!grid) return;

  const user = await getCurrentUser();
  if (!user) return;

  const { data: clothes, error } = await supabase
    .from('clothes')
    .select('*')
    .eq('user_id', user.id)
    .order('times_worn', { ascending: false })
    .limit(3);

  if (error) {
    console.error("Error loading most worn items:", error);
    return;
  }

  grid.innerHTML = "";
  clothes.forEach((item) => {
    grid.innerHTML += `
      <article class="item-card">
        <div class="item-image">
          <img src="${item.image_url}" alt="Most worn item" />
        </div>
        <div class="item-meta">
          <div class="item-category">${item.category ?? ""}</div>
          <div class="item-color">Worn: ${item.times_worn ?? 0} times</div>
        </div>
      </article>
    `;
  });
}
