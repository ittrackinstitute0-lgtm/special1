/**
 * SPECIAL Clothing Brand - Main Application Script
 * Handles Cart, Wishlist, Modals, Quick View, Search, Toast & Interactivity
 */

// Cart & Wishlist State
let cart = JSON.parse(localStorage.getItem('special_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('special_wishlist')) || [];
let discountPercent = parseFloat(localStorage.getItem('special_discount')) || 0;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initCartDrawer();
  updateCartCounters();
  updateWishlistCounters();
  initSearch();
  initQuickViewModal();
  initNewsletterForm();
  
  // Page-specific initializers
  if (document.getElementById('featured-products-grid')) {
    renderFeaturedProducts();
  }
  if (document.getElementById('shop-products-grid')) {
    initShopPage();
  }
  if (document.getElementById('product-detail-container')) {
    initProductDetailPage();
  }
  if (document.getElementById('cart-page-container')) {
    initCartPage();
  }
});

// Save to LocalStorage
function saveCart() {
  localStorage.setItem('special_cart', JSON.stringify(cart));
  updateCartCounters();
  renderCartDrawer();
  if (document.getElementById('cart-page-container')) {
    renderCartPage();
  }
}

function saveWishlist() {
  localStorage.setItem('special_wishlist', JSON.stringify(wishlist));
  updateWishlistCounters();
}

// Update badges
function updateCartCounters() {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll('.cart-count-badge').forEach(badge => {
    badge.textContent = totalCount;
    badge.style.display = totalCount > 0 ? 'flex' : 'none';
  });
}

function updateWishlistCounters() {
  const count = wishlist.length;
  document.querySelectorAll('.wishlist-count-badge').forEach(badge => {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  });
}

