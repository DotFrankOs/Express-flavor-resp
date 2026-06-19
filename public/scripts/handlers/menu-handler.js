import { authService } from '../auth/authService.js';
import { restaurantService } from '../restaurants/restaurantService.js';
import { menuService } from '../menu/menuService.js';

function getRestaurantIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('restaurant') || 'burgers';
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!authService.isLoggedIn()) {
        window.location.href = "index.html";
    }

    const restaurantId = getRestaurantIdFromUrl();
    
    try {
        const restaurant = await restaurantService.getById(restaurantId);
        if (!restaurant) throw new Error('Restaurante no encontrado');

        document.getElementById('restaurant-name').textContent = restaurant.name;
        const logoEl = document.getElementById('restaurant-logo');
        logoEl.src = restaurant.logo;
        logoEl.alt = `Logo ${restaurant.name}`;
        document.body.classList.add(`restaurant-${restaurantId}`);

        const menuItems = await menuService.getMenu(restaurantId);
        const menuList = document.getElementById('menu-list');
        menuList.innerHTML = '';

        if (menuItems.length === 0) {
            menuList.innerHTML = '<p class="empty">No hay productos disponibles.</p>';
        } else {
            menuItems.forEach(item => {
                const menuItemEl = document.createElement('menu-item');
                menuItemEl.setAttribute('restaurant-id', restaurantId);
                menuItemEl.setAttribute('restaurant-name', restaurant.name);
                menuItemEl.item = item;
                menuList.appendChild(menuItemEl);
            });
        }

        const resContainer = document.getElementById('reservation-container');
        if (resContainer) {
            resContainer.innerHTML = '';
            const resGrid = document.createElement('reservation-grid');
            resGrid.setAttribute('restaurant-id', restaurantId);
            resGrid.setAttribute('min-duration', restaurant.minDuration);
            resGrid.setAttribute('max-duration', restaurant.maxDuration);
            resContainer.appendChild(resGrid);
        }

    } catch (err) {
        console.error('Error cargando menú:', err);
        document.getElementById('menu-list').innerHTML = '<p class="error">Error al cargar el menú.</p>';
    }
});