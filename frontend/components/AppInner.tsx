import { Routes, Route } from "react-router-dom";
import { Homepage } from "./Homepage";
import { TasksModule } from "./tasks/TasksModule";
import { BoardDetail } from "./tasks/BoardDetail";
import { TodayView } from "./tasks/TodayView";
import { ShoppingModule } from "./shopping/ShoppingModule";
import { ShoppingListDetail } from "./shopping/ShoppingListDetail";
import { MealPlannerModule } from "./meals/MealPlannerModule";
import { RecipeDetail } from "./meals/RecipeDetail";
import { BudgetModule } from "./budget/BudgetModule";
import { CalendarModule } from "./calendar/CalendarModule";
import { GoalsModule } from "./goals/GoalsModule";
import { JournalModule } from "./journal/JournalModule";
import { HabitsModule } from "./habits/HabitsModule";
import { ProfilePage } from "./ProfilePage";

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
      <Route path="/budget" element={<BudgetModule />} />
      <Route path="/calendar" element={<CalendarModule />} />
      <Route path="/goals" element={<GoalsModule />} />
      <Route path="/journal" element={<JournalModule />} />
      <Route path="/habits" element={<HabitsModule />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  );
}
