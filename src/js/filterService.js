/**
 * Filter Service Module
 * Handles search and category filtering logic
 */

/**
 * Filter products by search query
 * @param {Array} products - Array of products
 * @param {string} query - Search query
 * @returns {Array} Filtered products
 */
export function filterBySearch(products, query) {
    if (!query || query.trim() === '') {
        return products;
    }
    
    const searchTerm = query.toLowerCase().trim();
    
    return products.filter(product => {
        const title = (product.title || '').toLowerCase();
        const description = (product.description || '').toLowerCase();
        const category = (product.category || '').toLowerCase();
        
        return title.includes(searchTerm) || 
               description.includes(searchTerm) || 
               category.includes(searchTerm);
    });
}

/**
 * Filter products by category
 * @param {Array} products - Array of products
 * @param {string} category - Category to filter by ('all' for no filter)
 * @returns {Array} Filtered products
 */
export function filterByCategory(products, category) {
    if (!category || category === 'all') {
        return products;
    }
    
    return products.filter(product => {
        return product.category === category;
    });
}

/**
 * Apply multiple filters to products
 * @param {Array} products - Array of products
 * @param {Object} filters - Object containing filter criteria
 * @param {string} filters.search - Search query
 * @param {string} filters.category - Category filter
 * @returns {Array} Filtered products
 */
export function applyFilters(products, filters = {}) {
    let filtered = [...products];
    
    // Apply category filter
    if (filters.category) {
        filtered = filterByCategory(filtered, filters.category);
    }
    
    // Apply search filter
    if (filters.search) {
        filtered = filterBySearch(filtered, filters.search);
    }
    
    return filtered;
}

/**
 * Extract unique categories from products
 * @param {Array} products - Array of products
 * @returns {Array} Array of unique category strings
 */
export function extractCategories(products) {
    if (!Array.isArray(products) || products.length === 0) {
        return [];
    }
    
    const categories = products.map(product => product.category);
    const uniqueCategories = [...new Set(categories)];
    
    return uniqueCategories.filter(Boolean).sort();
}

/**
 * Sort products by various criteria
 * @param {Array} products - Array of products
 * @param {string} sortBy - Sort criteria ('price-asc', 'price-desc', 'name-asc', 'name-desc', 'rating')
 * @returns {Array} Sorted products
 */
export function sortProducts(products, sortBy = 'default') {
    const sorted = [...products];
    
    switch (sortBy) {
        case 'price-asc':
            return sorted.sort((a, b) => a.price - b.price);
            
        case 'price-desc':
            return sorted.sort((a, b) => b.price - a.price);
            
        case 'name-asc':
            return sorted.sort((a, b) => a.title.localeCompare(b.title));
            
        case 'name-desc':
            return sorted.sort((a, b) => b.title.localeCompare(a.title));
            
        case 'rating':
            return sorted.sort((a, b) => {
                const ratingA = a.rating?.rate || 0;
                const ratingB = b.rating?.rate || 0;
                return ratingB - ratingA;
            });
            
        default:
            return sorted;
    }
}

/**
 * Get products in a specific price range
 * @param {Array} products - Array of products
 * @param {number} minPrice - Minimum price (in USD)
 * @param {number} maxPrice - Maximum price (in USD)
 * @returns {Array} Filtered products
 */
export function filterByPriceRange(products, minPrice = 0, maxPrice = Infinity) {
    return products.filter(product => {
        const price = product.price || 0;
        return price >= minPrice && price <= maxPrice;
    });
}

/**
 * Get products with minimum rating
 * @param {Array} products - Array of products
 * @param {number} minRating - Minimum rating (0-5)
 * @returns {Array} Filtered products
 */
export function filterByRating(products, minRating = 0) {
    return products.filter(product => {
        const rating = product.rating?.rate || 0;
        return rating >= minRating;
    });
}

/**
 * Get product count by category
 * @param {Array} products - Array of products
 * @returns {Object} Object with category counts
 */
export function getCategoryCounts(products) {
    const counts = {};
    
    products.forEach(product => {
        const category = product.category || 'uncategorized';
        counts[category] = (counts[category] || 0) + 1;
    });
    
    return counts;
}

/**
 * Search products with fuzzy matching
 * @param {Array} products - Array of products
 * @param {string} query - Search query
 * @param {number} threshold - Similarity threshold (0-1)
 * @returns {Array} Matched products
 */
export function fuzzySearch(products, query, threshold = 0.6) {
    if (!query || query.trim() === '') {
        return products;
    }
    
    const searchTerm = query.toLowerCase().trim();
    
    return products.filter(product => {
        const title = (product.title || '').toLowerCase();
        
        // Simple fuzzy match: check if most characters are present
        const matches = searchTerm.split('').filter(char => title.includes(char)).length;
        const similarity = matches / searchTerm.length;
        
        return similarity >= threshold;
    });
}

/**
 * Highlight search term in text
 * @param {string} text - Text to highlight
 * @param {string} query - Search query
 * @returns {string} HTML string with highlighted terms
 */
export function highlightSearchTerm(text, query) {
    if (!query || query.trim() === '') {
        return text;
    }
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Debounce function for search input
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Validate filter object
 * @param {Object} filters - Filters to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function validateFilters(filters) {
    if (!filters || typeof filters !== 'object') {
        return false;
    }
    
    // Check that filter values are of correct types
    if (filters.search && typeof filters.search !== 'string') {
        return false;
    }
    
    if (filters.category && typeof filters.category !== 'string') {
        return false;
    }
    
    return true;
}