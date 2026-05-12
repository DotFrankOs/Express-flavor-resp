import { authService } from '../auth/authService.js';
import { cartService } from '../cart/cartService.js';
import { restaurantService } from '../restaurants/restaurantService.js';
import { statsService } from '../stats/statsService.js';
import { menuService } from '../menu/menuService.js';

document.addEventListener('DOMContentLoaded', async () => {
    if (!authService.isLoggedIn()) {
        window.location.href = "index.html";
    }

    const currentUser = authService.getCurrentUser();
    if (currentUser) {
        const userNameEl = document.getElementById('current-user-name');
        if (userNameEl) userNameEl.textContent = currentUser.name || currentUser.user;
    }

    cartService.cleanupOldCarts();

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => authService.logout());
    }

    const listContainer = document.getElementById('restaurant-list');
    if (!listContainer) return;

    try {
        const restaurants = await restaurantService.getAll();
        listContainer.innerHTML = '';

        for (const r of restaurants) {
            // Cargar top items y menú para este restaurante
            const topItems = await statsService.getTopItems(r.id, 2);
            const menuItems = await menuService.getMenu(r.id);
            
            // Enriquecer top items con datos completos del menú
            const enrichedTopItems = topItems.map(top => {
                const menuItem = menuItems.find(m => m.id === top.itemId);
                return {
                    ...top,
                    ...(menuItem || {})
                };
            });

            const card = document.createElement('restaurant-card');
            card.setAttribute('type', r.type);
            card.setAttribute('name', r.name);
            card.setAttribute('logo', r.logo);
            card.setAttribute('description', r.description);
            card.setAttribute('url', r.url);
            card.setAttribute('top-items', JSON.stringify(enrichedTopItems));
            listContainer.appendChild(card);
        }
    } catch (err) {
        console.error('Error cargando restaurantes:', err);
        listContainer.innerHTML = '<p class="error">Error al cargar restaurantes. Intenta más tarde.</p>';
    }
});