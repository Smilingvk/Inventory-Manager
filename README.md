# Global Inventory

A responsive product catalog for browsing items, comparing prices across currencies, and preparing downloadable quotes. The interface is built with browser-native HTML, CSS, and JavaScript modules.

## Features

- Search products by title, description, or category.
- Filter by category and sort by price, name, or rating.
- Display prices in USD, EUR, GBP, JPY, or MXN.
- Build a quote with per-item quantities, unit prices, subtotals, and a grand total.
- Export quote details as JSON.
- Save the selected currency and quote in browser storage.
- Responsive desktop and mobile layouts with keyboard-accessible dialogs.

## Run locally

You need Python 3 and an internet connection for the catalog and exchange-rate services.

From the project root, start a local web server:

```bash
python3 -m http.server 8080 --directory src
```

Then open [http://localhost:8080](http://localhost:8080). Serve the app over HTTP; opening `src/index.html` directly can prevent JavaScript modules from loading.

## Data and limitations

- Product data comes from [FakeStore API](https://fakestoreapi.com/).
- Exchange rates come from [ExchangeRate-API](https://www.exchangerate-api.com/). If the service is unavailable, the app uses built-in reference rates and displays a notice.
- The quote and selected currency are stored in the current browser's `localStorage`.
- This demo catalog does not track real stock, suppliers, orders, taxes, or shipping.

## Project structure

```text
src/
├── index.html
├── favicon.svg
├── css/
│   └── styles.css
└── js/
    ├── apiService.js
    ├── currencyLogic.js
    ├── filterService.js
    ├── inventoryRenderer.js
    ├── main.js
    ├── product.js
    └── storage.js
```
