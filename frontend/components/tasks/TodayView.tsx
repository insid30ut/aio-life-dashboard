import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, CheckSquare } from "lucide-react";
import { useBackend } from "../../hooks/useBackend";
import { useState } from "react";
import { CardDetail } from "./CardDetail";
import type { CardWithMembers } from "~backend/tasks/types";

export function TodayView() {
  const navigate = useNavigate();
  const backend = useBackend();
  const [selectedCard, setSelectedCard] = useState<CardWithMembers | null>(null);

  const { data: todayCards, refetch } = useQuery({
    queryKey: ["today-cards"],
    queryFn: () => backend.tasks.getTodayCards(),
  });

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/tasks")}
            className="text-white hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-white">Due Today</h1>
            <p className="text-white/80 text-sm">{today}</p>
          </div>
          <Calendar className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="px-4 py-6">
        {todayCards && todayCards.cards.length > 0 ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              {todayCards.cards.length} {todayCards.cards.length === 1 ? 'task' : 'tasks'} due today
            </div>
            
            {todayCards.cards.map((card) => (
              <div
                key={card.id}
                onClick={() => setSelectedCard(card)}
                className="bg-white rounded-3xl p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-orange-500"
              >
                <div className="flex items-start gap-4">
                  <CheckSquare className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{card.title}</h3>
                    {card.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {card.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-3">
                      {card.due_date && (
                        <div className="text-xs text-orange-600 font-medium">
                          Due: {new Date(card.due_date).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      )}
                      
                      {card.labels.length > 0 && (
                        <div className="flex gap-1">
                          {card.labels.slice(0, 3).map((label, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full"
                            >
                              {label}
                            </span>
                          ))}
                          {card.labels.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{card.labels.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks due today</h3>
            <p className="text-gray-600 mb-4">You're all caught up! Enjoy your day.</p>
            <button
              onClick={() => navigate("/tasks")}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              View All Tasks
            </button>
          </div>
        )}
      </div>

      {selectedCard && (
        <CardDetail
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onUpdate={() => {
            refetch();
            setSelectedCard(null);
          }}
        />
      )}
    </div>
  );
}
