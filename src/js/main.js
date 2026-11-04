import { fetchProducts, fetchExchangeRates } from './apiService.js';
import { calculateTotal } from './currencyLogic.js';
import { Product } from './product.js';
import {
    loadCurrency,
    saveCurrency,
    loadQuoteList,
    addToQuote,
    setQuoteQuantity,
    removeFromQuote,
    clearQuote,
    exportQuoteData
} from './storage.js';
import { applyFilters, extractCategories, formatCategory, sortProducts, debounce } from './filterService.js';
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
    updateProductCardButtons,
    updateCurrencyPicker
} from './inventoryRenderer.js';

const state = {
    allProducts: [],
    filteredProducts: [],
    exchangeRates: {},
    usingFallbackRates: false,
    currentCurrency: 'USD',
    sortBy: 'featured',
    filters: { search: '', category: 'all' },
    quoteList: []
};

let notificationTimeout;

async function init() {
    showLoading();
    state.currentCurrency = loadCurrency();
    state.quoteList = loadQuoteList();
    updateCurrencyPicker(state.currentCurrency);

    try {
        const [productsData, rateResult] = await Promise.all([fetchProducts(), fetchExchangeRates()]);
        state.allProducts = productsData.map(data => new Product(data)).filter(product => product.isValid());
        state.filteredProducts = state.allProducts;
        state.exchangeRates = rateResult.rates;
        state.usingFallbackRates = rateResult.isFallback;
        renderUI();
        bindEvents();
        hideLoading();
        document.getElementById('rateNotice').hidden = !state.usingFallbackRates;
    } catch (error) {
        hideLoading();
        showError(error.message || 'An unexpected error occurred while starting the app.', init);
    }
}

function renderUI() {
    const visibleProducts = sortProducts(state.filteredProducts, state.sortBy);
    renderProducts(visibleProducts, state.currentCurrency, state.exchangeRates,
        handleAddToQuote, handleProductClick, state.quoteList);
    renderCategoryFilters(extractCategories(state.allProducts), state.filters.category);
    updateCatalogHeading();
    updateProductCount(state.filteredProducts.length, state.allProducts.length);
    renderQuoteList(state.quoteList, state.currentCurrency, state.exchangeRates,
        handleRemoveFromQuote, handleQuantityChange);
    updateQuoteTotal(calculateTotal(state.quoteList, state.currentCurrency, state.exchangeRates), state.currentCurrency);
    updateQuoteBadge(state.quoteList.length);
    updateMetrics();
    renderActiveFilters();
}

function bindEvents() {
    const currencyPicker = document.getElementById('currencyPicker');
    const currencyTrigger = document.getElementById('currencyTrigger');
    const currencyMenu = document.getElementById('currencyMenu');
    currencyTrigger.addEventListener('click', () => {
        const isOpen = currencyTrigger.getAttribute('aria-expanded') === 'true';
        setCurrencyMenuOpen(!isOpen);
        if (!isOpen) currencyMenu.querySelector('[aria-checked="true"]')?.focus();
    });
    currencyMenu.addEventListener('click', event => {
        const option = event.target.closest('[data-currency]');
        if (!option) return;
        state.currentCurrency = option.dataset.currency;
        saveCurrency(state.currentCurrency);
        updateCurrencyPicker(state.currentCurrency);
        setCurrencyMenuOpen(false);
        currencyTrigger.focus();
        renderUI();
    });
    currencyTrigger.addEventListener('keydown', event => {
        if (event.key !== 'ArrowDown') return;
        event.preventDefault();
        setCurrencyMenuOpen(true);
        currencyMenu.querySelector('[aria-checked="true"]')?.focus();
    });
    currencyMenu.addEventListener('keydown', handleCurrencyMenuKeys);
    document.addEventListener('click', event => {
        if (!currencyPicker.contains(event.target)) setCurrencyMenuOpen(false);
    });

    document.getElementById('searchInput').addEventListener('input', debounce(event => {
        state.filters.search = event.target.value;
        applyFiltersAndRender();
    }));

    document.getElementById('sortSelect').addEventListener('change', event => {
        state.sortBy = event.target.value;
        renderUI();
    });
    document.getElementById('filterToggle').addEventListener('click', () => {
        const content = document.getElementById('filterContent');
        const open = content.classList.toggle('is-open');
        document.getElementById('filterToggle').setAttribute('aria-expanded', String(open));
        document.querySelector('.filter-toggle-label').textContent = open ? 'Hide filters' : 'Show filters';
    });

    document.getElementById('categoryFilters').addEventListener('click', event => {
        const button = event.target.closest('.category-btn');
        if (!button) return;
        state.filters.category = button.dataset.category;
        renderCategoryFilters(extractCategories(state.allProducts), state.filters.category);
        applyFiltersAndRender();
    });
    document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);
    document.getElementById('activeFilters').addEventListener('click', event => {
        const chip = event.target.closest('[data-clear-filter]');
        if (!chip) return;
        if (chip.dataset.clearFilter === 'search') {
            state.filters.search = '';
            document.getElementById('searchInput').value = '';
        } else {
            state.filters.category = 'all';
            renderCategoryFilters(extractCategories(state.allProducts), 'all');
        }
        applyFiltersAndRender();
    });

    ['clearQuoteBtn', 'clearQuoteBtnMobile'].forEach(id => {
        document.getElementById(id).addEventListener('click', handleClearQuote);
    });
    ['exportQuoteBtn', 'exportQuoteBtnMobile'].forEach(id => {
        document.getElementById(id).addEventListener('click', handleExportQuote);
    });

    document.querySelector('.modal-close').addEventListener('click', hideProductModal);
    const modal = document.getElementById('productModal');
    modal.addEventListener('click', event => {
        if (event.target === modal) hideProductModal();
    });

    document.getElementById('quoteFAB').addEventListener('click', openMobileQuotePanel);
    document.getElementById('closeMobileQuote').addEventListener('click', closeMobileQuotePanel);
    document.getElementById('quotePanelBackdrop').addEventListener('click', closeMobileQuotePanel);
    document.addEventListener('keydown', handleDialogKeys);
}

