import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Trash2, Plus } from "lucide-react";
import { useBackend } from "../../hooks/useBackend";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

export function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const backend = useBackend();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [ingredients, setIngredients] = useState<{ name: string; quantity: string }[]>([]);

  const { data: recipeData, isLoading } = useQuery({
    queryKey: ["recipe", id],
    queryFn: () => backend.meals.getRecipe({ id: parseInt(id!) }),
    enabled: !!id,
    onSuccess: (data) => {
      if (data?.recipe) {
        setName(data.recipe.name);
        setInstructions(data.recipe.instructions);
        setIngredients(data.recipe.ingredients.map(ing => ({
          name: ing.name,
          quantity: ing.quantity
        })));
      }
    },
  });

  const updateRecipeMutation = useMutation({
    mutationFn: (data: {
      id: number;
      name: string;
      instructions: string;
      ingredients: { name: string; quantity: string }[];
    }) => backend.meals.updateRecipe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipe", id] });
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      setIsEditing(false);
      toast({
        title: "Recipe updated",
        description: "Your recipe has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Failed to update recipe:", error);
      toast({
        title: "Error",
        description: "Failed to update recipe. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteRecipeMutation = useMutation({
    mutationFn: () => backend.meals.deleteRecipe({ id: parseInt(id!) }),
    onSuccess: () => {
      toast({
        title: "Recipe deleted",
        description: "Your recipe has been deleted successfully.",
      });
      navigate("/meals");
    },
    onError: (error) => {
      console.error("Failed to delete recipe:", error);
      toast({
        title: "Error",
        description: "Failed to delete recipe. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recipe...</p>
        </div>
      </div>
    );
  }

  if (!recipeData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Recipe not found</h2>
          <Button onClick={() => navigate("/meals")}>Back to Meal Planner</Button>
        </div>
      </div>
    );
  }

  const { recipe } = recipeData;

  const handleSave = () => {
    if (!name.trim() || !instructions.trim()) return;

    const validIngredients = ingredients.filter(ing => ing.name.trim() && ing.quantity.trim());
    if (validIngredients.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one ingredient.",
        variant: "destructive",
      });
      return;
    }

    updateRecipeMutation.mutate({
      id: recipe.id,
      name: name.trim(),
      instructions: instructions.trim(),
      ingredients: validIngredients,
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this recipe?")) {
      deleteRecipeMutation.mutate();
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", quantity: "" }]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (index: number, field: 'name' | 'quantity', value: string) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const startEditing = () => {
    setName(recipe.name);
    setInstructions(recipe.instructions);
    setIngredients(recipe.ingredients.map(ing => ({
      name: ing.name,
      quantity: ing.quantity
    })));
    setIsEditing(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/meals")}
            className="text-white hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-white">
              {isEditing ? "Edit Recipe" : recipe.name}
            </h1>
            <p className="text-white/80 text-sm">
              {isEditing ? "Make your changes below" : "Recipe details"}
            </p>
          </div>
          {!isEditing && (
            <div className="flex gap-2">
              <button
                onClick={startEditing}
                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteRecipeMutation.isPending}
                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-6">
        {isEditing ? (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Recipe Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="mt-1"
                    rows={6}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Ingredients</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addIngredient}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Ingredient
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {ingredients.map((ingredient, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={ingredient.name}
                          onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                          placeholder="Ingredient name..."
                          className="flex-1"
                        />
                        <Input
                          value={ingredient.quantity}
                          onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                          placeholder="Quantity..."
                          className="w-32"
                        />
                        {ingredients.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeIngredient(index)}
                            className="px-3"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={updateRecipeMutation.isPending}
                    className="flex-1"
                  >
                    {updateRecipeMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Ingredients */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ingredients</h3>
              <div className="space-y-2">
                {recipe.ingredients.map((ingredient) => (
                  <div key={ingredient.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-gray-900">{ingredient.name}</span>
                    <span className="text-gray-600 font-medium">{ingredient.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h3>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{recipe.instructions}</p>
              </div>
            </div>

            {/* Recipe Info */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recipe Info</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Created: {new Date(recipe.created_at).toLocaleString()}</p>
                <p>Last updated: {new Date(recipe.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
