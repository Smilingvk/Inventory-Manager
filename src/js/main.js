/**
 * Main Application Module
 * Initializes app, coordinates event listeners, and manages state
 */

import { fetchProducts, fetchExchangeRates } from './apiService.js';
import { convertAndFormat, calculateTotal } from './currencyLogic.js';
import { Product, ProductCollection } from './product.js';
import {
    loadCurrency,
    saveCurrency,
    loadQuoteList,
    addToQuote,
    removeFromQuote,
    clearQuote,
    exportQuoteData
} from './storage.js';
import {
    applyFilters,
    extractCategories,
    debounce
} from './filterService.js';
import {
    renderProducts,
    renderCategoryFilters,
    updateProductCount,
    renderQuoteList,
    updateQuoteTotal,
    updateQuoteBadge,
    showProductModal,
    hideProductModal,
    showLoading,
    hideLoading,
    showError,
    updateProductCardButtons
} from './inventoryRenderer.js';

// Application State
const state = {
    productCollection: null,
    allProducts: [],
    filteredProducts: [],
    exchangeRates: {},
    currentCurrency: 'USD',
    filters: {
        search: '',
        category: 'all'
    },
    quoteList: []
};

/**
 * Initialize the application
 */
async function init() {
    try {
        showLoading();

        // Load saved preferences
        state.currentCurrency = loadCurrency();
        state.quoteList = loadQuoteList();

        // Set currency dropdown to saved value
        const currencySelect = document.getElementById('currencySelect');
        currencySelect.value = state.currentCurrency;

        // Fetch data from APIs
        const [productsData, exchangeRates] = await Promise.all([
            fetchProducts(),
            fetchExchangeRates()
        ]);

        // Create Product instances
        const products = productsData.map(p => new Product(p));
        state.productCollection = new ProductCollection(products);
        state.allProducts = products;
        state.filteredProducts = products;
        state.exchangeRates = exchangeRates;

        // Render initial UI
        renderUI();

        // Setup event listeners
        setupEventListeners();

        hideLoading();

        console.log('App initialized successfully');

    } catch (error) {
        console.error('Initialization error:', error);
        hideLoading();
        showError(error.message || 'Failed to load application. Please refresh the page.');
    }
}

/**
 * Render the entire UI
 */
function renderUI() {
    // Render products
    renderProducts(
        state.filteredProducts,
        state.currentCurrency,
        state.exchangeRates,
        handleAddToQuote,
        handleProductClick
    );
    
    // Render category filters
    const categories = extractCategories(state.allProducts);
    renderCategoryFilters(
        categories,
        state.filters.category,
        handleCategoryClick
    );
    
    // Update product count
    updateProductCount(state.filteredProducts.length, state.allProducts.length);
    
    // Render quote list
    renderQuoteList(
        state.quoteList,
        state.currentCurrency,
        state.exchangeRates,
        handleRemoveFromQuote
    );
    
    // Update quote total
    const total = calculateTotal(
        state.quoteList,
        state.currentCurrency,
        state.exchangeRates
    );
    updateQuoteTotal(total, state.currentCurrency);
    
    // Update quote badge
    updateQuoteBadge(state.quoteList.length);
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Currency selector
    const currencySelect = document.getElementById('currencySelect');
    currencySelect.addEventListener('change', handleCurrencyChange);
    
    // Search input with debounce
    const searchInput = document.getElementById('searchInput');
    const debouncedSearch = debounce(handleSearchInput, 300);
    searchInput.addEventListener('input', debouncedSearch);
    
    // Category filters (handled in renderCategoryFilters)
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            handleCategoryClick(button.dataset.category);
        });
    });
    
    // Clear quote button
    const clearQuoteBtn = document.getElementById('clearQuoteBtn');
    const clearQuoteBtnMobile = document.getElementById('clearQuoteBtnMobile');
    clearQuoteBtn?.addEventListener('click', handleClearQuote);
    clearQuoteBtnMobile?.addEventListener('click', handleClearQuote);
    
    // Export quote button
    const exportQuoteBtn = document.getElementById('exportQuoteBtn');
    const exportQuoteBtnMobile = document.getElementById('exportQuoteBtnMobile');
    exportQuoteBtn?.addEventListener('click', handleExportQuote);
    exportQuoteBtnMobile?.addEventListener('click', handleExportQuote);
    
    // Modal close button
    const modalClose = document.querySelector('.modal-close');
    modalClose?.addEventListener('click', hideProductModal);
    
    // Close modal when clicking outside
    const modal = document.getElementById('productModal');
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideProductModal();
        }
    });
    
    // Mobile quote FAB
    const quoteFAB = document.getElementById('quoteFAB');
    quoteFAB?.addEventListener('click', toggleMobileQuotePanel);
    
    // Close mobile quote panel
    const closeMobileQuote = document.getElementById('closeMobileQuote');
    closeMobileQuote?.addEventListener('click', () => {
        const panel = document.getElementById('mobileQuotePanel');
        panel.classList.remove('active');
    });
}

