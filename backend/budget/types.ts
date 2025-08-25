export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category_id: number | null;
  date: Date;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface BudgetSummary {
  total_income: number;
  total_expenses: number;
  net_balance: number;
  current_month_income: number;
  current_month_expenses: number;
}
