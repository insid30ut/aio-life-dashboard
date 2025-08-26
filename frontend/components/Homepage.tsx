import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { CheckSquare, User, Loader2 } from "lucide-react";
import { useBackend } from "@/hooks/useBackend";
import { BottomNavigation } from "@/components/BottomNavigation";
import { FeatureCard } from "@/components/FeatureCard";
import { PRIMARY_FEATURES, SECONDARY_FEATURES } from "@/lib/constants";
import { useAppStore } from "@/store/appStore";
import { useToast } from "@/components/ui/use-toast";
import { useEffect } from "react";

export function Homepage() {
  const navigate = useNavigate();
  const backend = useBackend();
  const openQuickAdd = useAppStore((s) => s.openQuickAdd);
  const { toast } = useToast();

  const { data: boards, isLoading: isLoadingBoards, isError: isErrorBoards } = useQuery({
    queryKey: ["boards"],
    queryFn: () => backend.tasks.listBoards(),
  });

  const { data: todayCards, isLoading: isLoadingTodayCards, isError: isErrorTodayCards } = useQuery({
    queryKey: ["today-cards"],
    queryFn: () => backend.tasks.getTodayCards(),
  });

  const { data: shoppingLists, isLoading: isLoadingShoppingLists, isError: isErrorShoppingLists } = useQuery({
    queryKey: ["shopping-lists"],
    queryFn: () => backend.shopping.getLists(),
  });

  const { data: recipes, isLoading: isLoadingRecipes, isError: isErrorRecipes } = useQuery({
    queryKey: ["recipes"],
    queryFn: () => backend.meals.getRecipes(),
  });

  const isError = isErrorBoards || isErrorTodayCards || isErrorShoppingLists || isErrorRecipes;

  useEffect(() => {
    if (isError) {
      toast({
        title: "Error",
        description: "Could not load dashboard data. Please try again later.",
        variant: "destructive",
      });
    }
  }, [isError, toast]);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const quickStats = [
    {
      title: "Tasks",
      value: boards?.boards?.length,
      isLoading: isLoadingBoards,
      color: "border-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Shopping",
      value: shoppingLists?.lists?.length,
      isLoading: isLoadingShoppingLists,
      color: "border-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      title: "Recipes",
      value: recipes?.recipes?.length,
      isLoading: isLoadingRecipes,
      color: "border-orange-500",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
    },
  ];

  const handleFeatureClick = (path: string) => {
    if (path === 'quick-add') {
      openQuickAdd();
    } else {
      navigate(path);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Section */}
      <div className="h-30 bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              Welcome Back!
            </h1>
            <p className="text-white/80 mt-1">{currentDate}</p>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Quick Stats Section */}
      <div className="px-4 py-6">
        <div className="flex gap-4 overflow-x-auto">
          {quickStats.map((stat, index) => (
            <div
              key={index}
              className={`min-w-[100px] h-20 bg-white rounded-2xl p-4 shadow-sm ${stat.color} border-l-4 ${stat.bgColor} flex flex-col justify-center`}
            >
              <div className={`text-sm font-medium ${stat.textColor}`}>
                {stat.title}
              </div>
              <div className={`text-xl font-bold ${stat.textColor} mt-1`}>
                {stat.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stat.value ?? 0}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Tasks Preview */}
      <div className="px-4 mb-6">
        {isLoadingTodayCards ? (
          <div className="bg-white rounded-3xl p-5 shadow-sm border-l-4 border-l-blue-500 space-y-3">
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
          </div>
        ) : todayCards && todayCards.cards.length > 0 && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border-l-4 border-l-blue-500">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Due Today</h3>
              <button
                onClick={() => navigate("/tasks/today")}
                className="text-blue-600 text-sm font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-2">
              {todayCards.cards.slice(0, 3).map((card) => (
                <div key={card.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700 flex-1">{card.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Primary Feature Cards */}
      <div className="px-4 space-y-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Main Features</h2>
        {PRIMARY_FEATURES.map((card) => (
          <FeatureCard
            key={card.path}
            {...card}
            onClick={() => handleFeatureClick(card.path)}
          />
        ))}
      </div>

      {/* Secondary Feature Cards */}
      <div className="px-4 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">More Tools</h2>
        <div className="grid grid-cols-2 gap-4">
          {SECONDARY_FEATURES.map((card) => (
            <FeatureCard
              key={card.path}
              {...card}
              onClick={() => handleFeatureClick(card.path)}
              variant="secondary"
            />
          ))}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