// Toast Notification
function showToast(message, type = 'success') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;
  const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-info';
  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${message}</span>
  `;
  toastContainer.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);

  // Auto remove
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3200);
}

// Add To Cart
function addToCart(productId, size = null, color = null, quantity = 1, openDrawer = true) {
  const product = getProductById(productId);
  if (!product) return;

  const selectedSize = size || product.sizes[0];
  const selectedColor = color || (product.colorNames ? product.colorNames[0] : 'Default');

  const existingItemIndex = cart.findIndex(
    item => item.id === product.id && item.size === selectedSize && item.color === selectedColor
  );

  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: selectedSize,
      color: selectedColor,
      quantity: quantity
    });
  }

  saveCart();
  showToast(`Added "${product.name}" (${selectedSize}) to cart!`);

  if (openDrawer) {
    openCartDrawer();
  }
}

// Remove from Cart
function removeFromCart(index) {
  if (cart[index]) {
    const itemName = cart[index].name;
    cart.splice(index, 1);
    saveCart();
    showToast(`Removed "${itemName}" from cart`, 'info');
  }
}

// Update Cart Quantity
function updateCartQuantity(index, delta) {
  if (cart[index]) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
      removeFromCart(index);
    } else {
      saveCart();
    }
  }
}

// Toggle Wishlist
function toggleWishlist(productId, btnElement = null) {
  const product = getProductById(productId);
  if (!product) return;

  const index = wishlist.indexOf(productId);
  if (index > -1) {
    wishlist.splice(index, 1);
    showToast(`Removed from your wishlist`, 'info');
    if (btnElement) btnElement.classList.remove('active');
  } else {
    wishlist.push(productId);
    showToast(`Saved to your wishlist!`);
    if (btnElement) btnElement.classList.add('active');
  }
  saveWishlist();
  
  // Re-sync all wishlist icons on page
  document.querySelectorAll(`[data-wishlist-id="${productId}"]`).forEach(btn => {
    btn.classList.toggle('active', wishlist.includes(productId));
  });
}

// Header & Navigation
function initHeader() {
  const header = document.querySelector('.site-header');
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav-drawer');
  const mobileOverlay = document.querySelector('.mobile-overlay');
  const closeMobileNav = document.querySelector('.close-mobile-nav');

  // Sticky header scroll effect
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // Mobile menu open / close
  if (mobileToggle && mobileNav && mobileOverlay) {
    mobileToggle.addEventListener('click', () => {
      mobileNav.classList.add('active');
      mobileOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    const closeMenu = () => {
      mobileNav.classList.remove('active');
      mobileOverlay.classList.remove('active');
      document.body.style.overflow = '';
    };

    if (closeMobileNav) closeMobileNav.addEventListener('click', closeMenu);
    mobileOverlay.addEventListener('click', closeMenu);
  }
}

// Cart Drawer
function initCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-drawer-overlay');
  const openButtons = document.querySelectorAll('.open-cart-btn');
  const closeBtn = document.getElementById('close-cart-drawer');

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openCartDrawer();
    });
  });

  if (closeBtn && overlay && drawer) {
    closeBtn.addEventListener('click', closeCartDrawer);
    overlay.addEventListener('click', closeCartDrawer);
  }

  renderCartDrawer();
}

function openCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-drawer-overlay');
  if (drawer && overlay) {
    renderCartDrawer();
    drawer.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-drawer-overlay');
  if (drawer && overlay) {
    drawer.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function renderCartDrawer() {
  const listContainer = document.getElementById('cart-drawer-items');
  const subtotalEl = document.getElementById('cart-drawer-subtotal');
  const totalCountEl = document.getElementById('cart-drawer-count');
  const shippingBar = document.getElementById('free-shipping-progress');
  const shippingText = document.getElementById('shipping-text');

  if (!listContainer) return;

  if (cart.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-cart-state">
        <i class="fa-solid fa-bag-shopping empty-icon"></i>
        <h3>Your shopping bag is empty</h3>
        <p>Explore our latest elevated collection and discover your signature look.</p>
        <a href="shop.html" class="btn btn-primary" onclick="closeCartDrawer()">Start Shopping</a>
      </div>
    `;
    if (subtotalEl) subtotalEl.textContent = '$0.00';
    if (totalCountEl) totalCountEl.textContent = '(0)';
    if (shippingBar) shippingBar.style.width = '0%';
    if (shippingText) shippingText.textContent = 'Add $100.00 more to unlock FREE VIP Shipping!';
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (totalCountEl) totalCountEl.textContent = `(${totalItems})`;
  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;

  // Free shipping meter threshold $100
  const freeThreshold = 100;
  if (shippingBar && shippingText) {
    if (subtotal >= freeThreshold) {
      shippingBar.style.width = '100%';
      shippingText.innerHTML = '<span class="text-success"><i class="fa-solid fa-check"></i> Congratulations! You earned FREE VIP Express Delivery!</span>';
    } else {
      const diff = (freeThreshold - subtotal).toFixed(2);
      const pct = Math.min((subtotal / freeThreshold) * 100, 100);
      shippingBar.style.width = `${pct}%`;
      shippingText.innerHTML = `Add <strong>$${diff}</strong> more to unlock <strong>FREE VIP Shipping</strong>!`;
    }
  }

  let html = '';
  cart.forEach((item, index) => {
    html += `
      <div class="cart-drawer-item">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-details">
          <div class="cart-item-head">
            <h4 class="cart-item-title">${item.name}</h4>
            <button class="cart-item-remove" onclick="removeFromCart(${index})" title="Remove item">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
          <div class="cart-item-meta">
            <span class="badge-tag">Size: ${item.size}</span>
            <span class="badge-tag">Color: ${item.color}</span>
          </div>
          <div class="cart-item-foot">
            <div class="qty-selector-sm">
              <button onclick="updateCartQuantity(${index}, -1)" class="qty-btn-sm" aria-label="Decrease">&minus;</button>
              <span class="qty-val">${item.quantity}</span>
              <button onclick="updateCartQuantity(${index}, 1)" class="qty-btn-sm" aria-label="Increase">&plus;</button>
            </div>
            <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
          </div>
        </div>
      </div>
    `;
  });

  listContainer.innerHTML = html;
}

