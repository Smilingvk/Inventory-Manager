/**
 * Currency Logic Module
 * Pure functions for currency conversions and formatting
 */

/**
 * Currency symbols mapping
 */
const CURRENCY_SYMBOLS = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    MXN: '$'
};

/**
 * Currency names mapping
 */
const CURRENCY_NAMES = {
    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
    JPY: 'Japanese Yen',
    MXN: 'Mexican Peso'
};

/**
 * Convert price from USD to target currency
 * @param {number} usdPrice - Price in USD
 * @param {string} targetCurrency - Target currency code
 * @param {Object} exchangeRates - Exchange rates object
 * @returns {number} Converted price
 */
export function convertPrice(usdPrice, targetCurrency, exchangeRates) {
    if (!usdPrice || typeof usdPrice !== 'number') {
        return 0;
    }
    
    if (targetCurrency === 'USD') {
        return usdPrice;
    }
    
    const rate = exchangeRates[targetCurrency];
    
    if (!rate) {
        console.warn(`Exchange rate not found for ${targetCurrency}, using USD`);
        return usdPrice;
    }
    
    return usdPrice * rate;
}

/**
 * Format price with currency symbol and proper decimals
 * @param {number} price - Price to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted price string
 */
export function formatPrice(price, currency) {
    if (typeof price !== 'number' || isNaN(price)) {
        return `${CURRENCY_SYMBOLS[currency] || '$'}0.00`;
    }
    
    const symbol = CURRENCY_SYMBOLS[currency] || '$';
    
    // JPY typically doesn't use decimal places
    if (currency === 'JPY') {
        return `${symbol}${Math.round(price).toLocaleString('en-US')}`;
    }
    
    // For other currencies, use 2 decimal places
    const formattedAmount = price.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    // For EUR and GBP, put symbol after for some locales, but we'll keep it consistent before
    return `${symbol}${formattedAmount}`;
}

/**
 * Convert and format price in one step
 * @param {number} usdPrice - Price in USD
 * @param {string} targetCurrency - Target currency code
 * @param {Object} exchangeRates - Exchange rates object
 * @returns {string} Formatted price string
 */
export function convertAndFormat(usdPrice, targetCurrency, exchangeRates) {
    const convertedPrice = convertPrice(usdPrice, targetCurrency, exchangeRates);
    return formatPrice(convertedPrice, targetCurrency);
}

/**
 * Get currency symbol
 * @param {string} currency - Currency code
 * @returns {string} Currency symbol
 */
export function getCurrencySymbol(currency) {
    return CURRENCY_SYMBOLS[currency] || '$';
}

/**
 * Get currency name
 * @param {string} currency - Currency code
 * @returns {string} Currency name
 */
export function getCurrencyName(currency) {
    return CURRENCY_NAMES[currency] || currency;
}

/**
 * Calculate total price from array of items
 * @param {Array} items - Array of items with price property
 * @param {string} currency - Currency code
 * @param {Object} exchangeRates - Exchange rates object
 * @returns {number} Total price in target currency
 */
export function calculateTotal(items, currency, exchangeRates) {
    if (!Array.isArray(items) || items.length === 0) {
        return 0;
    }
    
    return items.reduce((total, item) => {
        const itemPrice = item.price || 0;
        const convertedPrice = convertPrice(itemPrice, currency, exchangeRates);
        return total + convertedPrice;
    }, 0);
}

/**
 * Get exchange rate for a specific currency
 * @param {string} currency - Currency code
 * @param {Object} exchangeRates - Exchange rates object
 * @returns {number} Exchange rate
 */
export function getExchangeRate(currency, exchangeRates) {
    if (currency === 'USD') {
        return 1;
    }
    
    return exchangeRates[currency] || 1;
}

/**
 * Round price to appropriate decimal places based on currency
 * @param {number} price - Price to round
 * @param {string} currency - Currency code
 * @returns {number} Rounded price
 */
export function roundPrice(price, currency) {
    if (currency === 'JPY') {
        return Math.round(price);
    }
    
    return Math.round(price * 100) / 100;
}

/**
 * Validate currency code
 * @param {string} currency - Currency code to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidCurrency(currency) {
    return Object.keys(CURRENCY_SYMBOLS).includes(currency);
}

/**
 * Get all supported currencies
 * @returns {Array} Array of currency codes
 */
export function getSupportedCurrencies() {
    return Object.keys(CURRENCY_SYMBOLS);
}