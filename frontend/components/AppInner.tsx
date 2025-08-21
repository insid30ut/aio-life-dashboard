import { Routes, Route } from "react-router-dom";
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
  );
}