/**
 * Handle currency change
 */
function handleCurrencyChange(event) {
    state.currentCurrency = event.target.value;
    saveCurrency(state.currentCurrency);
    
    // Re-render products and quote with new currency
    renderUI();
}

/**
 * Handle search input
 */
function handleSearchInput(event) {
    state.filters.search = event.target.value;
    applyFiltersAndRender();
}

/**
 * Handle category click
 */
function handleCategoryClick(category) {
    state.filters.category = category;
    
    // Update active state on buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
    
    applyFiltersAndRender();
}

/**
 * Apply filters and re-render products
 */
function applyFiltersAndRender() {
    state.filteredProducts = applyFilters(state.allProducts, state.filters);
    
    renderProducts(
        state.filteredProducts,
        state.currentCurrency,
        state.exchangeRates,
        handleAddToQuote,
        handleProductClick
    );
    
    updateProductCount(state.filteredProducts.length, state.allProducts.length);
}

/**
 * Handle add to quote
 */
function handleAddToQuote(product) {
    const updatedList = addToQuote(product);
    state.quoteList = updatedList;
    
    // Update UI
    renderQuoteList(
        state.quoteList,
        state.currentCurrency,
        state.exchangeRates,
        handleRemoveFromQuote
    );
    
    const total = calculateTotal(
        state.quoteList,
        state.currentCurrency,
        state.exchangeRates
    );
    updateQuoteTotal(total, state.currentCurrency);
    updateQuoteBadge(state.quoteList.length);
    
    // Update product card buttons
    updateProductCardButtons(state.quoteList);
    
    // Show feedback
    showNotification(`${product.title} added to quote`);
}

/**
 * Handle remove from quote
 */
function handleRemoveFromQuote(productId) {
    const updatedList = removeFromQuote(productId);
    state.quoteList = updatedList;
    
    // Update UI
    renderQuoteList(
        state.quoteList,
        state.currentCurrency,
        state.exchangeRates,
        handleRemoveFromQuote
    );
    
    const total = calculateTotal(
        state.quoteList,
        state.currentCurrency,
        state.exchangeRates
    );
    updateQuoteTotal(total, state.currentCurrency);
    updateQuoteBadge(state.quoteList.length);
    
    // Update product card buttons
    updateProductCardButtons(state.quoteList);
}

/**
 * Handle clear quote
 */
function handleClearQuote() {
    if (confirm('Are you sure you want to clear all items from the quote?')) {
        clearQuote();
        state.quoteList = [];
        renderUI();
        showNotification('Quote cleared');
    }
}

/**
 * Handle export quote
 */
function handleExportQuote() {
    try {
        const quoteData = exportQuoteData(state.currentCurrency, state.exchangeRates);
        
        // Create downloadable file
        const blob = new Blob([quoteData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `quote-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showNotification('Quote exported successfully');
    } catch (error) {
        console.error('Export error:', error);
        alert('Failed to export quote. Please try again.');
    }
}

/**
 * Handle product click (show modal)
 */
function handleProductClick(product) {
    showProductModal(
        product,
        state.currentCurrency,
        state.exchangeRates,
        handleAddToQuote
    );
}

/**
 * Toggle mobile quote panel
 */
function toggleMobileQuotePanel() {
    const panel = document.getElementById('mobileQuotePanel');
    panel.classList.toggle('active');
}

/**
 * Show notification toast
 */
function showNotification(message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        background-color: #1e293b;
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 1000;
        animation: slideUp 0.3s ease-out;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Add CSS animations for toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from {
            transform: translate(-50%, 100%);
            opacity: 0;
        }
        to {
            transform: translate(-50%, 0);
            opacity: 1;
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for debugging
window.appState = state;