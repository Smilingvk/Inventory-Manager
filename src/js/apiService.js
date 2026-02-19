/**
 * API Service Module
 * Handles all fetch calls and error handling for external APIs
 */

const API_ENDPOINTS = {
    products: 'https://fakestoreapi.com/products',
    exchangeRate: 'https://api.exchangerate-api.com/v4/latest/USD'
};

/**
 * Fetch all products from FakeStoreAPI
 * @returns {Promise<Array>} Array of product objects
 */
export async function fetchProducts() {
    try {
        const response = await fetch(API_ENDPOINTS.products);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw new Error('Failed to load products. Please check your connection and try again.');
    }
}

/**
 * Fetch exchange rates from ExchangeRate-API
 * @returns {Promise<Object>} Object containing exchange rates
 */
export async function fetchExchangeRates() {
    try {
        const response = await fetch(API_ENDPOINTS.exchangeRate);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Validate that we have the rates we need
        if (!data.rates) {
            throw new Error('Invalid exchange rate data received');
        }
        
        return data.rates;
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        
        // Return fallback rates if API fails
        return getFallbackRates();
    }
}

/**
 * Get fallback exchange rates in case API fails
 * @returns {Object} Object containing fallback exchange rates
 */
function getFallbackRates() {
    console.warn('Using fallback exchange rates');
    return {
        USD: 1,
        EUR: 0.92,
        GBP: 0.79,
        JPY: 149.50,
        MXN: 17.20
    };
}

/**
 * Validate API response data
 * @param {any} data - Data to validate
 * @param {string} type - Type of data ('products' or 'rates')
 * @returns {boolean} True if valid, false otherwise
 */
export function validateAPIData(data, type) {
    if (!data) return false;
    
    if (type === 'products') {
        return Array.isArray(data) && data.length > 0;
    }
    
    if (type === 'rates') {
        return typeof data === 'object' && Object.keys(data).length > 0;
    }
    
    return false;
}

/**
 * Retry failed API calls with exponential backoff
 * @param {Function} apiFn - API function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise<any>} Result from API call
 */
export async function retryAPICall(apiFn, maxRetries = 3) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await apiFn();
        } catch (error) {
            lastError = error;
            
            // Wait before retrying (exponential backoff)
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
            }
        }
    }
    
    throw lastError;
}