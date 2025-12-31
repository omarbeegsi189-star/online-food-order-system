import { API, Utils, Storage, STORAGE_KEYS } from './utils.js';
import { CartManager } from './cart.js';

const cartManager = new CartManager();

document.addEventListener('DOMContentLoaded', async () => {
    const user = Storage.get(STORAGE_KEYS.USER);
    if (!user) {
        // Redirect or show login prompt if needed, but menu can be public? 
        // Requirement says "After login success... Customer must enter Customer homepage".
        // Assuming menu is accessible but ordering/favorites need login.
        // But for "Add to Favorites", we definitely need user ID.
    }

    await loadMenu();
    setupFilters();
    setupSearch();
});

async function loadMenu() {
    try {
        const menuItems = await API.getMenu();
        const container = document.querySelector('.dishes-container');
        container.innerHTML = ''; // Clear static content

        // Group by category for the tabbed view or just render all and filter
        // The existing HTML uses tabs. Let's respect that structure.
        // But wait, the existing HTML has:
        // <div class="menu-grid dish-category main-dish-content active-category" data-category="main">
        // So it has separate containers or one container that filters?
        // In `menu.html`, it looks like one container `dishes-container` and inside it `menu-grid` with `data-category`.
        // I will render all items into one grid but add data-category attribute to each card, 
        // and let the filter logic hide/show them.
        
        // Re-creating the structure to match the filter logic
        // The filter logic likely expects `.dish-category` elements.
        
        // Let's create a single grid and filter items individually.
        const grid = document.createElement('div');
        grid.className = 'menu-grid active-category'; // We'll manage visibility via CSS or JS
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
        grid.style.gap = '20px';
        
        menuItems.forEach(item => {
            const card = document.createElement('div');
            card.className = 'menu-card';
            card.dataset.category = item.category.toLowerCase(); // 'dishes', 'juice', 'dessert'
            // Map DB category to HTML category keys if needed
            // DB: Dishes, Juice, Dessert
            // HTML filters: main, juices, dessert
            let categoryKey = item.category.toLowerCase();
            if (categoryKey === 'dishes') categoryKey = 'main';
            if (categoryKey === 'juice') categoryKey = 'juices';
            
            card.dataset.filterCategory = categoryKey;

            const imageUrl = item.image_url.startsWith('http') || item.image_url.startsWith('/') 
                ? item.image_url 
                : `/media/${item.image_url}`;

            card.innerHTML = `
                <div class="menu-img-wrapper">
                    <img src="${imageUrl}" alt="${item.name}" class="menu-img">
                    <button class="favorite-btn" data-id="${item.id}">🤍</button>
                </div>
                <h3>${item.name}</h3>
                <p>${item.description || ''}</p>
                <p class="menu-price">${Utils.formatPrice(item.price)}</p>
                <button class="menu-add-btn" data-id="${item.id}">Add to Cart</button>
            `;
            
            // Add event listeners
            const favBtn = card.querySelector('.favorite-btn');
            favBtn.addEventListener('click', async () => {
                const user = Storage.get(STORAGE_KEYS.USER);
                if (!user) {
                    const choice = await window.showCustomerAuthPrompt();
                    if (choice === 'login') window.location.href = 'login.html';
                    if (choice === 'signup') window.location.href = 'signup.html';
                    return;
                }
                toggleFavorite(item.id, favBtn);
            });

            const addBtn = card.querySelector('.menu-add-btn');
            addBtn.addEventListener('click', async () => {
                const user = Storage.get(STORAGE_KEYS.USER);
                if (!user) {
                    const choice = await window.showCustomerAuthPrompt();
                    if (choice === 'login') window.location.href = 'login.html';
                    if (choice === 'signup') window.location.href = 'signup.html';
                    return;
                }
                cartManager.addItem({ id: item.id, name: item.name, price: item.price, image: item.image_url });
            });

            grid.appendChild(card);
        });

        container.appendChild(grid);
        
        // Initial check for favorites to color the hearts
        checkFavorites();

    } catch (error) {
        console.error('Error loading menu:', error);
    }
}

async function checkFavorites() {
    const user = Storage.get(STORAGE_KEYS.USER);
    if (!user) return;

    try {
        const favorites = await API.getFavorites(user.id);
        const favIds = new Set(favorites.map(f => f.id));
        
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            if (favIds.has(parseInt(btn.dataset.id))) {
                btn.textContent = '❤️';
                btn.classList.add('active');
            }
        });
    } catch (error) {
        console.error('Error checking favorites:', error);
    }
}

async function toggleFavorite(menuId, btn) {
    const user = Storage.get(STORAGE_KEYS.USER);
    if (!user) {
        return;
    }

    try {
        if (btn.classList.contains('active')) {
            await API.removeFavorite(user.id, menuId);
            btn.textContent = '🤍';
            btn.classList.remove('active');
            Utils.showNotification('Removed from favorites', 'success');
        } else {
            await API.addFavorite(user.id, menuId);
            btn.textContent = '❤️';
            btn.classList.add('active');
            Utils.showNotification('Added to favorites', 'success');
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        Utils.showNotification('Failed to update favorite', 'error');
    }
}

function setupFilters() {
    const filters = document.querySelectorAll('.category-link');
    filters.forEach(filter => {
        filter.addEventListener('click', () => {
            // Remove active class from all
            filters.forEach(f => f.classList.remove('active'));
            filter.classList.add('active');

            const category = filter.dataset.category;
            const cards = document.querySelectorAll('.menu-card');
            
            cards.forEach(card => {
                if (category === 'all' || card.dataset.filterCategory === category) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

function setupSearch() {
    const searchInput = document.getElementById('menu-search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.menu-card');
        
        cards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            if (title.includes(term)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
}
