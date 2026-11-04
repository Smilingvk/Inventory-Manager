import { convertAndFormat, formatPrice } from './currencyLogic.js';
import { isInQuote } from './storage.js';
import { formatCategory } from './filterService.js';

let previousFocus = null;

function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function safeImageURL(rawURL) {
    try {
        const url = new URL(rawURL, window.location.href);
        return url.protocol === 'https:' ? url.href : '';
    } catch (error) {
        return '';
    }
}

function createProductImage(product, className) {
    const containerClass = className === 'modal-product-image'
        ? 'product-image-container modal-image-container'
        : 'product-image-container';
    const container = element('div', containerClass);
    const image = element('img', className);
    image.alt = product.title;
    image.loading = 'lazy';
    image.decoding = 'async';
    const imageURL = safeImageURL(product.image);
    const placeholder = element('span', 'image-placeholder', 'Image unavailable');
    placeholder.hidden = true;
    image.addEventListener('error', () => {
        image.hidden = true;
        placeholder.hidden = false;
    }, { once: true });
    if (imageURL) {
        image.src = imageURL;
    } else {
        image.hidden = true;
        placeholder.hidden = false;
    }
    container.append(image, placeholder);
    return container;
}

function createButton(text, className, label) {
    const button = element('button', className, text);
    button.type = 'button';
    if (label) button.setAttribute('aria-label', label);
    return button;
}

export function renderProducts(products, currency, exchangeRates, onAddToQuote, onProductClick, quoteItems = []) {
    const grid = document.getElementById('productGrid');
    const noResults = document.getElementById('noResults');
    if (!grid || !noResults) return;

    const fragment = document.createDocumentFragment();
    const quoteIds = new Set(quoteItems.map(item => Number(item.id)));
    products.forEach(product => {
        fragment.append(createProductCard(product, currency, exchangeRates, onAddToQuote, onProductClick, quoteIds));
    });
    grid.replaceChildren(fragment);
    noResults.hidden = products.length !== 0;
}

function createProductCard(product, currency, exchangeRates, onAddToQuote, onProductClick, quoteIds) {
    const card = element('article', 'product-card');
    card.setAttribute('role', 'listitem');
    card.append(createProductImage(product, 'product-image'));

    const category = element('p', 'product-category', formatCategory(product.category));
    const title = element('h3', 'product-title', product.title);
    const description = element('p', 'product-description', product.description);
    const rating = element('div', 'product-rating');
    const stars = element('span', 'stars', generateStars(product.rating?.rate || 0));
    stars.setAttribute('aria-hidden', 'true');
    const ratingLabel = element('span', 'rating-label', `${(product.rating?.rate || 0).toFixed(1)} / 5`);
    const ratingCount = element('span', 'rating-count', `${product.rating?.count || 0} reviews`);
    rating.append(stars, ratingLabel, ratingCount);

    const footer = element('div', 'product-footer');
    const price = element('span', 'product-price', convertAndFormat(product.price, currency, exchangeRates));
    const actions = element('div', 'product-actions');
    const detailButton = createButton('Details', 'btn-view-details', `View details for ${product.title}`);
    detailButton.addEventListener('click', () => onProductClick(product));
    const inQuote = quoteIds.has(Number(product.id));
    const addButton = createButton(inQuote ? 'In quote' : 'Add', 'btn-add-quote');
    addButton.dataset.productId = String(product.id);
    addButton.disabled = inQuote;
    addButton.addEventListener('click', () => onAddToQuote(product));
    actions.append(detailButton, addButton);
    footer.append(price, actions);
    card.append(category, title, description, rating, footer);
    return card;
}

export function renderCategoryFilters(categories, activeCategory) {
    const container = document.getElementById('categoryFilters');
    if (!container) return;
    const fragment = document.createDocumentFragment();
    const allButton = createButton('All products', 'category-btn');
    allButton.dataset.category = 'all';
    allButton.classList.toggle('active', activeCategory === 'all');
    allButton.setAttribute('aria-pressed', String(activeCategory === 'all'));
    fragment.append(allButton);

    categories.forEach(category => {
        const button = createButton(formatCategory(category), 'category-btn');
        button.dataset.category = category;
        button.classList.toggle('active', activeCategory === category);
        button.setAttribute('aria-pressed', String(activeCategory === category));
        fragment.append(button);
    });
    container.replaceChildren(fragment);
}

