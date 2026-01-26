export type Role = 'admin' | 'vendedor' | 'gerente' | 'deposito';

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  code: string;
  category?: string;
  costPrice?: number;
}

export interface Client {
  id: string;
  name: string;
  dni: string;
  balance: number;
}

export interface PriceList {
  id: string;
  name: string;
  discount: number;
}

export interface ExtractedQuoteItem {
  description: string;
  quantity: number;
}

export interface QuoteItem extends Product {
  qty: number;
}