import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Check, RotateCcw, Trash2 } from "lucide-react";
import { useBackend } from "../../hooks/useBackend";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";

export function ShoppingListDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const backend = useBackend();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [newItemName, setNewItemName] = useState("");

  const { data: listData, isLoading } = useQuery({
    queryKey: ["shopping-list", id],
    queryFn: () => backend.shopping.getList({ id: parseInt(id!) }),
    enabled: !!id,
  });

  const createItemMutation = useMutation({
    mutationFn: (data: { name: string; list_id: number }) =>
      backend.shopping.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list", id] });
      setNewItemName("");
    },
    onError: (error) => {
      console.error("Failed to create item:", error);
      toast({
        title: "Error",
        description: "Failed to add item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: (data: { id: number; is_checked?: boolean; name?: string }) =>
      backend.shopping.updateItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list", id] });
    },
    onError: (error) => {
      console.error("Failed to update item:", error);
      toast({
        title: "Error",
        description: "Failed to update item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: number) =>
      backend.shopping.deleteItem({ id: itemId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list", id] });
    },
    onError: (error) => {
      console.error("Failed to delete item:", error);
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const uncheckAllMutation = useMutation({
    mutationFn: () => backend.shopping.uncheckAllItems({ list_id: parseInt(id!) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list", id] });
      toast({
        title: "Items unchecked",
        description: "All items have been unchecked.",
      });
    },
    onError: (error) => {
      console.error("Failed to uncheck items:", error);
      toast({
        title: "Error",
        description: "Failed to uncheck items. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shopping list...</p>
        </div>
      </div>
    );
  }

  if (!listData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Shopping list not found</h2>
          <Button onClick={() => navigate("/shopping")}>Back to Shopping</Button>
        </div>
      </div>
    );
  }

  const { list } = listData;
  const checkedItems = list.items.filter(item => item.is_checked);
  const uncheckedItems = list.items.filter(item => !item.is_checked);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    createItemMutation.mutate({
      name: newItemName.trim(),
      list_id: list.id,
    });
  };

  const handleToggleItem = (itemId: number, checked: boolean) => {
    updateItemMutation.mutate({
      id: itemId,
      is_checked: checked,
    });
  };

  const handleDeleteItem = (itemId: number) => {
    deleteItemMutation.mutate(itemId);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 px-4 py-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/shopping")}
            className="text-white hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-white">{list.title}</h1>
            <p className="text-white/80 text-sm">
              {uncheckedItems.length} remaining, {checkedItems.length} completed
            </p>
          </div>
          {checkedItems.length > 0 && (
            <button
              onClick={() => uncheckAllMutation.mutate()}
              disabled={uncheckAllMutation.isPending}
              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Add Item Form */}
        <form onSubmit={handleAddItem} className="flex gap-2">
          <Input
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Add an item..."
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!newItemName.trim() || createItemMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </form>

        {/* Unchecked Items */}
        {uncheckedItems.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Shopping List</h3>
            <div className="space-y-2">
              {uncheckedItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3"
                >
                  <Checkbox
                    checked={item.is_checked}
                    onCheckedChange={(checked) =>
                      handleToggleItem(item.id, checked as boolean)
                    }
                  />
                  <span className="flex-1 text-gray-900">{item.name}</span>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Checked Items */}
        {checkedItems.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Completed</h3>
            <div className="space-y-2">
              {checkedItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50 rounded-xl p-4 flex items-center gap-3"
                >
                  <Checkbox
                    checked={item.is_checked}
                    onCheckedChange={(checked) =>
                      handleToggleItem(item.id, checked as boolean)
                    }
                  />
                  <span className="flex-1 text-gray-500 line-through">{item.name}</span>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {list.items.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Plus className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Empty list</h3>
            <p className="text-gray-600">Add your first item to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
