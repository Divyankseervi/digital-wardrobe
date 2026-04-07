import { supabase } from "./supabase.js";
import { getCurrentUser } from "./auth.js";

export async function loadInsights() {
  const user = await getCurrentUser();
  if (!user) return;

  const { data: clothes, error } = await supabase
    .from('clothes')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error("Error loading clothes for insights:", error);
    return;
  }

  // 1. Total Items
  const totalCountEl = document.getElementById("totalItemsCount");
  if (totalCountEl) totalCountEl.textContent = clothes.length;

  // 2. Category Chart
  const ctx = document.getElementById('categoryChart');
  if (ctx && clothes.length > 0) {
    const categoryCounts = clothes.reduce((acc, item) => {
      const cat = (item.category || "other").toLowerCase();
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    const labels = Object.keys(categoryCounts).map(l => l.charAt(0).toUpperCase() + l.slice(1));
    const data = Object.values(categoryCounts);

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          label: 'Items',
          data: data,
          backgroundColor: [
            '#6366f1', // Indigo
            '#ec4899', // Pink
            '#14b8a6', // Teal
            '#f59e0b', // Amber
            '#8b5cf6', // Purple
            '#64748b'  // Slate
          ],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        plugins: {
          legend: { position: 'bottom' }
        },
        cutout: '60%'
      }
    });
  }

  // 3. Most Worn
  const mostWornGrid = document.getElementById("mostWornGrid");
  if (mostWornGrid) {
    const mostWorn = [...clothes].sort((a, b) => (b.times_worn || 0) - (a.times_worn || 0)).slice(0, 3);
    mostWornGrid.innerHTML = mostWorn.map(item => createSmallCard(item, `Worn: ${item.times_worn || 0} times`)).join('');
  }

  // 4. Forgotten Items (Not worn in 30 days)
  const forgottenGrid = document.getElementById("forgottenItemsGrid");
  if (forgottenGrid) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const forgotten = clothes.filter(item => {
      // If we have a last_worn_date, check if it's older than 30 days
      if (item.last_worn_date) {
        return new Date(item.last_worn_date) < thirtyDaysAgo;
      }
      // If no last_worn_date, check if created_at is older than 30 days
      if (item.created_at) {
        return new Date(item.created_at) < thirtyDaysAgo;
      }
      // Fallback
      return item.times_worn === 0;
    }).slice(0, 4); // Show top 4 forgotten items

    if (forgotten.length === 0) {
      forgottenGrid.innerHTML = `<p style="grid-column: 1/-1; color: var(--text-secondary);">You're wearing all your clothes regularly! Awesome!</p>`;
    } else {
      forgottenGrid.innerHTML = forgotten.map(item => {
        let text = "Never worn";
        if (item.last_worn_date) {
           const days = Math.floor((new Date() - new Date(item.last_worn_date)) / (1000 * 60 * 60 * 24));
           text = `Not worn in ${days} days`;
        }
        return createSmallCard(item, text);
      }).join('');
    }
  }
}

function createSmallCard(item, subtext) {
  return `
    <article class="item-card" style="padding-bottom: 1rem;">
      <div class="item-image" style="height: 150px;">
        <img src="${item.image_url}" alt="Item" />
      </div>
      <div class="item-meta" style="padding: 0.5rem 1rem 0;">
        <div class="item-category" style="font-size:0.9rem;">${item.category ?? ""}</div>
        <div class="item-color" style="font-size:0.8rem;">${subtext}</div>
      </div>
    </article>
  `;
}
