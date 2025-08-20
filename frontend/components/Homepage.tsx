import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Calendar, CheckSquare, DollarSign, Plus, Home, CalendarDays } from "lucide-react";
import { useBackend } from "../hooks/useBackend";
import { BottomNavigation } from "./BottomNavigation";
import { UserButton } from "@clerk/clerk-react";

export function Homepage() {
  const navigate = useNavigate();
  const backend = useBackend();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => backend.auth.getUserInfo(),
  });

  const { data: boards } = useQuery({
    queryKey: ["boards"],
    queryFn: () => backend.tasks.listBoards(),
  });

  const { data: todayCards } = useQuery({
    queryKey: ["today-cards"],
    queryFn: () => backend.tasks.getTodayCards(),
  });

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const quickStats = [
    {
      title: "Tasks",
      value: boards?.boards?.length || 0,
      color: "border-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Budget",
      value: "$0",
      color: "border-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      title: "Events",
      value: "0",
      color: "border-purple-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
  ];

  const featureCards = [
    {
      title: "Task Manager",
      description: "Organize your tasks with boards and lists",
      icon: CheckSquare,
      color: "border-l-blue-500",
      bgColor: "bg-blue-50",
      onClick: () => navigate("/tasks"),
    },
    {
      title: "Budget Tracker",
      description: "Track your expenses and income",
      icon: DollarSign,
      color: "border-l-green-500",
      bgColor: "bg-green-50",
      onClick: () => navigate("/budget"),
    },
    {
      title: "Calendar",
      description: "Manage your schedule and events",
      icon: Calendar,
      color: "border-l-purple-500",
      bgColor: "bg-purple-50",
      onClick: () => navigate("/calendar"),
    },
    {
      title: "Add New",
      description: "Quick actions and shortcuts",
      icon: Plus,
      color: "border-l-orange-500",
      bgColor: "bg-orange-50",
      onClick: () => {},
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Section */}
      <div className="h-30 bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              Welcome Back, {user?.name || "User"}!
            </h1>
            <p className="text-white/80 mt-1">{currentDate}</p>
          </div>
          <div className="w-10 h-10">
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10"
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Quick Stats Section */}
      <div className="px-4 py-6">
        <div className="flex gap-4 overflow-x-auto">
          {quickStats.map((stat, index) => (
            <div
              key={index}
              className={`min-w-[100px] h-20 bg-white rounded-2xl p-4 shadow-sm ${stat.color} border-l-4 ${stat.bgColor}`}
            >
              <div className={`text-sm font-medium ${stat.textColor}`}>
                {stat.title}
              </div>
              <div className={`text-xl font-bold ${stat.textColor} mt-1`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Tasks Preview */}
      {todayCards && todayCards.cards.length > 0 && (
        <div className="px-4 mb-6">
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
        </div>
      )}

      {/* Main Feature Cards */}
      <div className="px-4 space-y-4">
        {featureCards.map((card, index) => (
          <div
            key={index}
            onClick={card.onClick}
            className={`bg-white rounded-3xl p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow border-l-4 ${card.color} ${card.bgColor}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <card.icon className="w-6 h-6 text-gray-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{card.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <BottomNavigation />
    </div>
  );
}
