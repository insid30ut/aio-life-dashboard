import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowLeft, Calendar } from "lucide-react";
import { useBackend } from "../../hooks/useBackend";
import { CreateBoardDialog } from "./CreateBoardDialog";
import { useState } from "react";

export function TasksModule() {
  const navigate = useNavigate();
  const backend = useBackend();
  const [showCreateBoard, setShowCreateBoard] = useState(false);

  const { data: boards, refetch } = useQuery({
    queryKey: ["boards"],
    queryFn: () => backend.tasks.listBoards(),
  });

  const { data: todayCards } = useQuery({
    queryKey: ["today-cards"],
    queryFn: () => backend.tasks.getTodayCards(),
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="text-white hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-white">Task Manager</h1>
            <p className="text-white/80 text-sm">Organize your work with boards</p>
          </div>
          <button
            onClick={() => setShowCreateBoard(true)}
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Today's Tasks */}
        {todayCards && todayCards.cards.length > 0 && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border-l-4 border-l-orange-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-semibold text-gray-900">Due Today</h2>
              </div>
              <button
                onClick={() => navigate("/tasks/today")}
                className="text-orange-600 text-sm font-medium hover:text-orange-700"
              >
                View All ({todayCards.cards.length})
              </button>
            </div>
            <div className="space-y-2">
              {todayCards.cards.slice(0, 3).map((card) => (
                <div key={card.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-gray-700 flex-1">{card.title}</span>
                  {card.labels.length > 0 && (
                    <div className="flex gap-1">
                      {card.labels.slice(0, 2).map((label, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-200 text-xs rounded-full text-gray-600"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Boards Grid */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Boards</h2>
          {boards && boards.boards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {boards.boards.map((board) => (
                <div
                  key={board.id}
                  onClick={() => navigate(`/tasks/board/${board.id}`)}
                  className="bg-white rounded-3xl p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
                  style={{ backgroundColor: board.background + "10" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: board.background }}
                    ></div>
                    <h3 className="text-lg font-semibold text-gray-900 flex-1">
                      {board.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm mt-2">
                    Updated {new Date(board.updated_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No boards yet</h3>
              <p className="text-gray-600 mb-4">Create your first board to get started</p>
              <button
                onClick={() => setShowCreateBoard(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Create Board
              </button>
            </div>
          )}
        </div>
      </div>

      <CreateBoardDialog
        open={showCreateBoard}
        onOpenChange={setShowCreateBoard}
        onSuccess={() => {
          refetch();
          setShowCreateBoard(false);
        }}
      />
    </div>
  );
}
