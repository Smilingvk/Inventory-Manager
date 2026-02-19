/**
 * Inventory Renderer Module
 * Functions for creating and injecting HTML elements into the DOM
 */

import { convertAndFormat, getCurrencySymbol } from './currencyLogic.js';
import { isInQuote } from './storage.js';

/**
 * Render product grid
 * @param {Array} products - Array of products
 * @param {string} currency - Current currency
 * @param {Object} exchangeRates - Exchange rates
 * @param {Function} onAddToQuote - Callback for add to quote button
 * @param {Function} onProductClick - Callback for product click
 */
export function renderProducts(products, currency, exchangeRates, onAddToQuote, onProductClick) {
    const gridElement = document.getElementById('productGrid');
    const loadingElement = document.getElementById('loadingSpinner');
    const noResultsElement = document.getElementById('noResults');
    
    // Hide loading spinner
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    
    // Clear existing products
    gridElement.innerHTML = '';
    
    // Show no results message if empty
    if (products.length === 0) {
        noResultsElement.style.display = 'block';
        return;
    }
    
    noResultsElement.style.display = 'none';
    
    // Create product cards
    products.forEach(product => {
        const card = createProductCard(product, currency, exchangeRates, onAddToQuote, onProductClick);
        gridElement.appendChild(card);
    });
}

/**
 * Create a product card element
 * @param {Object} product - Product data
 * @param {string} currency - Current currency
 * @param {Object} exchangeRates - Exchange rates
 * @param {Function} onAddToQuote - Callback for add to quote button
 * @param {Function} onProductClick - Callback for product click
 * @returns {HTMLElement} Product card element
 */
function createProductCard(product, currency, exchangeRates, onAddToQuote, onProductClick) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const inQuote = isInQuote(product.id);
    const formattedPrice = convertAndFormat(product.price, currency, exchangeRates);
    const stars = generateStars(product.rating?.rate || 0);
    
    card.innerHTML = `
        <div class="product-image-container">
            <img 
                src="${product.image}" 
                alt="${escapeHtml(product.title)}"
                class="product-image"
                loading="lazy"
            >
        </div>
        <div class="product-category">${escapeHtml(product.category)}</div>
        <h3 class="product-title">${escapeHtml(product.title)}</h3>
        <p class="product-description">${escapeHtml(product.description)}</p>
        <div class="product-rating">
            <span class="stars">${stars}</span>
            <span class="rating-count">(${product.rating?.count || 0})</span>
        </div>
        <div class="product-footer">
            <span class="product-price">${formattedPrice}</span>
            <button 
                class="btn-add-quote" 
                data-product-id="${product.id}"
                ${inQuote ? 'disabled' : ''}
            >
                ${inQuote ? 'In Quote' : 'Add to Quote'}
            </button>
        </div>
    `;
    
    // Add click handler for product details
    card.addEventListener('click', (e) => {
        // Don't open modal if clicking the add to quote button
        if (!e.target.classList.contains('btn-add-quote')) {
            onProductClick(product);
        }
    });
    
    // Add click handler for add to quote button
    const addButton = card.querySelector('.btn-add-quote');
    addButton.addEventListener('click', (e) => {
        e.stopPropagation();
        onAddToQuote(product);
    });
    
    return card;
}

/**
 * Render category filters
 * @param {Array} categories - Array of category strings
 * @param {string} activeCategory - Currently active category
 * @param {Function} onCategoryClick - Callback for category click
 */
export function renderCategoryFilters(categories, activeCategory, onCategoryClick) {
    const container = document.getElementById('categoryFilters');
    
    // Clear existing filters (except "All Products" button)
    container.innerHTML = `
        <button class="category-btn ${activeCategory === 'all' ? 'active' : ''}" data-category="all">
            All Products
        </button>
    `;
    
    // Add category buttons
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = `category-btn ${activeCategory === category ? 'active' : ''}`;
        button.dataset.category = category;
        button.textContent = category;
        
        button.addEventListener('click', () => onCategoryClick(category));
        
        container.appendChild(button);
    });
}

/**
 * Update product count display
 * @param {number} count - Number of products
 * @param {number} total - Total number of products
 */
export function updateProductCount(count, total) {
    const countElement = document.getElementById('productCount');
    
    if (countElement) {
        countElement.textContent = `Showing ${count} of ${total} products`;
    }
}

/**
 * Render quote list
 * @param {Array} quoteItems - Array of products in quote
 * @param {string} currency - Current currency
 * @param {Object} exchangeRates - Exchange rates
 * @param {Function} onRemove - Callback for remove button
 */
export function renderQuoteList(quoteItems, currency, exchangeRates, onRemove) {
    const desktopList = document.getElementById('quoteList');
    const mobileList = document.getElementById('mobileQuoteList');
    
    const content = quoteItems.length === 0
        ? '<p class="empty-quote">No items in quote yet</p>'
        : quoteItems.map(item => createQuoteItem(item, currency, exchangeRates, onRemove)).join('');
    
    desktopList.innerHTML = content;
    mobileList.innerHTML = content;
    
    // Update button visibility
    updateQuoteButtons(quoteItems.length > 0);
}

/**
 * Create quote item HTML
 * @param {Object} item - Product item
 * @param {string} currency - Current currency
 * @param {Object} exchangeRates - Exchange rates
 * @param {Function} onRemove - Callback for remove button
 * @returns {string} HTML string
 */