export function updateProductCount(count, total) {
    const countElement = document.getElementById('productCount');
    if (countElement) countElement.textContent = `${count} of ${total} products`;
}

export function renderQuoteList(quoteItems, currency, exchangeRates, onRemove, onQuantityChange) {
    ['quoteList', 'mobileQuoteList'].forEach(id => {
        const list = document.getElementById(id);
        if (!list) return;
        const fragment = document.createDocumentFragment();
        if (quoteItems.length === 0) {
            fragment.append(element('p', 'empty-quote', 'No products in your quote yet'));
        } else {
            quoteItems.forEach(item => fragment.append(createQuoteItem(item, currency, exchangeRates, onRemove, onQuantityChange)));
        }
        list.replaceChildren(fragment);
    });
    updateQuoteButtons(quoteItems.length > 0);
}

function createQuoteItem(item, currency, exchangeRates, onRemove, onQuantityChange) {
    const row = element('div', 'quote-item');
    row.setAttribute('role', 'listitem');
    const image = createProductImage(item, 'quote-product-image');
    const header = element('div', 'quote-item-header');
    const title = element('p', 'quote-item-title', item.title);
    const remove = createButton('×', 'btn-remove-quote', `Remove ${item.title} from quote`);
    remove.dataset.productId = String(item.id);
    remove.addEventListener('click', () => onRemove(item.id));
    header.append(title, remove);
    const details = element('div', 'quote-item-details');
    const controls = element('div', 'quantity-control');
    const decrement = createButton('−', 'quantity-button', `Reducir cantidad de ${item.title}`);
    decrement.dataset.productId = String(item.id);
    decrement.dataset.quantityAction = 'decrement';
    decrement.disabled = item.quantity <= 1;
    decrement.addEventListener('click', () => onQuantityChange(item.id, item.quantity - 1, 'decrement'));
    const input = element('input', 'quantity-input');
    input.dataset.productId = String(item.id);
    input.dataset.quantityAction = 'input';
    input.type = 'number';
    input.min = '1';
    input.max = '999';
    input.step = '1';
    input.value = String(item.quantity);
    input.setAttribute('aria-label', `Cantidad de ${item.title}`);
    input.addEventListener('change', () => onQuantityChange(item.id, input.value, 'input'));
    const increment = createButton('+', 'quantity-button', `Aumentar cantidad de ${item.title}`);
    increment.dataset.productId = String(item.id);
    increment.dataset.quantityAction = 'increment';
    increment.disabled = item.quantity >= 999;
    increment.addEventListener('click', () => onQuantityChange(item.id, item.quantity + 1, 'increment'));
    controls.append(decrement, input, increment);
    const unit = element('p', 'quote-item-unit', `${convertAndFormat(item.price, currency, exchangeRates)} each`);
    const subtotal = element('p', 'quote-item-price', convertAndFormat(item.price * item.quantity, currency, exchangeRates));
    details.append(unit, controls, subtotal);
    row.append(image, header, details);
    return row;
}

function updateQuoteButtons(hasItems) {
    ['clearQuoteBtn', 'exportQuoteBtn', 'clearQuoteBtnMobile', 'exportQuoteBtnMobile'].forEach(id => {
        const button = document.getElementById(id);
        if (button) button.hidden = !hasItems;
    });
}

export function updateQuoteTotal(total, currency) {
    const formatted = formatPrice(total, currency);
    ['quoteTotal', 'mobileQuoteTotal'].forEach(id => {
        const target = document.getElementById(id);
        if (target) target.textContent = formatted;
    });
}

