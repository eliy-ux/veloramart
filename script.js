
    const ALL_PRODUCTS_URL = 'https://dummyjson.com/products?limit=28';

    let allProducts = [];
    let displayedProducts = [];
    let cart = JSON.parse(localStorage.getItem('shopcart_items')) || [];

    // DOM Elements
    const productGrid = document.getElementById('product-grid');
    const searchInput = document.getElementById('search-input');
    const catalogHeading = document.getElementById('catalog-heading');
    const cartTrigger = document.getElementById('cart-trigger');
    const closeDrawer = document.getElementById('close-drawer');
    const cartDrawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    const cartCount = document.getElementById('cart-count');
    const cartBody = document.getElementById('cart-body');
    const cartTotal = document.getElementById('cart-total');
    const themeToggleBtn = document.getElementById('theme-toggle');

    // 1. Theme Toggle Engine
    function initTheme() {
      const savedTheme = localStorage.getItem('shopcart_theme');
      if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggleBtn.textContent = '☀️';
      } else {
        document.body.classList.remove('dark-mode');
        themeToggleBtn.textContent = '🌙';
      }
    }

    themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('shopcart_theme', isDark ? 'dark' : 'light');
      themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
    });

    // 2. Render Loading Skeletons
    function renderSkeletons() {
      productGrid.innerHTML = Array(8).fill(0).map(() => `
        <div class="skeleton-card">
          <div class="shimmer" style="height: 160px; margin-bottom: 1rem;"></div>
          <div class="shimmer" style="height: 18px; width: 80%; margin-bottom: 0.5rem;"></div>
          <div class="shimmer" style="height: 14px; width: 40%; margin-bottom: 1rem;"></div>
          <div class="shimmer" style="height: 36px; width: 100%; border-radius: 99px;"></div>
        </div>
      `).join('');
    }

    // 3. Fetch All Products from API
    async function loadProducts() {
      renderSkeletons();
      try {
        const response = await fetch(ALL_PRODUCTS_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        allProducts = data.products;
        displayedProducts = allProducts;
        renderProducts(displayedProducts);
      } catch (error) {
        productGrid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
            <p style="color: #d9534f; font-weight: bold; margin-bottom: 1rem;">Failed to fetch product data.</p>
            <button class="btn-primary" onclick="loadProducts()">Try Again</button>
          </div>
        `;
      }
    }

    // 4. Render Product Cards
    function renderProducts(items) {
      if (items.length === 0) {
        productGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No matching products found.</p>';
        return;
      }

      productGrid.innerHTML = items.map(item => `
        <article class="product-card">
          <div class="product-img-box">
            <img src="${item.thumbnail}" alt="${item.title}" loading="lazy">
          </div>
          <div>
            <div class="product-category">${item.category}</div>
            <div class="card-header-info">
              <h3 class="product-name" title="${item.title}">${item.title}</h3>
              <span class="product-price">$${item.price.toFixed(2)}</span>
            </div>
            <div class="rating-row">
              ★★★★★ <span style="color: var(--text-muted); font-size: 0.75rem;">(${item.rating.toFixed(1)})</span>
            </div>
          </div>
          <button class="btn-add-cart" onclick="addToCart(${item.id})">Add to Cart</button>
        </article>
      `).join('');
    }

    // 5. Category Filter
    function filterCategory(category, buttonEl) {
      document.querySelectorAll('.pill-btn').forEach(btn => btn.classList.remove('active'));
      buttonEl.classList.add('active');

      if (category === 'all') {
        displayedProducts = allProducts;
        catalogHeading.textContent = 'Explore Products';
      } else {
        displayedProducts = allProducts.filter(p => p.category.toLowerCase() === category.toLowerCase());
        catalogHeading.textContent = category.charAt(0).toUpperCase() + category.slice(1);
      }
      renderProducts(displayedProducts);
    }

    // 6. Real-Time Search Filter
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const filtered = displayedProducts.filter(p => 
        p.title.toLowerCase().includes(query) || 
        p.category.toLowerCase().includes(query)
      );
      renderProducts(filtered);
    });

    // 7. Cart Management Engine
    function addToCart(id) {
      const existing = cart.find(i => i.id === id);
      if (existing) {
        existing.qty += 1;
      } else {
        const product = allProducts.find(p => p.id === id);
        cart.push({ ...product, qty: 1 });
      }
      updateCart();
      toggleDrawer(true);
    }

    function changeQty(id, delta) {
      const item = cart.find(i => i.id === id);
      if (!item) return;

      item.qty += delta;
      if (item.qty <= 0) {
        cart = cart.filter(i => i.id !== id);
      }
      updateCart();
    }

    function updateCart() {
      localStorage.setItem('shopcart_items', JSON.stringify(cart));

      const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
      cartCount.textContent = totalCount;

      if (cart.length === 0) {
        cartBody.innerHTML = '<p style="color: var(--text-muted); text-align: center; margin-top: 2rem;">Your cart is empty.</p>';
      } else {
        cartBody.innerHTML = cart.map(item => `
          <div class="cart-item">
            <img src="${item.thumbnail}" alt="${item.title}">
            <div class="cart-item-info">
              <div class="cart-item-title">${item.title}</div>
              <div class="cart-item-price">$${item.price.toFixed(2)} × ${item.qty}</div>
            </div>
            <div>
              <button class="qty-btn" onclick="changeQty(${item.id}, -1)">-</button>
              <span style="margin: 0 4px;">${item.qty}</span>
              <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
            </div>
          </div>
        `).join('');
      }

      const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
      cartTotal.textContent = `$${total.toFixed(2)}`;
    }

    // 8. Drawer UI
    function toggleDrawer(open) {
      cartDrawer.classList.toggle('open', open);
      backdrop.classList.toggle('open', open);
    }

    cartTrigger.addEventListener('click', () => toggleDrawer(true));
    closeDrawer.addEventListener('click', () => toggleDrawer(false));
    backdrop.addEventListener('click', () => toggleDrawer(false));

    // Run Initial Load
    initTheme();
    loadProducts();
    updateCart();
  