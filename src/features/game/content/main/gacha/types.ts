export type GachaCurrency = 'gold' | 'gem' | 'ticket';

export type GachaReward = {
  id: string;
  itemId: string;
  amount: number;
  weight: number;
};

export type GachaPool = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  costCurrency: GachaCurrency;
  costAmount: number;
  rewards: GachaReward[];
};
