import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, ChefHat, ShoppingCart } from "lucide-react";
import { useBackend } from "../../hooks/useBackend";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateRecipeDialog } from "./CreateRecipeDialog";
import { MealPlanWeekView } from "./MealPlanWeekView";
import { useToast } from "@/components/ui/use-toast";
import { BottomNavigation } from "../BottomNavigation";

export function MealPlannerModule() {
  const navigate = useNavigate();
  const backend = useBackend();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [showCreateRecipe, setShowCreateRecipe] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1); // Get Monday of current week
    return monday.toISOString().split('T')[0];
  });

  const { data: recipes } = useQuery({
    queryKey: ["recipes"],
    queryFn: () => backend.meals.getRecipes(),
  });

  const { data: mealPlan } = useQuery({
    queryKey: ["meal-plan", currentWeek],
    queryFn: () => backend.meals.getMealPlan({ week_of: currentWeek }),
  });

  const addToShoppingListMutation = useMutation({
    mutationFn: async (data: { list_id: number; week_of: string }) => {
      const ingredients = await backend.meals.getWeekIngredients({ week_of: data.week_of });
      return backend.shopping.addItems({
        list_id: data.list_id,
        items: ingredients.ingredients,
      });
    },
    onSuccess: () => {
      toast({
        title: "Ingredients added",
        description: "All ingredients have been added to your shopping list.",
      });
    },
    onError: (error) => {
      console.error("Failed to add ingredients:", error);
      toast({
        title: "Error",
        description: "Failed to add ingredients to shopping list.",
        variant: "destructive",
      });
    },
  });

  const { data: shoppingLists } = useQuery({
    queryKey: ["shopping-lists"],
    queryFn: () => backend.shopping.getLists(),
  });

  const handleAddToShoppingList = () => {
    if (!shoppingLists?.lists.length) {
      toast({
        title: "No shopping lists",
        description: "Create a shopping list first to add ingredients.",
        variant: "destructive",
      });
      return;
    }

    // For now, add to the first shopping list
    // In a real app, you might want to show a selection dialog
    const firstList = shoppingLists.lists[0];
    addToShoppingListMutation.mutate({
      list_id: firstList.id,
      week_of: currentWeek,
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const current = new Date(currentWeek);
    const newDate = new Date(current);
    newDate.setDate(current.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newDate.toISOString().split('T')[0]);
  };

  const weekStart = new Date(currentWeek);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="text-white hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-white">Meal Planner</h1>
            <p className="text-white/80 text-sm">Plan your weekly meals</p>
          </div>
          <button
            onClick={() => setShowCreateRecipe(true)}
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateWeek('prev')}
            className="px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            ← Previous
          </button>
          <div className="text-center">
            <h2 className="font-semibold text-gray-900">
              {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </h2>
            <p className="text-sm text-gray-600">Week of {weekStart.toLocaleDateString()}</p>
          </div>
          <button
            onClick={() => navigateWeek('next')}
            className="px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            Next →
          </button>
        </div>

        {/* Add to Shopping List Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleAddToShoppingList}
            disabled={addToShoppingListMutation.isPending}
            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            {addToShoppingListMutation.isPending ? "Adding..." : "Add Ingredients to Shopping List"}
          </Button>
        </div>

        {/* Meal Plan Week View */}
        <MealPlanWeekView
          weekOf={currentWeek}
          mealPlan={mealPlan?.meal_plan}
          recipes={recipes?.recipes || []}
          onMealChange={() => {
            queryClient.invalidateQueries({ queryKey: ["meal-plan", currentWeek] });
          }}
        />

        {/* Recipe Book */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recipe Book</h3>
            <Button
              onClick={() => setShowCreateRecipe(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Recipe
            </Button>
          </div>
          
          {recipes && recipes.recipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recipes.recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  onClick={() => navigate(`/meals/recipe/${recipe.id}`)}
                  className="bg-white rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-orange-500"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <ChefHat className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{recipe.name}</h4>
                      <p className="text-sm text-gray-600">
                        Updated {new Date(recipe.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-orange-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-orange-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">No recipes yet</h4>
              <p className="text-sm text-gray-600 mb-3">Create your first recipe to get started</p>
              <Button
                onClick={() => setShowCreateRecipe(true)}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700"
              >
                Create Recipe
              </Button>
            </div>
          )}
        </div>
      </div>

      <CreateRecipeDialog
        open={showCreateRecipe}
        onOpenChange={setShowCreateRecipe}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["recipes"] });
          setShowCreateRecipe(false);
        }}
      />

      <BottomNavigation />
    </div>
  );
}
