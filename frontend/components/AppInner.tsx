import { Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { Homepage } from "./Homepage";
import { TasksModule } from "./tasks/TasksModule";
import { BoardDetail } from "./tasks/BoardDetail";
import { TodayView } from "./tasks/TodayView";
import { ShoppingModule } from "./shopping/ShoppingModule";
import { ShoppingListDetail } from "./shopping/ShoppingListDetail";
import { MealPlannerModule } from "./meals/MealPlannerModule";
import { RecipeDetail } from "./meals/RecipeDetail";
import { ComingSoon } from "./ComingSoon";

export function AppInner() {
  return (
    <>
      <SignedOut>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto flex items-center justify-center">
              <span className="text-4xl">📋</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">AIO Life Dashboard</h1>
            <p className="text-lg text-gray-600">
              Organize your life with tasks, budget tracking, and calendar management.
            </p>
            <SignInButton mode="modal">
              <button className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Sign In to Get Started
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>
      
      <SignedIn>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/tasks" element={<TasksModule />} />
          <Route path="/tasks/board/:id" element={<BoardDetail />} />
          <Route path="/tasks/today" element={<TodayView />} />
          <Route path="/shopping" element={<ShoppingModule />} />
          <Route path="/shopping/list/:id" element={<ShoppingListDetail />} />
          <Route path="/meals" element={<MealPlannerModule />} />
          <Route path="/meals/recipe/:id" element={<RecipeDetail />} />
          <Route path="/budget" element={<ComingSoon feature="Budget Tracker" />} />
          <Route path="/calendar" element={<ComingSoon feature="Calendar" />} />
          <Route path="/goals" element={<ComingSoon feature="Goals Tracker" />} />
          <Route path="/journal" element={<ComingSoon feature="Digital Journal" />} />
        </Routes>
      </SignedIn>
    </>
  );
}
