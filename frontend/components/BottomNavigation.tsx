import { useLocation, useNavigate } from "react-router-dom";
import { Home, CheckSquare, ShoppingCart, ChefHat, DollarSign, Calendar, Target, BookOpen } from "lucide-react";

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: CheckSquare, label: "Tasks", path: "/tasks" },
    { icon: ShoppingCart, label: "Shopping", path: "/shopping" },
    { icon: ChefHat, label: "Meals", path: "/meals" },
  ];

  const secondaryItems = [
    { icon: DollarSign, label: "Budget", path: "/budget" },
    { icon: Calendar, label: "Calendar", path: "/calendar" },
    { icon: Target, label: "Goals", path: "/goals" },
    { icon: BookOpen, label: "Journal", path: "/journal" },
  ];

  // Show secondary nav on larger screens
  const allItems = window.innerWidth >= 768 ? [...navItems, ...secondaryItems] : navItems;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-20">
      <div className="flex items-center justify-around h-full px-4">
        {allItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== "/" && location.pathname.startsWith(item.path));
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
                isActive
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
