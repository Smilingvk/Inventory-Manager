/**
 * Storage Module
 * Handles localStorage operations for persisting user preferences and quote data
 */

const STORAGE_KEYS = {
    CURRENCY: 'globalInventory_currency',
    QUOTE_LIST: 'globalInventory_quoteList',
    LAST_UPDATE: 'globalInventory_lastUpdate'
};

/**
 * Save data to localStorage
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @returns {boolean} True if successful, false otherwise
 */
function saveToStorage(key, value) {
    try {
        const serialized = JSON.stringify(value);
        localStorage.setItem(key, serialized);
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

/**
 * Load data from localStorage
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {any} Stored value or default value
 */
function loadFromStorage(key, defaultValue = null) {
    try {
        const serialized = localStorage.getItem(key);
        
        if (serialized === null) {
            return defaultValue;
        }
        
        return JSON.parse(serialized);
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return defaultValue;
    }
}

/**
 * Remove data from localStorage
 * @param {string} key - Storage key
 * @returns {boolean} True if successful, false otherwise
 */
function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Error removing from localStorage:', error);
        return false;
    }
}

/**
 * Clear all app data from localStorage
 * @returns {boolean} True if successful, false otherwise
 */
export function clearAllStorage() {
    try {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        return true;
    } catch (error) {
        console.error('Error clearing localStorage:', error);
        return false;
    }
}

/**
 * Save user's preferred currency
 * @param {string} currency - Currency code (USD, EUR, GBP, JPY, MXN)
 * @returns {boolean} True if successful, false otherwise
 */
export function saveCurrency(currency) {
    return saveToStorage(STORAGE_KEYS.CURRENCY, currency);
}

/**
 * Load user's preferred currency
 * @returns {string} Currency code or 'USD' as default
 */
export function loadCurrency() {
    return loadFromStorage(STORAGE_KEYS.CURRENCY, 'USD');
}

/**
 * Save quote list
 * @param {Array} quoteList - Array of products in quote
 * @returns {boolean} True if successful, false otherwise
 */
export function saveQuoteList(quoteList) {
    const success = saveToStorage(STORAGE_KEYS.QUOTE_LIST, quoteList);
    
    if (success) {
        // Update last modification timestamp
        saveToStorage(STORAGE_KEYS.LAST_UPDATE, new Date().toISOString());
    }
    
    return success;
}

/**
 * Load quote list
 * @returns {Array} Array of products in quote or empty array
 */
export function loadQuoteList() {
    return loadFromStorage(STORAGE_KEYS.QUOTE_LIST, []);
}

/**
 * Add product to quote list
 * @param {Object} product - Product to add
 * @returns {Array} Updated quote list
 */
export function addToQuote(product) {
    const quoteList = loadQuoteList();
    
    // Check if product already exists
    const exists = quoteList.some(item => item.id === product.id);
    
    if (!exists) {
        quoteList.push(product);
        saveQuoteList(quoteList);
    }
    
    return quoteList;
}

/**
 * Remove product from quote list
 * @param {number} productId - ID of product to remove
 * @returns {Array} Updated quote list
 */
export function removeFromQuote(productId) {
    const quoteList = loadQuoteList();
    const updatedList = quoteList.filter(item => item.id !== productId);
    
    saveQuoteList(updatedList);
    
    return updatedList;
}

/**
 * Clear all items from quote list
 * @returns {boolean} True if successful, false otherwise
 */
export function clearQuote() {
    return saveQuoteList([]);
}

/**
 * Check if product is in quote
 * @param {number} productId - ID of product to check
 * @returns {boolean} True if in quote, false otherwise
 */
export function isInQuote(productId) {
    const quoteList = loadQuoteList();
    return quoteList.some(item => item.id === productId);
}

/**
 * Get quote item count
 * @returns {number} Number of items in quote
 */
export function getQuoteCount() {
    const quoteList = loadQuoteList();
    return quoteList.length;
}

/**
 * Get last update timestamp
 * @returns {string|null} ISO timestamp or null
 */
export function getLastUpdate() {
    return loadFromStorage(STORAGE_KEYS.LAST_UPDATE);
}

/**
 * Check if localStorage is available
 * @returns {boolean} True if available, false otherwise
 */
export function isStorageAvailable() {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Get storage usage information
 * @returns {Object} Object with storage stats
 */
export function getStorageInfo() {
    const info = {
        available: isStorageAvailable(),
        currency: loadCurrency(),
        quoteCount: getQuoteCount(),
        lastUpdate: getLastUpdate()
    };
    
    return info;
}

/**
 * Export quote data as JSON string
 * @param {string} currency - Current currency
 * @param {Object} exchangeRates - Exchange rates
 * @returns {string} JSON string of quote data
 */
export function exportQuoteData(currency, exchangeRates) {
    const quoteList = loadQuoteList();
    
    const exportData = {
        currency: currency,
        timestamp: new Date().toISOString(),
        items: quoteList,
        exchangeRate: exchangeRates[currency] || 1
    };
    
    return JSON.stringify(exportData, null, 2);
}