// Product Card HTML Generator
function generateProductCard(product) {
  const isWishlisted = wishlist.includes(product.id);
  const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
  
  return `
    <div class="product-card" data-category="${product.category}" data-id="${product.id}">
      <div class="product-image-wrap">
        <img src="${product.image}" alt="${product.name}" class="product-img primary-img" loading="lazy">
        <img src="${product.secondaryImage || product.image}" alt="${product.name}" class="product-img hover-img" loading="lazy">
        
        ${product.badge ? `<span class="product-badge">${product.badge}</span>` : (discount > 0 ? `<span class="product-badge badge-sale">-${discount}%</span>` : '')}

        <div class="product-actions-bar">
          <button class="action-btn quick-view-btn" onclick="openQuickView(${product.id})" title="Quick View">
            <i class="fa-regular fa-eye"></i>
          </button>
          <button class="action-btn wishlist-btn ${isWishlisted ? 'active' : ''}" data-wishlist-id="${product.id}" onclick="toggleWishlist(${product.id}, this)" title="Add to Wishlist">
            <i class="fa-solid fa-heart"></i>
          </button>
        </div>

        <button class="quick-add-btn" onclick="addToCart(${product.id}, null, null, 1)">
          <i class="fa-solid fa-bag-shopping"></i> Quick Add
        </button>
      </div>

      <div class="product-info">
        <div class="product-category-label">${product.category.toUpperCase()}</div>
        <h3 class="product-title">
          <a href="product.html?id=${product.id}">${product.name}</a>
        </h3>
        
        <div class="product-rating">
          <div class="stars">
            ${'<i class="fa-solid fa-star"></i>'.repeat(Math.floor(product.rating))}
            ${product.rating % 1 !== 0 ? '<i class="fa-solid fa-star-half-stroke"></i>' : ''}
          </div>
          <span class="rating-num">(${product.reviews})</span>
        </div>

        <div class="product-price-row">
          <span class="current-price">$${product.price.toFixed(2)}</span>
          ${product.originalPrice ? `<span class="old-price">$${product.originalPrice.toFixed(2)}</span>` : ''}
        </div>

        <div class="product-colors-preview">
          ${product.colors ? product.colors.map(c => `<span class="color-swatch-dot" style="background-color: ${c}"></span>`).join('') : ''}
        </div>
      </div>
    </div>
  `;
}

// Render Featured Products (Home Page)
function renderFeaturedProducts() {
  const container = document.getElementById('featured-products-grid');
  if (!container) return;

  const featured = PRODUCTS.slice(0, 8);
  container.innerHTML = featured.map(p => generateProductCard(p)).join('');
}

// Quick View Modal
function initQuickViewModal() {
  const modal = document.getElementById('quick-view-modal');
  const closeBtn = document.getElementById('close-quick-view');
  const backdrop = document.getElementById('quick-view-backdrop');

  const closeModal = () => {
    if (modal) modal.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);
}

