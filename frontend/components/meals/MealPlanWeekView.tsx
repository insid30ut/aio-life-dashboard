import { useMutation } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useBackend } from "../../hooks/useBackend";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import type { MealPlanWithEntries, Recipe } from "~backend/meals/types";

interface MealPlanWeekViewProps {
  weekOf: string;
  mealPlan?: MealPlanWithEntries;
  recipes: Recipe[];
  onMealChange: () => void;
}

const DAYS = [
  { name: 'Monday', value: 1 },
  { name: 'Tuesday', value: 2 },
  { name: 'Wednesday', value: 3 },
  { name: 'Thursday', value: 4 },
  { name: 'Friday', value: 5 },
  { name: 'Saturday', value: 6 },
  { name: 'Sunday', value: 0 },
];

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const;

export function MealPlanWeekView({ weekOf, mealPlan, recipes, onMealChange }: MealPlanWeekViewProps) {
  const backend = useBackend();
  const { toast } = useToast();
  const [editingMeal, setEditingMeal] = useState<{ day: number; mealType: string } | null>(null);
  const [customMealText, setCustomMealText] = useState("");

  const setMealMutation = useMutation({
    mutationFn: (data: {
      week_of: string;
      day_of_week: number;
      meal_type: 'breakfast' | 'lunch' | 'dinner';
      recipe_id?: number;
      custom_meal?: string;
    }) => backend.meals.setMeal(data),
    onSuccess: () => {
      onMealChange();
      setEditingMeal(null);
      setCustomMealText("");
    },
    onError: (error) => {
      console.error("Failed to set meal:", error);
      toast({
        title: "Error",
        description: "Failed to set meal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeMealMutation = useMutation({
    mutationFn: (data: {
      week_of: string;
      day_of_week: number;
      meal_type: 'breakfast' | 'lunch' | 'dinner';
    }) => backend.meals.removeMeal(data),
    onSuccess: () => {
      onMealChange();
    },
    onError: (error) => {
      console.error("Failed to remove meal:", error);
      toast({
        title: "Error",
        description: "Failed to remove meal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getMealForSlot = (dayOfWeek: number, mealType: string) => {
    return mealPlan?.entries.find(
      entry => entry.day_of_week === dayOfWeek && entry.meal_type === mealType
    );
  };

  const handleSetRecipe = (dayOfWeek: number, mealType: 'breakfast' | 'lunch' | 'dinner', recipeId: string) => {
    if (recipeId === 'custom') {
      setEditingMeal({ day: dayOfWeek, mealType });
      return;
    }

    setMealMutation.mutate({
      week_of: weekOf,
      day_of_week: dayOfWeek,
      meal_type: mealType,
      recipe_id: parseInt(recipeId),
    });
  };

  const handleSetCustomMeal = () => {
    if (!editingMeal || !customMealText.trim()) return;

    setMealMutation.mutate({
      week_of: weekOf,
      day_of_week: editingMeal.day,
      meal_type: editingMeal.mealType as 'breakfast' | 'lunch' | 'dinner',
      custom_meal: customMealText.trim(),
    });
  };

  const handleRemoveMeal = (dayOfWeek: number, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    removeMealMutation.mutate({
      week_of: weekOf,
      day_of_week: dayOfWeek,
      meal_type: mealType,
    });
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Meal Plan</h3>
      
      <div className="space-y-6">
        {DAYS.map((day) => (
          <div key={day.value} className="border-b border-gray-100 pb-4 last:border-b-0">
            <h4 className="font-medium text-gray-900 mb-3">{day.name}</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {MEAL_TYPES.map((mealType) => {
                const meal = getMealForSlot(day.value, mealType);
                const isEditing = editingMeal?.day === day.value && editingMeal?.mealType === mealType;
                
                return (
                  <div key={mealType} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {mealType}
                      </span>
                      {meal && (
                        <button
                          onClick={() => handleRemoveMeal(day.value, mealType)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={customMealText}
                          onChange={(e) => setCustomMealText(e.target.value)}
                          placeholder="Enter custom meal..."
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSetCustomMeal}
                            disabled={!customMealText.trim() || setMealMutation.isPending}
                            className="flex-1"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingMeal(null);
                              setCustomMealText("");
                            }}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : meal ? (
                      <div className="text-sm text-gray-900">
                        {meal.custom_meal || recipes.find(r => r.id === meal.recipe_id)?.name || 'Unknown recipe'}
                      </div>
                    ) : (
                      <Select onValueChange={(value) => handleSetRecipe(day.value, mealType, value)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Add meal" />
                        </SelectTrigger>
                        <SelectContent>
                          {recipes.map((recipe) => (
                            <SelectItem key={recipe.id} value={recipe.id.toString()}>
                              {recipe.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">Custom meal...</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