function setCurrencyMenuOpen(open) {
    const trigger = document.getElementById('currencyTrigger');
    const menu = document.getElementById('currencyMenu');
    trigger.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
}

function handleCurrencyMenuKeys(event) {
    const options = [...document.querySelectorAll('#currencyMenu [data-currency]')];
    const currentIndex = options.indexOf(document.activeElement);
    let nextIndex;
    if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % options.length;
    else if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + options.length) % options.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = options.length - 1;
    else if (event.key === 'Escape') {
        event.preventDefault();
        setCurrencyMenuOpen(false);
        document.getElementById('currencyTrigger').focus();
        return;
    } else return;
    event.preventDefault();
    options[nextIndex]?.focus();
}

function applyFiltersAndRender() {
    state.filteredProducts = applyFilters(state.allProducts, state.filters);
    renderProducts(sortProducts(state.filteredProducts, state.sortBy), state.currentCurrency,
        state.exchangeRates, handleAddToQuote, handleProductClick, state.quoteList);
    updateCatalogHeading();
    updateProductCount(state.filteredProducts.length, state.allProducts.length);
    updateMetrics();
    renderActiveFilters();
}

function updateMetrics() {
    const quantity = state.quoteList.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('metricProducts').textContent = String(state.allProducts.length);
    document.getElementById('metricCategories').textContent = String(extractCategories(state.allProducts).length);
    document.getElementById('metricQuote').textContent = String(quantity);
    document.getElementById('metricQuoteValue').textContent =
        new Intl.NumberFormat('en-US', { style: 'currency', currency: state.currentCurrency })
            .format(calculateTotal(state.quoteList, state.currentCurrency, state.exchangeRates));
}

function renderActiveFilters() {
    const container = document.getElementById('activeFilters');
    container.replaceChildren();
    const active = [];
    if (state.filters.category !== 'all') active.push(['category', formatCategory(state.filters.category)]);
    if (state.filters.search.trim()) active.push(['search', `Search: ${state.filters.search.trim()}`]);
    active.forEach(([key, label]) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'filter-chip';
        chip.dataset.clearFilter = key;
        chip.textContent = `${label} ×`;
        chip.setAttribute('aria-label', `Remove filter: ${label}`);
        container.append(chip);
    });
    document.getElementById('clearFiltersBtn').hidden = active.length === 0;
    container.hidden = active.length === 0;
}

function clearFilters() {
    state.filters = { search: '', category: 'all' };
    document.getElementById('searchInput').value = '';
    renderCategoryFilters(extractCategories(state.allProducts), 'all');
    applyFiltersAndRender();
}

