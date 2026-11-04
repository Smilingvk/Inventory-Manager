/** Normalized product shape used by the catalog and quote. */
export class Product {
    constructor(data = {}) {
        this.id = Number(data.id);
        this.title = typeof data.title === 'string' ? data.title.trim() : '';
        this.price = Number(data.price);
        this.description = typeof data.description === 'string' ? data.description : '';
        this.category = typeof data.category === 'string' ? data.category : '';
        this.image = typeof data.image === 'string' ? data.image : '';
        this.rating = {
            rate: Number(data.rating?.rate) || 0,
            count: Number(data.rating?.count) || 0
        };
    }

    isValid() {
        return Number.isInteger(this.id) && this.id > 0 &&
            this.title.length > 0 &&
            Number.isFinite(this.price) && this.price >= 0 &&
            this.category.length > 0 &&
            this.image.length > 0 &&
            this.rating.rate >= 0 && this.rating.rate <= 5 &&
            this.rating.count >= 0;
    }

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
}
