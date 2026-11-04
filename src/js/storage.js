const STORAGE_KEYS = {
    CURRENCY: 'globalInventory_currency',
    QUOTE_LIST: 'globalInventory_quoteList'
};

const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'MXN'];
let quoteCache = null;
let currencyCache = 'USD';

function read(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
    } catch (error) {
        console.warn(`Could not read local storage (${key}).`, error);
        return fallback;
    }
}

function write(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.warn(`Could not write local storage (${key}).`, error);
        return false;
    }
}

function isStoredProduct(product) {
    return Boolean(
        product && Number.isInteger(Number(product.id)) &&
        typeof product.title === 'string' && product.title.trim() &&
        typeof product.price === 'number' && Number.isFinite(product.price) && product.price >= 0 &&
        typeof product.category === 'string' && typeof product.image === 'string'
    );
}

export function saveCurrency(currency) {
    if (!SUPPORTED_CURRENCIES.includes(currency)) return false;
    currencyCache = currency;
    return write(STORAGE_KEYS.CURRENCY, currency);
}

export function loadCurrency() {
    const currency = read(STORAGE_KEYS.CURRENCY, currencyCache);
    currencyCache = SUPPORTED_CURRENCIES.includes(currency) ? currency : 'USD';
    return currencyCache;
}

export function loadQuoteList() {
    const quote = read(STORAGE_KEYS.QUOTE_LIST, quoteCache || []);
    if (!Array.isArray(quote)) return quoteCache || [];
    quoteCache = quote.filter(isStoredProduct).map(item => ({
        ...item,
        quantity: Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= 999
            ? item.quantity : 1
    }));
    return quoteCache;
}

function saveQuoteList(quote) {
    quoteCache = quote;
    return write(STORAGE_KEYS.QUOTE_LIST, quote);
}

export function addToQuote(product) {
    const quote = loadQuoteList();
    if (isStoredProduct(product) && !quote.some(item => Number(item.id) === Number(product.id))) {
        quote.push({ ...product, quantity: 1 });
        saveQuoteList(quote);
    }
    return quote;
}

export function setQuoteQuantity(productId, quantity) {
    const parsed = Number(quantity);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 999) return loadQuoteList();
    const quote = loadQuoteList().map(item => Number(item.id) === Number(productId)
        ? { ...item, quantity: parsed } : item);
    saveQuoteList(quote);
    return quote;
}

export function removeFromQuote(productId) {
    const quote = loadQuoteList().filter(item => Number(item.id) !== Number(productId));
    saveQuoteList(quote);
    return quote;
}

export function clearQuote() {
    return saveQuoteList([]);
}

export function isInQuote(productId) {
    return loadQuoteList().some(item => Number(item.id) === Number(productId));
}

export function exportQuoteData(currency, exchangeRates) {
    const rate = Number.isFinite(exchangeRates?.[currency]) && exchangeRates[currency] > 0
        ? exchangeRates[currency]
        : 1;
    const fractionDigits = currency === 'JPY' ? 0 : 2;
    const roundMoney = amount => Number(amount.toFixed(fractionDigits));
    const items = loadQuoteList().map(item => ({
        ...item,
        convertedPrice: roundMoney(item.price * rate),
        convertedSubtotal: roundMoney(item.price * rate * item.quantity)
    }));

    return JSON.stringify({
        currency,
        sourceCurrency: 'USD',
        timestamp: new Date().toISOString(),
        exchangeRate: rate,
        items,
        total: roundMoney(items.reduce((sum, item) => sum + item.convertedSubtotal, 0))
    }, null, 2);
}
