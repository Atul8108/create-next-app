// the shape I want to work with in the UI (camelCase, restructured, only fields you use).

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: {
    amount: number;
    currency: string;
  };
  imageUrl: string;
}
