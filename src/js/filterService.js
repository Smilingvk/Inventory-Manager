/** Search, category filtering, and stable display sorting for catalog products. */
export function applyFilters(products, filters = {}) {
    const search = typeof filters.search === 'string' ? filters.search.trim().toLocaleLowerCase('en-US') : '';

    return products.filter(product => {
        const matchesCategory = !filters.category || filters.category === 'all' ||
            product.category === filters.category;
        const searchableText = `${product.title} ${product.description} ${product.category}`
            .toLocaleLowerCase('en-US');
        return matchesCategory && (!search || searchableText.includes(search));
    });
}

export function extractCategories(products) {
    return [...new Set(products.map(product => product.category).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, 'en-US')
    );
}

export function formatCategory(category) {
    const labels = {
        "men's clothing": "Men's clothing",
        "women's clothing": "Women's clothing",
        jewelery: 'Jewelry',
        electronics: 'Electronics'
    };
    const normalizedCategory = category.toLocaleLowerCase('en-US');
    return Object.hasOwn(labels, normalizedCategory) ? labels[normalizedCategory] : category;
}

export function sortProducts(products, sortBy = 'featured') {
    const sorted = [...products];
    const sorters = {
        'price-asc': (a, b) => a.price - b.price,
        'price-desc': (a, b) => b.price - a.price,
        'name-asc': (a, b) => a.title.localeCompare(b.title, 'en-US'),
        'rating-desc': (a, b) => b.rating.rate - a.rating.rate
    };
    return sorters[sortBy] ? sorted.sort(sorters[sortBy]) : sorted;
}

export function debounce(callback, wait = 250) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => callback(...args), wait);
    };
}