export function updateQuoteBadge(count) {
    const badge = document.getElementById('quoteCount');
    const fab = document.getElementById('quoteFAB');
    if (badge) badge.textContent = String(count);
    if (fab) fab.setAttribute('aria-label', `View quote, ${count} ${count === 1 ? 'product' : 'products'}`);
}

export function updateCurrencyPicker(currency) {
    const selected = document.querySelector(`#currencyMenu [data-currency="${currency}"]`);
    if (!selected) return;
    document.getElementById('currencyCode').textContent = currency;
    document.getElementById('currencyName').textContent = selected.dataset.name;
    document.getElementById('currencyTrigger').setAttribute('aria-label',
        `Display currency: ${currency}, ${selected.dataset.name}`);
    document.querySelector('.currency-globe').textContent = selected.dataset.flag;
    document.querySelectorAll('#currencyMenu [data-currency]').forEach(option => {
        const active = option === selected;
        option.setAttribute('aria-checked', String(active));
        option.classList.toggle('selected', active);
    });
}

function generateStars(rating) {
    const boundedRating = Math.max(0, Math.min(5, Number(rating) || 0));
    const fullStars = Math.floor(boundedRating);
    const halfStar = boundedRating - fullStars >= 0.5;
    return '★'.repeat(fullStars) + (halfStar ? '⯨' : '') + '☆'.repeat(5 - fullStars - Number(halfStar));
}

export function showProductModal(product, currency, exchangeRates, onAddToQuote) {
    const modal = document.getElementById('productModal');
    const body = document.getElementById('modalBody');
    if (!modal || !body) return;
    previousFocus = document.activeElement;

    const content = document.createDocumentFragment();
    content.append(createProductImage(product, 'modal-product-image'));
    content.append(element('p', 'modal-product-category', formatCategory(product.category)));
    const title = element('h2', 'modal-product-title', product.title);
    title.id = 'modalProductTitle';
    content.append(title);
    const rating = element('p', 'modal-product-rating',
        `${(product.rating?.rate || 0).toFixed(1)} / 5 · ${product.rating?.count || 0} reviews`);
    content.append(rating);
    content.append(element('p', 'modal-product-description', product.description));
    const footer = element('div', 'modal-product-footer');
    footer.append(element('span', 'modal-product-price', convertAndFormat(product.price, currency, exchangeRates)));
    const inQuote = isInQuote(product.id);
    const addButton = createButton(inQuote ? 'Already in quote' : 'Add to quote', 'btn-add-quote');
    addButton.disabled = inQuote;
    if (!inQuote) {
        addButton.addEventListener('click', () => {
            onAddToQuote(product);
            hideProductModal();
        });
    }
    footer.append(addButton);
    content.append(footer);
    body.replaceChildren(content);
    modal.classList.add('active');
    modal.setAttribute('aria-modal', 'true');
    document.body.classList.add('dialog-open');
    modal.querySelector('.modal-close')?.focus();
}

export function hideProductModal() {
    const modal = document.getElementById('productModal');
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-modal', 'false');
    document.body.classList.remove('dialog-open');
    if (previousFocus instanceof HTMLElement) previousFocus.focus();
}

export function showLoading() {
    const loading = document.getElementById('loadingSpinner');
    if (loading) loading.hidden = false;
}

export function hideLoading() {
    const loading = document.getElementById('loadingSpinner');
    if (loading) loading.hidden = true;
}

export function showError(message, onRetry) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    const panel = element('div', 'error-state');
    panel.setAttribute('role', 'alert');
    panel.append(element('h2', '', 'Could not load the catalog'), element('p', '', message));
    const retry = createButton('Try again', 'btn-primary');
    retry.addEventListener('click', onRetry);
    panel.append(retry);
    grid.replaceChildren(panel);
}

export function updateProductCardButtons(quoteItems) {
    const quoteIds = new Set(quoteItems.map(item => Number(item.id)));
    document.querySelectorAll('.btn-add-quote[data-product-id]').forEach(button => {
        const inQuote = quoteIds.has(Number(button.dataset.productId));
        button.disabled = inQuote;
        button.textContent = inQuote ? 'In quote' : 'Add';
    });
}
