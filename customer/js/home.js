document.addEventListener('DOMContentLoaded', () => {
    const categoryLinks = document.querySelectorAll('.category-link');
    const dishCategories = document.querySelectorAll('.dish-category');
    const volatileElements = document.querySelectorAll('.volatile-float');
    const ctaBtn = document.querySelector('.cta-btn');

    function setActiveCategory(category) {
        // Update Filter Links
        categoryLinks.forEach(link => {
            if (link.dataset.category === category) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Update Dish Grids
        dishCategories.forEach(container => {
            if (container.dataset.category === category) {
                container.classList.remove('hidden');
                container.classList.add('active-category');
                // Ensure proper display property if hidden class doesn't fully cover it or for explicit override
                container.style.display = 'grid';
            } else {
                container.classList.add('hidden');
                container.classList.remove('active-category');
                container.style.display = 'none';
            }
        });

        // Update Volatile/Decoration Elements
        volatileElements.forEach(el => {
            // Check if element has a specific category assigned
            if (el.dataset.category) {
                if (el.dataset.category === category) {
                    el.classList.remove('hidden');
                    el.style.display = 'block';
                } else {
                    el.classList.add('hidden');
                    el.style.display = 'none';
                }
            }
        });
    }

    // Attach Click Event Listeners
    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // Good practice even for spans if they act as buttons
            const category = link.dataset.category;
            setActiveCategory(category);
        });
    });

    // Initialize state based on the element with 'active' class in HTML
    const activeLink = document.querySelector('.category-link.active');
    if (activeLink) {
        // Trigger initial state to ensure consistency
        setActiveCategory(activeLink.dataset.category);
    } else {
        // Default to main if no active class found
        setActiveCategory('main');
    }

    // Smooth scroll to footer on Explore Now click
    if (ctaBtn) {
        ctaBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const footerEl = document.querySelector('.site-footer');
            if (footerEl) {
                footerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                // Footer might be injected after DOMContentLoaded; retry shortly
                setTimeout(() => {
                    const f2 = document.querySelector('.site-footer');
                    if (f2) f2.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 200);
            }
        });
    }
});
