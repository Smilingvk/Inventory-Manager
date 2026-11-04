/**
 * API access and validation for the external catalog and exchange rates.
 */

const API_ENDPOINTS = {
    products: 'https://fakestoreapi.com/products',
    exchangeRates: 'https://api.exchangerate-api.com/v4/latest/USD'
};

const REQUIRED_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'MXN'];
const FALLBACK_RATES = Object.freeze({
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 149.5,
    MXN: 17.2
});

async function fetchJSON(url, timeoutMs = 10000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}`);
        }
        return await response.json();
    } finally {
        clearTimeout(timeout);
    }
}

function isValidProduct(product) {
    return Boolean(
        product &&
        Number.isInteger(Number(product.id)) &&
        typeof product.title === 'string' && product.title.trim() &&
        typeof product.price === 'number' && Number.isFinite(product.price) && product.price >= 0 &&
        typeof product.description === 'string' &&
        typeof product.category === 'string' &&
        typeof product.image === 'string' &&
        product.rating &&
        Number.isFinite(Number(product.rating.rate)) &&
        Number(product.rating.rate) >= 0 && Number(product.rating.rate) <= 5 &&
        Number.isFinite(Number(product.rating.count)) && Number(product.rating.count) >= 0
    );
}

export async function fetchProducts() {
    let data;
    try {
        data = await fetchJSON(API_ENDPOINTS.products);
    } catch (error) {
        console.error('Error loading products:', error);
        throw new Error(error.name === 'AbortError'
            ? 'Catalog loading took too long. Please try again.'
            : 'Could not load the catalog. Check your connection and try again.');
    }

    if (!Array.isArray(data)) {
        throw new Error('The catalog response has an unexpected format.');
    }
    const products = data.filter(isValidProduct);
    if (data.length > 0 && products.length === 0) {
        throw new Error('The catalog does not contain valid products.');
    }
    return products;
}

export async function fetchExchangeRates() {
    try {
        const data = await fetchJSON(API_ENDPOINTS.exchangeRates);
        const validRates = data?.rates && REQUIRED_CURRENCIES.every(currency =>
            Number.isFinite(data.rates[currency]) && data.rates[currency] > 0
        );

        if (!validRates) {
            throw new Error('The exchange rate response is invalid.');
        }

        return { rates: data.rates, isFallback: false };
    } catch (error) {
        console.warn('Using fallback exchange rates:', error);
        return { rates: FALLBACK_RATES, isFallback: true };
    }
}
