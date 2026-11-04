const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'MXN'];

export function isValidCurrency(currency) {
    return SUPPORTED_CURRENCIES.includes(currency);
}

export function convertPrice(usdPrice, targetCurrency, exchangeRates) {
    if (typeof usdPrice !== 'number' || !Number.isFinite(usdPrice)) return 0;
    if (targetCurrency === 'USD') return usdPrice;

    const rate = exchangeRates?.[targetCurrency];
    if (!Number.isFinite(rate) || rate <= 0) {
        console.warn(`No valid exchange rate for ${targetCurrency}; keeping the USD amount.`);
        return usdPrice;
    }
    return usdPrice * rate;
}

export function formatPrice(price, currency) {
    const safePrice = Number.isFinite(price) ? price : 0;
    const safeCurrency = isValidCurrency(currency) ? currency : 'USD';
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: safeCurrency,
            maximumFractionDigits: safeCurrency === 'JPY' ? 0 : 2
        }).format(safePrice);
    } catch (error) {
        return `${safeCurrency} ${safePrice.toFixed(safeCurrency === 'JPY' ? 0 : 2)}`;
    }
}

export function convertAndFormat(usdPrice, targetCurrency, exchangeRates) {
    return formatPrice(convertPrice(usdPrice, targetCurrency, exchangeRates), targetCurrency);
}

export function calculateTotal(items, currency, exchangeRates) {
    if (!Array.isArray(items)) return 0;
    const digits = currency === 'JPY' ? 0 : 2;
    const total = items.reduce((sum, item) => {
        const subtotal = convertPrice(item.price * (item.quantity || 1), currency, exchangeRates);
        return sum + Number(subtotal.toFixed(digits));
    }, 0);
    return Number(total.toFixed(digits));
}
