import { api, APIError } from "encore.dev/api";
import { budgetDB } from "./db";
import type { Transaction, BudgetSummary, TransactionWithCategory } from "./types";
import type { AuthPayload } from "~backend/auth/auth";

export interface CreateTransactionRequest {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category_id?: number;
  date: string;
}

export interface CreateTransactionResponse {
  transaction: Transaction;
}

export interface GetTransactionsResponse {
  transactions: TransactionWithCategory[];
}

export interface GetSummaryResponse {
  summary: BudgetSummary;
}

export interface UpdateTransactionRequest {
  id: number;
  description?: string;
  amount?: number;
  type?: 'income' | 'expense';
  category_id?: number;
  date?: string;
}

export interface UpdateTransactionResponse {
  transaction: Transaction;
}

// Creates a new transaction.
export const createTransaction = api<CreateTransactionRequest, CreateTransactionResponse>(
  { expose: true, method: "POST", path: "/budget/transactions", auth: true },
  async ({ auth, ...req }: { auth: AuthPayload } & CreateTransactionRequest) => {
    // Also verify the category belongs to the user
    if (req.category_id) {
        const category = await budgetDB.queryRow`
            SELECT id FROM categories
            WHERE id = ${req.category_id} AND user_id = ${auth.userID}
        `;
        if (!category) {
            throw APIError.notFound("category not found");
        }
    }

    const transaction = await budgetDB.queryRow<Transaction>`
      INSERT INTO transactions (description, amount, type, category_id, date, user_id)
      VALUES (${req.description}, ${req.amount}, ${req.type}, ${req.category_id || null}, ${req.date}, ${auth.userID})
      RETURNING *
    `;
    
    if (!transaction) {
      throw APIError.internal("failed to create transaction");
    }
    
    return { transaction };
  }
);

// Gets all transactions for the current user, with their categories.
export const getTransactions = api<void, GetTransactionsResponse>(
  { expose: true, method: "GET", path: "/budget/transactions", auth: true },
  async ({ auth }: { auth: AuthPayload }) => {
    const transactions = await budgetDB.queryAll<TransactionWithCategory>`
      SELECT
        t.*,
        row_to_json(c) as category
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ${auth.userID}
      ORDER BY t.date DESC, t.created_at DESC
    `;

    transactions.forEach(t => {
      if (t.category && (t.category as any).id === null) {
        t.category = undefined;
      }
    });

    return { transactions };
  }
);

// Gets budget summary for the current user.
export const getSummary = api<void, GetSummaryResponse>(
  { expose: true, method: "GET", path: "/budget/summary", auth: true },
  async ({ auth }: { auth: AuthPayload }) => {
    const currentMonth = new Date();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    const summary = await budgetDB.queryRow<{
      total_income: number;
      total_expenses: number;
      current_month_income: number;
      current_month_expenses: number;
    }>`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
        COALESCE(SUM(CASE WHEN type = 'income' AND date >= ${firstDayOfMonth} AND date <= ${lastDayOfMonth} THEN amount ELSE 0 END), 0) as current_month_income,
        COALESCE(SUM(CASE WHEN type = 'expense' AND date >= ${firstDayOfMonth} AND date <= ${lastDayOfMonth} THEN amount ELSE 0 END), 0) as current_month_expenses
      FROM transactions
      WHERE user_id = ${auth.userID}
    `;
    
    if (!summary) {
      // This should not happen with COALESCE, but as a safeguard:
      return { summary: { total_income: 0, total_expenses: 0, net_balance: 0, current_month_income: 0, current_month_expenses: 0 } };
    }
    
    const budgetSummary: BudgetSummary = {
      total_income: summary.total_income,
      total_expenses: summary.total_expenses,
      net_balance: summary.total_income - summary.total_expenses,
      current_month_income: summary.current_month_income,
      current_month_expenses: summary.current_month_expenses,
    };
    
    return { summary: budgetSummary };
  }
);

// Updates a transaction.
export const updateTransaction = api<UpdateTransactionRequest, UpdateTransactionResponse>(
  { expose: true, method: "PUT", path: "/budget/transactions/:id", auth: true },
  async ({ auth, ...req }: { auth: AuthPayload } & UpdateTransactionRequest) => {
    const updates: string[] = [];
    const values: any[] = [];
    
    if (req.description !== undefined) {
      updates.push(`description = $${values.length + 1}`);
      values.push(req.description);
    }
    
    if (req.amount !== undefined) {
      updates.push(`amount = $${values.length + 1}`);
      values.push(req.amount);
    }
    
    if (req.type !== undefined) {
      updates.push(`type = $${values.length + 1}`);
      values.push(req.type);
    }
    
    if (req.category_id !== undefined) {
      updates.push(`category_id = $${values.length + 1}`);
      values.push(req.category_id);
    }
    
    if (req.date !== undefined) {
      updates.push(`date = $${values.length + 1}`);
      values.push(req.date);
    }
    
    updates.push(`updated_at = NOW()`);
    
    if (updates.length === 1) { // Only updated_at
      throw APIError.invalidArgument("no fields to update");
    }
    
    const query = `
      UPDATE transactions 
      SET ${updates.join(', ')}
      WHERE id = $${values.length + 1} AND user_id = $${values.length + 2}
      RETURNING *
    `;
    values.push(req.id, auth.userID);
    
    const transaction = await budgetDB.rawQueryRow<Transaction>(query, ...values);
    
    if (!transaction) {
      throw APIError.notFound("transaction not found");
    }
    
    return { transaction };
  }
);

// Deletes a transaction.
export const deleteTransaction = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/budget/transactions/:id", auth: true },
  async ({ auth, id }: { auth: AuthPayload; id: number }) => {
    await budgetDB.exec`
      DELETE FROM transactions
      WHERE id = ${id} AND user_id = ${auth.userID}
    `;
  }
);