function openQuickView(productId) {
  const product = getProductById(productId);
  if (!product) return;

  const modal = document.getElementById('quick-view-modal');
  const backdrop = document.getElementById('quick-view-backdrop');
  const content = document.getElementById('quick-view-content');

  if (!modal || !content) return;

  let selectedSize = product.sizes[0];
  let selectedColor = product.colorNames ? product.colorNames[0] : '';
  let quantity = 1;

  content.innerHTML = `
    <div class="qv-modal-grid">
      <div class="qv-image-container">
        <img id="qv-main-image" src="${product.image}" alt="${product.name}" class="qv-product-img">
        <div class="qv-thumbnails">
          <img src="${product.image}" class="qv-thumb active" onclick="switchQvImage(this, '${product.image}')" alt="thumb">
          ${product.secondaryImage ? `<img src="${product.secondaryImage}" class="qv-thumb" onclick="switchQvImage(this, '${product.secondaryImage}')" alt="thumb">` : ''}
        </div>
      </div>

      <div class="qv-details">
        <span class="qv-badge">${product.category.toUpperCase()} COLLECTION</span>
        <h2 class="qv-title">${product.name}</h2>
        
        <div class="qv-price-wrap">
          <span class="qv-price">$${product.price.toFixed(2)}</span>
          ${product.originalPrice ? `<span class="qv-old-price">$${product.originalPrice.toFixed(2)}</span>` : ''}
          <div class="qv-stock"><i class="fa-solid fa-check-circle text-success"></i> In Stock (Ships today)</div>
        </div>

        <p class="qv-description">${product.description}</p>

        <!-- Color Selector -->
        <div class="qv-option-group">
          <label class="qv-label">Color: <span id="qv-selected-color-name" class="font-medium">${selectedColor}</span></label>
          <div class="qv-colors-list">
            ${product.colors.map((c, i) => `
              <button class="qv-color-btn ${i === 0 ? 'active' : ''}" style="background-color: ${c}" 
                onclick="selectQvColor(this, '${product.colorNames[i]}')" title="${product.colorNames[i]}">
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Size Selector -->
        <div class="qv-option-group">
          <div class="flex-between">
            <label class="qv-label">Size: <span id="qv-selected-size-name" class="font-medium">${selectedSize}</span></label>
            <a href="about.html#sizing" class="size-guide-link"><i class="fa-solid fa-ruler-horizontal"></i> Sizing Guide</a>
          </div>
          <div class="qv-sizes-list">
            ${product.sizes.map((s, i) => `
              <button class="qv-size-btn ${i === 0 ? 'active' : ''}" onclick="selectQvSize(this, '${s}')">
                ${s}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Quantity & Add to Cart -->
        <div class="qv-action-row">
          <div class="qty-counter">
            <button type="button" class="qty-ctrl" onclick="adjustQvQty(-1)">&minus;</button>
            <input type="number" id="qv-qty-input" value="1" min="1" max="10" readonly>
            <button type="button" class="qty-ctrl" onclick="adjustQvQty(1)">&plus;</button>
          </div>
          <button class="btn btn-primary flex-1 btn-add-qv" onclick="submitQvAddToCart(${product.id})">
            <i class="fa-solid fa-bag-shopping"></i> Add To Bag
          </button>
          <button class="action-btn qv-wishlist-btn ${wishlist.includes(product.id) ? 'active' : ''}" 
            onclick="toggleWishlist(${product.id}, this)">
            <i class="fa-solid fa-heart"></i>
          </button>
        </div>

        <div class="qv-perks">
          <div class="qv-perk-item"><i class="fa-solid fa-truck-fast"></i> Free VIP Express Shipping over $100</div>
          <div class="qv-perk-item"><i class="fa-solid fa-rotate-left"></i> 30-Day Hassle-Free Returns & Exchanges</div>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('active');
  backdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Quick View Helpers
window.switchQvImage = function(thumbEl, src) {
  document.querySelectorAll('.qv-thumb').forEach(t => t.classList.remove('active'));
  thumbEl.classList.add('active');
  const mainImg = document.getElementById('qv-main-image');
  if (mainImg) mainImg.src = src;
};

window.selectQvColor = function(btn, colorName) {
  document.querySelectorAll('.qv-color-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const label = document.getElementById('qv-selected-color-name');
  if (label) label.textContent = colorName;
};

window.selectQvSize = function(btn, size) {
  document.querySelectorAll('.qv-size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const label = document.getElementById('qv-selected-size-name');
  if (label) label.textContent = size;
};

window.adjustQvQty = function(delta) {
  const input = document.getElementById('qv-qty-input');
  if (!input) return;
  let val = parseInt(input.value) + delta;
  if (val < 1) val = 1;
  if (val > 10) val = 10;
  input.value = val;
};

window.submitQvAddToCart = function(productId) {
  const sizeEl = document.getElementById('qv-selected-size-name');
  const colorEl = document.getElementById('qv-selected-color-name');
  const qtyInput = document.getElementById('qv-qty-input');

  const size = sizeEl ? sizeEl.textContent : 'M';
  const color = colorEl ? colorEl.textContent : 'Default';
  const qty = qtyInput ? parseInt(qtyInput.value) : 1;

  // Close Quick view modal
  const modal = document.getElementById('quick-view-modal');
  const backdrop = document.getElementById('quick-view-backdrop');
  if (modal) modal.classList.remove('active');
  if (backdrop) backdrop.classList.remove('active');
  document.body.style.overflow = '';

  addToCart(productId, size, color, qty, true);
};

// Search overlay functionality
function initSearch() {
  const searchBtn = document.querySelectorAll('.open-search-modal');
  const searchModal = document.getElementById('search-modal');
  const searchClose = document.getElementById('close-search-modal');
  const searchInput = document.getElementById('search-input-field');
  const searchResults = document.getElementById('search-live-results');

  if (!searchModal) return;

  searchBtn.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      searchModal.classList.add('active');
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        if (searchInput) searchInput.focus();
      }, 100);
    });
  });

  const closeSearch = () => {
    searchModal.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (searchClose) searchClose.addEventListener('click', closeSearch);

  if (searchInput && searchResults) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (query.length < 2) {
        searchResults.innerHTML = '<p class="search-hint">Type at least 2 characters to search our collections...</p>';
        return;
      }

      const matches = PRODUCTS.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.category.toLowerCase().includes(query) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(query)) ||
        p.description.toLowerCase().includes(query)
      );

      if (matches.length === 0) {
        searchResults.innerHTML = `
          <div class="search-no-results">
            <p>No products found matching "<strong>${query}</strong>"</p>
            <p class="search-hint">Try searching for "tee", "hoodie", "dress", "jacket" or "pants"</p>
          </div>
        `;
        return;
      }

      searchResults.innerHTML = matches.map(p => `
        <a href="product.html?id=${p.id}" class="search-result-item" onclick="document.getElementById('search-modal').classList.remove('active'); document.body.style.overflow = '';">
          <img src="${p.image}" alt="${p.name}" class="search-thumb">
          <div class="search-item-info">
            <h4>${p.name}</h4>
            <div class="search-meta">
              <span class="search-cat">${p.category.toUpperCase()}</span>
              <span class="search-price">$${p.price.toFixed(2)}</span>
            </div>
          </div>
          <i class="fa-solid fa-arrow-right search-arrow"></i>
        </a>
      `).join('');
    });
  }
}

// Newsletter Form
function initNewsletterForm() {
  const forms = document.querySelectorAll('.newsletter-form');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (input && input.value) {
        showToast('Thank you for joining SPECIAL VIP Club! Enjoy 15% off.');
        input.value = '';
      }
    });
  });
}

// Shop Page Functionality
function initShopPage() {
  const container = document.getElementById('shop-products-grid');
  const countDisplay = document.getElementById('results-count');
  const sortSelect = document.getElementById('sort-select');
  const categoryFilters = document.querySelectorAll('.category-filter-btn');
  const priceRange = document.getElementById('price-range-slider');
  const priceDisplay = document.getElementById('price-range-display');
  const clearFiltersBtn = document.getElementById('clear-filters-btn');

  let currentCategory = 'all';
  let currentMaxPrice = 300;
  let currentSort = 'featured';

  // Check URL params for category
  const urlParams = new URLSearchParams(window.location.search);
  const catParam = urlParams.get('category');
  if (catParam) {
    currentCategory = catParam;
  }

  function applyFiltersAndRender() {
    let filtered = PRODUCTS.filter(p => {
      const matchCat = currentCategory === 'all' || p.category === currentCategory || (currentCategory === 'unisex' && p.category === 'unisex');
      const matchPrice = p.price <= currentMaxPrice;
      return matchCat && matchPrice;
    });

    // Sorting
    if (currentSort === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (currentSort === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (currentSort === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (currentSort === 'new') {
      filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    }

    if (countDisplay) {
      countDisplay.textContent = `Showing ${filtered.length} products`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-shop-state">
          <i class="fa-solid fa-filter-circle-xmark"></i>
          <h3>No products match your selected filters</h3>
          <p>Try resetting the price range or changing your category selection.</p>
          <button class="btn btn-secondary mt-3" onclick="resetShopFilters()">Reset All Filters</button>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(p => generateProductCard(p)).join('');
  }

  // Bind categories
  categoryFilters.forEach(btn => {
    if (btn.dataset.category === currentCategory) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }

    btn.addEventListener('click', () => {
      categoryFilters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      applyFiltersAndRender();
    });
  });

  // Bind Price slider
  if (priceRange && priceDisplay) {
    priceRange.addEventListener('input', (e) => {
      currentMaxPrice = parseFloat(e.target.value);
      priceDisplay.textContent = `$${currentMaxPrice}`;
      applyFiltersAndRender();
    });
  }

  // Bind sort
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      applyFiltersAndRender();
    });
  }

  // Bind clear
  window.resetShopFilters = function() {
    currentCategory = 'all';
    currentMaxPrice = 300;
    currentSort = 'featured';
    if (priceRange) priceRange.value = 300;
    if (priceDisplay) priceDisplay.textContent = '$300';
    if (sortSelect) sortSelect.value = 'featured';
    categoryFilters.forEach(b => b.classList.toggle('active', b.dataset.category === 'all'));
    applyFiltersAndRender();
  };

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', window.resetShopFilters);
  }

  applyFiltersAndRender();
}

// Product Detail Page
function initProductDetailPage() {
  const container = document.getElementById('product-detail-container');
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const productId = parseInt(urlParams.get('id')) || 1;
  const product = getProductById(productId);

  if (!product) {
    container.innerHTML = `
      <div class="empty-state container text-center py-5">
        <h2>Product Not Found</h2>
        <p class="mb-4">The item you are searching for might have sold out or been archived.</p>
        <a href="shop.html" class="btn btn-primary">Return to Shop</a>
      </div>
    `;
    return;
  }

  document.title = `${product.name} | SPECIAL Official Store`;

  let selectedSize = product.sizes[0];
  let selectedColor = product.colorNames ? product.colorNames[0] : '';
  let selectedQty = 1;

  container.innerHTML = `
    <div class="product-detail-layout container">
      <!-- Breadcrumb -->
      <nav class="breadcrumb-nav">
        <a href="index.html">Home</a>
        <i class="fa-solid fa-chevron-right"></i>
        <a href="shop.html">Shop</a>
        <i class="fa-solid fa-chevron-right"></i>
        <a href="shop.html?category=${product.category}">${product.category.toUpperCase()}</a>
        <i class="fa-solid fa-chevron-right"></i>
        <span>${product.name}</span>
      </nav>

      <div class="product-detail-grid">
        <!-- Gallery -->
        <div class="pdp-gallery">
          <div class="pdp-thumbnails-col">
            <img src="${product.image}" class="pdp-thumb active" onclick="switchPdpImage(this, '${product.image}')" alt="Thumbnail 1">
            ${product.secondaryImage ? `<img src="${product.secondaryImage}" class="pdp-thumb" onclick="switchPdpImage(this, '${product.secondaryImage}')" alt="Thumbnail 2">` : ''}
          </div>
          <div class="pdp-main-image-wrap">
            <img id="pdp-active-image" src="${product.image}" alt="${product.name}" class="pdp-main-image">
            ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
          </div>
        </div>

        <!-- Info -->
        <div class="pdp-info-col">
          <div class="pdp-tag-line">SPECIAL &bull; EDITORIAL RELEASE</div>
          <h1 class="pdp-title">${product.name}</h1>

          <div class="pdp-rating-row">
            <div class="stars">
              ${'<i class="fa-solid fa-star"></i>'.repeat(Math.floor(product.rating))}
              ${product.rating % 1 !== 0 ? '<i class="fa-solid fa-star-half-stroke"></i>' : ''}
            </div>
            <span class="rating-text">${product.rating} (${product.reviews} verified reviews)</span>
          </div>

          <div class="pdp-price-row">
            <span class="pdp-price">$${product.price.toFixed(2)}</span>
            ${product.originalPrice ? `<span class="pdp-old-price">$${product.originalPrice.toFixed(2)}</span>` : ''}
            <span class="pdp-tax-note">Taxes included. Free VIP shipping above $100.</span>
          </div>

          <div class="pdp-divider"></div>

          <p class="pdp-description-text">${product.description}</p>

          <!-- Color options -->
          <div class="pdp-option-section">
            <div class="option-header">
              <span>COLOR: <strong id="pdp-color-name">${selectedColor}</strong></span>
            </div>
            <div class="color-options-row">
              ${product.colors.map((c, i) => `
                <button class="pdp-color-circle ${i === 0 ? 'active' : ''}" style="background-color: ${c}" 
                  onclick="selectPdpColor(this, '${product.colorNames[i]}')" title="${product.colorNames[i]}">
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Size options -->
          <div class="pdp-option-section">
            <div class="option-header flex-between">
              <span>SIZE: <strong id="pdp-size-name">${selectedSize}</strong></span>
              <a href="#size-modal" class="size-guide-text" onclick="alert('Standard International Fit. Model is 6\\'1 / 185cm wearing size L.')"><i class="fa-solid fa-ruler"></i> Size Guide</a>
            </div>
            <div class="size-options-row">
              ${product.sizes.map((s, i) => `
                <button class="pdp-size-pill ${i === 0 ? 'active' : ''}" onclick="selectPdpSize(this, '${s}')">
                  ${s}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Actions -->
          <div class="pdp-cta-wrap">
            <div class="qty-counter">
              <button type="button" class="qty-ctrl" onclick="adjustPdpQty(-1)">&minus;</button>
              <input type="number" id="pdp-qty-val" value="1" min="1" max="10" readonly>
              <button type="button" class="qty-ctrl" onclick="adjustPdpQty(1)">&plus;</button>
            </div>
            <button class="btn btn-primary btn-lg flex-1" onclick="handlePdpAddToCart(${product.id})">
              <i class="fa-solid fa-bag-shopping"></i> Add To Bag
            </button>
            <button class="action-btn pdp-wishlist-btn ${wishlist.includes(product.id) ? 'active' : ''}" onclick="toggleWishlist(${product.id}, this)">
              <i class="fa-solid fa-heart"></i>
            </button>
          </div>

          <!-- Guarantees Accordion -->
          <div class="pdp-features-list">
            <div class="pdp-feature-item">
              <i class="fa-solid fa-plane-departure"></i>
              <div>
                <strong>Complimentary Express Delivery</strong>
                <p>Delivered securely in 2-4 business days in our recycled luxury box.</p>
              </div>
            </div>
            <div class="pdp-feature-item">
              <i class="fa-solid fa-shield-halved"></i>
              <div>
                <strong>Ethically Sourced Materials</strong>
                <p>100% sustainable organic fibers & certified non-toxic plant dyes.</p>
              </div>
            </div>
            <div class="pdp-feature-item">
              <i class="fa-solid fa-arrows-rotate"></i>
              <div>
                <strong>30-Day Easy Returns</strong>
                <p>Try it at home. If fit isn't perfect, return or exchange anytime.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Related Products -->
      <section class="related-products-section mt-5">
        <div class="section-header text-center">
          <span class="section-subtitle">Curated Pairings</span>
          <h2 class="section-title">Complete The Look</h2>
        </div>
        <div class="products-grid mt-4" id="related-products-grid"></div>
      </section>
    </div>
  `;

  // Render related products
  const relatedGrid = document.getElementById('related-products-grid');
  if (relatedGrid) {
    const related = PRODUCTS.filter(p => p.id !== product.id).slice(0, 4);
    relatedGrid.innerHTML = related.map(p => generateProductCard(p)).join('');
  }
}

window.switchPdpImage = function(thumb, src) {
  document.querySelectorAll('.pdp-thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
  const main = document.getElementById('pdp-active-image');
  if (main) main.src = src;
};

window.selectPdpColor = function(btn, color) {
  document.querySelectorAll('.pdp-color-circle').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const label = document.getElementById('pdp-color-name');
  if (label) label.textContent = color;
};

window.selectPdpSize = function(btn, size) {
  document.querySelectorAll('.pdp-size-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const label = document.getElementById('pdp-size-name');
  if (label) label.textContent = size;
};

window.adjustPdpQty = function(delta) {
  const input = document.getElementById('pdp-qty-val');
  if (!input) return;
  let val = parseInt(input.value) + delta;
  if (val < 1) val = 1;
  if (val > 10) val = 10;
  input.value = val;
};

window.handlePdpAddToCart = function(productId) {
  const size = document.getElementById('pdp-size-name')?.textContent || 'M';
  const color = document.getElementById('pdp-color-name')?.textContent || 'Default';
  const qty = parseInt(document.getElementById('pdp-qty-val')?.value || '1');
  addToCart(productId, size, color, qty, true);
};

// Cart Page
function initCartPage() {
  renderCartPage();
}

function renderCartPage() {
  const container = document.getElementById('cart-page-container');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart-page text-center py-5">
        <i class="fa-solid fa-bag-shopping empty-icon-lg mb-3"></i>
        <h2>Your Shopping Bag Is Empty</h2>
        <p class="text-muted mb-4">You have not added any pieces to your bag yet.</p>
        <a href="shop.html" class="btn btn-primary btn-lg">Explore New Drops</a>
      </div>
    `;
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const shipping = subtotal >= 100 ? 0 : 15.00;
  const estimatedTax = (subtotal - discountAmount) * 0.08;
  const grandTotal = subtotal - discountAmount + shipping + estimatedTax;

  container.innerHTML = `
    <div class="cart-page-layout">
      <div class="cart-items-column">
        <div class="cart-table-header">
          <span>Product</span>
          <span>Price</span>
          <span>Quantity</span>
          <span>Total</span>
        </div>

        <div class="cart-items-list">
          ${cart.map((item, idx) => `
            <div class="cart-row-item">
              <div class="cart-row-product">
                <img src="${item.image}" alt="${item.name}" class="cart-row-thumb">
                <div class="cart-row-meta">
                  <h4><a href="product.html?id=${item.id}">${item.name}</a></h4>
                  <p class="text-muted">Size: ${item.size} | Color: ${item.color}</p>
                  <button class="cart-remove-link" onclick="removeFromCart(${idx})">
                    <i class="fa-solid fa-trash-can"></i> Remove
                  </button>
                </div>
              </div>

              <div class="cart-row-price">$${item.price.toFixed(2)}</div>

              <div class="cart-row-qty">
                <div class="qty-selector-sm">
                  <button onclick="updateCartQuantity(${idx}, -1)" class="qty-btn-sm">&minus;</button>
                  <span class="qty-val">${item.quantity}</span>
                  <button onclick="updateCartQuantity(${idx}, 1)" class="qty-btn-sm">&plus;</button>
                </div>
              </div>

              <div class="cart-row-total">$${(item.price * item.quantity).toFixed(2)}</div>
            </div>
          `).join('')}
        </div>

        <div class="cart-actions-bottom flex-between mt-4">
          <a href="shop.html" class="btn btn-outline"><i class="fa-solid fa-arrow-left"></i> Continue Shopping</a>
          <button class="btn btn-outline text-danger" onclick="clearFullCart()"><i class="fa-solid fa-trash"></i> Empty Bag</button>
        </div>
      </div>

      <!-- Order Summary Column -->
      <div class="cart-summary-column">
        <div class="summary-card">
          <h3 class="summary-title">Order Summary</h3>

          <!-- Coupon Input -->
          <div class="coupon-box mb-4">
            <div class="input-group">
              <input type="text" id="coupon-code-input" placeholder="Promo code (e.g. SPECIAL20)" class="form-control" value="${discountPercent > 0 ? 'SPECIAL20' : ''}">
              <button class="btn btn-secondary" onclick="applyCouponCode()">Apply</button>
            </div>
            ${discountPercent > 0 ? `<div class="coupon-success-tag"><i class="fa-solid fa-check"></i> 20% Promo Applied! <a href="#" onclick="removeCoupon(); return false;">Remove</a></div>` : ''}
          </div>

          <div class="summary-breakdown">
            <div class="summary-row">
              <span>Subtotal</span>
              <span>$${subtotal.toFixed(2)}</span>
            </div>

            ${discountPercent > 0 ? `
              <div class="summary-row text-success">
                <span>Discount (${discountPercent}%)</span>
                <span>-$${discountAmount.toFixed(2)}</span>
              </div>
            ` : ''}

            <div class="summary-row">
              <span>Estimated Shipping</span>
              <span>${shipping === 0 ? '<strong class="text-success">FREE VIP</strong>' : `$${shipping.toFixed(2)}`}</span>
            </div>

            <div class="summary-row">
              <span>Estimated Sales Tax (8%)</span>
              <span>$${estimatedTax.toFixed(2)}</span>
            </div>

            <div class="summary-divider"></div>

            <div class="summary-row summary-total">
              <span>Total</span>
              <span>$${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button class="btn btn-primary btn-block btn-lg mt-4" onclick="proceedToCheckoutModal()">
            Proceed To Checkout <i class="fa-solid fa-lock ms-2"></i>
          </button>

          <div class="secure-checkout-notes mt-3">
            <div class="note-item"><i class="fa-solid fa-shield-check"></i> Encrypted 256-Bit SSL Checkout</div>
            <div class="payment-icons-row mt-2">
              <i class="fa-brands fa-cc-visa"></i>
              <i class="fa-brands fa-cc-mastercard"></i>
              <i class="fa-brands fa-cc-apple-pay"></i>
              <i class="fa-brands fa-cc-amex"></i>
              <i class="fa-brands fa-cc-paypal"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

window.clearFullCart = function() {
  if (confirm('Are you sure you want to clear your shopping bag?')) {
    cart = [];
    saveCart();
    showToast('Your bag has been emptied', 'info');
  }
};

window.applyCouponCode = function() {
  const input = document.getElementById('coupon-code-input');
  if (!input) return;
  const code = input.value.trim().toUpperCase();
  if (code === 'SPECIAL20' || code === 'SPECIAL') {
    discountPercent = 20;
    localStorage.setItem('special_discount', '20');
    showToast('Success! 20% VIP discount applied.');
    renderCartPage();
  } else {
    showToast('Invalid promo code. Try "SPECIAL20"', 'error');
  }
};

window.removeCoupon = function() {
  discountPercent = 0;
  localStorage.removeItem('special_discount');
  showToast('Coupon removed', 'info');
  renderCartPage();
};

window.proceedToCheckoutModal = function() {
  alert('Thank you for shopping with SPECIAL!\n\nThis demo order simulator has processed your order. In production, this connects to Stripe, Shopify, or PayPal.');
  cart = [];
  discountPercent = 0;
  localStorage.removeItem('special_discount');
  saveCart();
  window.location.href = 'index.html';
};
