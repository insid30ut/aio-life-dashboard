import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowLeft, ShoppingCart } from "lucide-react";
import { useBackend } from "../../hooks/useBackend";
import { CreateShoppingListDialog } from "./CreateShoppingListDialog";
import { useState } from "react";
import { BottomNavigation } from "../BottomNavigation";

export function ShoppingModule() {
  const navigate = useNavigate();
  const backend = useBackend();
  const [showCreateList, setShowCreateList] = useState(false);

  const { data: lists, refetch } = useQuery({
    queryKey: ["shopping-lists"],
    queryFn: () => backend.shopping.getLists(),
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 px-4 py-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="text-white hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-white">Shopping Hub</h1>
            <p className="text-white/80 text-sm">Manage your shopping lists</p>
          </div>
          <button
            onClick={() => setShowCreateList(true)}
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Shopping Lists */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Lists</h2>
          {lists && lists.lists.length > 0 ? (
            <div className="space-y-4">
              {lists.lists.map((list) => (
                <div
                  key={list.id}
                  onClick={() => navigate(`/shopping/list/${list.id}`)}
                  className="bg-white rounded-3xl p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-green-500"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <ShoppingCart className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {list.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Updated {new Date(list.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No shopping lists yet</h3>
              <p className="text-gray-600 mb-4">Create your first shopping list to get started</p>
              <button
                onClick={() => setShowCreateList(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Create List
              </button>
            </div>
          )}
        </div>
      </div>

      <CreateShoppingListDialog
        open={showCreateList}
        onOpenChange={setShowCreateList}
        onSuccess={() => {
          refetch();
          setShowCreateList(false);
        }}
      />

      <BottomNavigation />
    </div>
  );
}
