import { Routes, Route } from "react-router-dom";
import { Homepage } from "./Homepage";
import { TasksModule } from "./tasks/TasksModule";
import { BoardDetail } from "./tasks/BoardDetail";
import { TodayView } from "./tasks/TodayView";
import { ComingSoon } from "./ComingSoon";

export function AppInner() {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/tasks" element={<TasksModule />} />
      <Route path="/tasks/board/:id" element={<BoardDetail />} />
      <Route path="/tasks/today" element={<TodayView />} />
      <Route path="/budget" element={<ComingSoon feature="Budget Tracker" />} />
      <Route path="/calendar" element={<ComingSoon feature="Calendar" />} />
    </Routes>
  );
}
