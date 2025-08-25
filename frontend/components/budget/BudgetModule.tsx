import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, DollarSign, TrendingUp, TrendingDown, PieChart } from "lucide-react";
import { useBackend } from "../../hooks/useBackend";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateTransactionDialog } from "./CreateTransactionDialog";
import { CreateCategoryDialog } from "./CreateCategoryDialog";
import { BottomNavigation } from "../BottomNavigation";

export function BudgetModule() {
  const navigate = useNavigate();
  const backend = useBackend();
  const queryClient = useQueryClient();
  
  const [showCreateTransaction, setShowCreateTransaction] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);

  const { data: transactions } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => backend.budget.getTransactions(),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => backend.budget.getCategories(),
  });

  const { data: summary } = useQuery({
    queryKey: ["budget-summary"],
    queryFn: () => backend.budget.getSummary(),
  });

  const currentMonth = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  const recentTransactions = transactions?.transactions.slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="text-white hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-white">Budget Tracker</h1>
            <p className="text-white/80 text-sm">Track your finances for {currentMonth}</p>
          </div>
          <button
            onClick={() => setShowCreateTransaction(true)}
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl p-5 shadow-sm border-l-4 border-l-green-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Income</p>
                  <p className="text-xl font-bold text-green-600">
                    ${summary.summary.total_income.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border-l-4 border-l-red-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Expenses</p>
                  <p className="text-xl font-bold text-red-600">
                    ${summary.summary.total_expenses.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border-l-4 border-l-blue-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Net Balance</p>
                  <p className={`text-xl font-bold ${
                    summary.summary.net_balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${summary.summary.net_balance.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Button
            onClick={() => setShowCreateTransaction(true)}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
          <Button
            onClick={() => setShowCreateCategory(true)}
            variant="outline"
            className="flex-1"
          >
            <PieChart className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            {transactions && transactions.transactions.length > 5 && (
              <button className="text-purple-600 text-sm font-medium">
                View All ({transactions.transactions.length})
              </button>
            )}
          </div>
          
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-600">
                        {categories?.categories.find(c => c.id === transaction.category_id)?.name || 'Uncategorized'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-purple-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">No transactions yet</h4>
              <p className="text-sm text-gray-600 mb-3">Start tracking your finances</p>
              <Button
                onClick={() => setShowCreateTransaction(true)}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                Add Transaction
              </Button>
            </div>
          )}
        </div>

        {/* Categories */}
        {categories && categories.categories.length > 0 && (
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.categories.map((category) => (
                <div key={category.id} className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="font-medium text-gray-900">{category.name}</p>
                  <p className="text-sm text-gray-600 capitalize">{category.type}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <CreateTransactionDialog
        open={showCreateTransaction}
        onOpenChange={setShowCreateTransaction}
        categories={categories?.categories || []}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
          queryClient.invalidateQueries({ queryKey: ["budget-summary"] });
          setShowCreateTransaction(false);
        }}
      />

      <CreateCategoryDialog
        open={showCreateCategory}
        onOpenChange={setShowCreateCategory}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["categories"] });
          setShowCreateCategory(false);
        }}
      />

      <BottomNavigation />
    </div>
  );
}