function createQuoteItem(item, currency, exchangeRates, onRemove) {
    const formattedPrice = convertAndFormat(item.price, currency, exchangeRates);
    
    const div = document.createElement('div');
    div.className = 'quote-item';
    div.innerHTML = `
        <div class="quote-item-header">
            <div class="quote-item-title">${escapeHtml(item.title)}</div>
            <button class="btn-remove-quote" data-product-id="${item.id}">×</button>
        </div>
        <div class="quote-item-price">${formattedPrice}</div>
    `;
    
    // Add remove handler
    const removeBtn = div.querySelector('.btn-remove-quote');
    removeBtn.addEventListener('click', () => onRemove(item.id));
    
    return div.outerHTML;
}

/**
 * Update quote buttons visibility
 * @param {boolean} hasItems - Whether quote has items
 */
function updateQuoteButtons(hasItems) {
    const elements = [
        'clearQuoteBtn',
        'exportQuoteBtn',
        'clearQuoteBtnMobile',
        'exportQuoteBtnMobile'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = hasItems ? 'block' : 'none';
        }
    });
}

/**
 * Update quote total display
 * @param {number} total - Total amount
 * @param {string} currency - Current currency
 */
export function updateQuoteTotal(total, currency) {
    const symbol = getCurrencySymbol(currency);
    const formattedTotal = `${symbol}${total.toFixed(currency === 'JPY' ? 0 : 2)}`;
    
    const desktopTotal = document.getElementById('quoteTotal');
    const mobileTotal = document.getElementById('mobileQuoteTotal');
    
    if (desktopTotal) desktopTotal.textContent = formattedTotal;
    if (mobileTotal) mobileTotal.textContent = formattedTotal;
}

/**
 * Update quote badge count
 * @param {number} count - Number of items in quote
 */
export function updateQuoteBadge(count) {
    const badge = document.getElementById('quoteCount');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

/**
 * Generate star rating HTML
 * @param {number} rating - Rating value (0-5)
 * @returns {string} HTML string with stars
 */
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '★'.repeat(fullStars);
    if (hasHalfStar) stars += '⯨';
    stars += '☆'.repeat(emptyStars);
    
    return stars;
}

/**
 * Show product detail modal
 * @param {Object} product - Product data
 * @param {string} currency - Current currency
 * @param {Object} exchangeRates - Exchange rates
 * @param {Function} onAddToQuote - Callback for add to quote
 */
export function showProductModal(product, currency, exchangeRates, onAddToQuote) {
    const modal = document.getElementById('productModal');
    const modalBody = document.getElementById('modalBody');
    
    const formattedPrice = convertAndFormat(product.price, currency, exchangeRates);
    const stars = generateStars(product.rating?.rate || 0);
    const inQuote = isInQuote(product.id);
    
    modalBody.innerHTML = `
        <img 
            src="${product.image}" 
            alt="${escapeHtml(product.title)}"
            class="modal-product-image"
        >
        <div class="modal-product-category">${escapeHtml(product.category)}</div>
        <h2 class="modal-product-title">${escapeHtml(product.title)}</h2>
        <div class="modal-product-rating">
            <span class="stars">${stars}</span>
            <span>${product.rating?.rate || 0} / 5</span>
            <span class="rating-count">(${product.rating?.count || 0} reviews)</span>
        </div>
        <p class="modal-product-description">${escapeHtml(product.description)}</p>
        <div class="modal-product-footer">
            <span class="modal-product-price">${formattedPrice}</span>
            <button 
                class="btn-add-quote" 
                id="modalAddToQuote"
                ${inQuote ? 'disabled' : ''}
                style="font-size: 1.1rem; padding: 1rem 2rem;"
            >
                ${inQuote ? 'Already in Quote' : 'Add to Quote'}
            </button>
        </div>
    `;
    
    // Add event listener for add to quote button
    const addButton = document.getElementById('modalAddToQuote');
    if (addButton && !inQuote) {
        addButton.addEventListener('click', () => {
            onAddToQuote(product);
            hideProductModal();
        });
    }
    
    modal.classList.add('active');
}

/**
 * Hide product detail modal
 */
export function hideProductModal() {
    const modal = document.getElementById('productModal');
    modal.classList.remove('active');
}

/**
 * Show loading state
 */
export function showLoading() {
    const loadingElement = document.getElementById('loadingSpinner');
    if (loadingElement) {
        loadingElement.style.display = 'flex';
    }
}

/**
 * Hide loading state
 */
export function hideLoading() {
    const loadingElement = document.getElementById('loadingSpinner');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
export function showError(message) {
    const gridElement = document.getElementById('productGrid');
    gridElement.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--danger-color);">
            <h2>⚠️ Error</h2>
            <p>${escapeHtml(message)}</p>
            <button onclick="location.reload()" class="btn-primary" style="margin-top: 1rem; display: inline-block;">
                Retry
            </button>
        </div>
    `;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Scroll to top of page
 */
export function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Update all product card buttons
 * @param {Array} quoteItems - Current quote items
 */
export function updateProductCardButtons(quoteItems) {
    const quoteIds = quoteItems.map(item => item.id);
    
    document.querySelectorAll('.btn-add-quote').forEach(button => {
        const productId = parseInt(button.dataset.productId);
        const inQuote = quoteIds.includes(productId);
        
        button.disabled = inQuote;
        button.textContent = inQuote ? 'In Quote' : 'Add to Quote';
    });
}