function updateCatalogHeading() {
    const title = document.getElementById('catalogTitle');
    const subtitle = document.querySelector('.toolbar-subtitle');
    if (state.filters.search.trim()) {
        title.textContent = 'Search results';
        subtitle.textContent = `Matches for “${state.filters.search.trim()}”`;
    } else if (state.filters.category !== 'all') {
        title.textContent = formatCategory(state.filters.category);
        subtitle.textContent = 'Products in this category';
    } else {
        title.textContent = 'All products';
        subtitle.textContent = 'Prices shown in your selected currency';
    }
}

function handleAddToQuote(product) {
    state.quoteList = addToQuote(product);
    updateQuoteUI();
    showNotification(`${product.title} added to your quote.`);
}

function handleRemoveFromQuote(productId) {
    state.quoteList = removeFromQuote(productId);
    updateQuoteUI();
}

function handleQuantityChange(productId, quantity, action) {
    const listId = document.activeElement.closest('.quote-list')?.id;
    state.quoteList = setQuoteQuantity(productId, quantity);
    updateQuoteUI();
    const list = listId ? document.getElementById(listId) : null;
    const control = list?.querySelector(`[data-product-id="${Number(productId)}"][data-quantity-action="${action}"]`);
    const fallback = list?.querySelector(`[data-product-id="${Number(productId)}"][data-quantity-action="input"]`);
    (control?.disabled ? fallback : control)?.focus();
}

function updateQuoteUI() {
    renderQuoteList(state.quoteList, state.currentCurrency, state.exchangeRates,
        handleRemoveFromQuote, handleQuantityChange);
    updateQuoteTotal(calculateTotal(state.quoteList, state.currentCurrency, state.exchangeRates), state.currentCurrency);
    updateQuoteBadge(state.quoteList.length);
    updateProductCardButtons(state.quoteList);
    updateMetrics();
}

function handleClearQuote() {
    if (!state.quoteList.length || !window.confirm('Remove all products from this quote?')) return;
    clearQuote();
    state.quoteList = [];
    renderUI();
    showNotification('Quote cleared.');
}

function handleExportQuote() {
    try {
        const data = exportQuoteData(state.currentCurrency, state.exchangeRates);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `quote-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.append(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        showNotification('Quote downloaded.');
    } catch (error) {
        console.error('Error exporting quote:', error);
        showNotification('Could not export the quote.');
    }
}

function handleProductClick(product) {
    showProductModal(product, state.currentCurrency, state.exchangeRates, handleAddToQuote);
}

function openMobileQuotePanel() {
    const panel = document.getElementById('mobileQuotePanel');
    panel.hidden = false;
    panel.classList.add('active');
    panel.setAttribute('aria-hidden', 'false');
    panel.setAttribute('aria-modal', 'true');
    document.getElementById('quoteFAB').setAttribute('aria-expanded', 'true');
    document.getElementById('quotePanelBackdrop').hidden = false;
    document.body.classList.add('dialog-open');
    document.getElementById('closeMobileQuote').focus();
}

function closeMobileQuotePanel() {
    const panel = document.getElementById('mobileQuotePanel');
    panel.classList.remove('active');
    panel.hidden = true;
    panel.setAttribute('aria-hidden', 'true');
    panel.setAttribute('aria-modal', 'false');
    document.getElementById('quoteFAB').setAttribute('aria-expanded', 'false');
    document.getElementById('quotePanelBackdrop').hidden = true;
    document.body.classList.remove('dialog-open');
    document.getElementById('quoteFAB').focus();
}

function handleDialogKeys(event) {
    const modal = document.getElementById('productModal');
    const mobilePanel = document.getElementById('mobileQuotePanel');
    const activeDialog = modal.classList.contains('active') ? modal :
        (!mobilePanel.hidden ? mobilePanel : null);
    if (!activeDialog) return;

    if (event.key === 'Escape') {
        event.preventDefault();
        if (activeDialog === modal) hideProductModal();
        else closeMobileQuotePanel();
        return;
    }

    if (event.key !== 'Tab') return;
    const focusable = [...activeDialog.querySelectorAll('button:not([disabled]), a[href], input, select, [tabindex]:not([tabindex="-1"])')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

function showNotification(message) {
    const toast = document.getElementById('toastRegion');
    toast.textContent = message;
    toast.hidden = false;
    toast.classList.remove('toast-visible');
    requestAnimationFrame(() => toast.classList.add('toast-visible'));
    clearTimeout(notificationTimeout);
    notificationTimeout = window.setTimeout(() => {
        toast.classList.remove('toast-visible');
        window.setTimeout(() => { toast.hidden = true; }, 200);
    }, 2800);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
    init();
}
