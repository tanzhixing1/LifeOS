export type ProductCategoryId = 'daily' | 'materials' | 'gift' | 'special';

export type CurrencyType = 'gold' | 'gem' | 'ticket';

export type ShopCategory = {
  id: ProductCategoryId;
  name: string;
  description: string;
  unlocked: boolean;
  lockedReason?: string;
};

export type ShopProduct = {
  id: string;
  name: string;
  description: string;
  category: ProductCategoryId;
  price: number;
  currency: CurrencyType;
  itemId: string;
  icon: string;
  tags?: string[];
};
