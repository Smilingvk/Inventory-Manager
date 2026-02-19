/**
 * Product Class
 * Represents a product with its properties and methods
 * ES6 Class implementation for data handling
 */

export class Product {
    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.price = data.price;
        this.description = data.description;
        this.category = data.category;
        this.image = data.image;
        this.rating = data.rating || { rate: 0, count: 0 };
    }

    /**
     * Get formatted product title (truncated if necessary)
     * @param {number} maxLength - Maximum length of title
     * @returns {string} Formatted title
     */
    getFormattedTitle(maxLength = 50) {
        if (this.title.length <= maxLength) {
            return this.title;
        }
        return `${this.title.substring(0, maxLength)}...`;
    }

    /**
     * Get formatted description (truncated if necessary)
     * @param {number} maxLength - Maximum length of description
     * @returns {string} Formatted description
     */
    getFormattedDescription(maxLength = 100) {
        if (this.description.length <= maxLength) {
            return this.description;
        }
        return `${this.description.substring(0, maxLength)}...`;
    }

    /**
     * Get star rating as a number
     * @returns {number} Rating value
     */
    getRating() {
        return this.rating.rate || 0;
    }

    /**
     * Get review count
     * @returns {number} Number of reviews
     */
    getReviewCount() {
        return this.rating.count || 0;
    }

    /**
     * Check if product matches search query
     * @param {string} query - Search query
     * @returns {boolean} True if matches, false otherwise
     */
    matchesSearch(query) {
        if (!query || query.trim() === '') {
            return true;
        }

        const searchTerm = query.toLowerCase().trim();
        const titleMatch = this.title.toLowerCase().includes(searchTerm);
        const descMatch = this.description.toLowerCase().includes(searchTerm);
        const categoryMatch = this.category.toLowerCase().includes(searchTerm);

        return titleMatch || descMatch || categoryMatch;
    }

    /**
     * Check if product belongs to category
     * @param {string} category - Category to check
     * @returns {boolean} True if matches, false otherwise
     */
    isInCategory(category) {
        if (!category || category === 'all') {
            return true;
        }
        return this.category === category;
    }

    /**
     * Get product as plain object (for storage/export)
     * @returns {Object} Plain object representation
     */
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            price: this.price,
            description: this.description,
            category: this.category,
            image: this.image,
            rating: this.rating
        };
    }

    /**
     * Create Product instance from plain object
     * @param {Object} data - Product data
     * @returns {Product} Product instance
     */
    static fromJSON(data) {
        return new Product(data);
    }

    /**
     * Validate product data
     * @returns {boolean} True if valid, false otherwise
     */
    isValid() {
        return (
            this.id !== undefined &&
            this.title &&
            this.price > 0 &&
            this.description &&
            this.category &&
            this.image
        );
    }
}

/**
 * ProductCollection Class
 * Manages a collection of products
 */
export class ProductCollection {
    constructor(products = []) {
        this.products = products.map(p => p instanceof Product ? p : new Product(p));
    }

    /**
     * Get all products
     * @returns {Array<Product>} Array of products
     */
    getAll() {
        return this.products;
    }

    /**
     * Get product by ID
     * @param {number} id - Product ID
     * @returns {Product|null} Product or null if not found
     */
    getById(id) {
        return this.products.find(p => p.id === id) || null;
    }

    /**
     * Filter products by category
     * @param {string} category - Category to filter by
     * @returns {Array<Product>} Filtered products
     */
    filterByCategory(category) {
        if (!category || category === 'all') {
            return this.products;
        }
        return this.products.filter(p => p.isInCategory(category));
    }

    /**
     * Search products
     * @param {string} query - Search query
     * @returns {Array<Product>} Matching products
     */
    search(query) {
        if (!query || query.trim() === '') {
            return this.products;
        }
        return this.products.filter(p => p.matchesSearch(query));
    }

    /**
     * Apply multiple filters
     * @param {Object} filters - Filter criteria
     * @returns {Array<Product>} Filtered products
     */
    applyFilters(filters = {}) {
        let results = this.products;

        if (filters.category) {
            results = results.filter(p => p.isInCategory(filters.category));
        }

        if (filters.search) {
            results = results.filter(p => p.matchesSearch(filters.search));
        }

        return results;
    }

    /**
     * Get unique categories
     * @returns {Array<string>} Array of categories
     */
    getCategories() {
        const categories = this.products.map(p => p.category);
        return [...new Set(categories)].filter(Boolean).sort();
    }

    /**
     * Get product count
     * @returns {number} Number of products
     */
    count() {
        return this.products.length;
    }

    /**
     * Sort products
     * @param {string} sortBy - Sort criteria
     * @returns {Array<Product>} Sorted products
     */
    sort(sortBy = 'default') {
        const sorted = [...this.products];

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
                return sorted.sort((a, b) => b.getRating() - a.getRating());
            default:
                return sorted;
        }
    }
}