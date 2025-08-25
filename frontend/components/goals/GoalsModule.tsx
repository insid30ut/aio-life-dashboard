import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Target, TrendingUp, Calendar, CheckCircle } from "lucide-react";
import { useBackend } from "../../hooks/useBackend";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CreateGoalDialog } from "./CreateGoalDialog";
import { BottomNavigation } from "../BottomNavigation";

export function GoalsModule() {
  const navigate = useNavigate();
  const backend = useBackend();
  const queryClient = useQueryClient();
  
  const [showCreateGoal, setShowCreateGoal] = useState(false);

  const { data: goals } = useQuery({
    queryKey: ["goals"],
    queryFn: () => backend.goals.getGoals(),
  });

  const updateGoalMutation = useMutation({
    mutationFn: (data: { id: number; current_value: number }) =>
      backend.goals.updateGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const activeGoals = goals?.goals.filter(goal => goal.status === 'active') || [];
  const completedGoals = goals?.goals.filter(goal => goal.status === 'completed') || [];

  const handleProgressUpdate = (goalId: number, currentValue: number) => {
    updateGoalMutation.mutate({ id: goalId, current_value: currentValue });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-green-600 px-4 py-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="text-white hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-white">Goals Tracker</h1>
            <p className="text-white/80 text-sm">Track your personal goals and milestones</p>
          </div>
          <button
            onClick={() => setShowCreateGoal(true)}
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Stats Overview */}
        {goals && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-l-teal-500">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-teal-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Goals</p>
                  <p className="text-xl font-bold text-teal-600">{goals.goals.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-l-green-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-xl font-bold text-green-600">{completedGoals.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-l-blue-500">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-xl font-bold text-blue-600">{activeGoals.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-l-purple-500">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-xl font-bold text-purple-600">
                    {goals.goals.filter(goal => {
                      const goalDate = new Date(goal.target_date);
                      const now = new Date();
                      return goalDate.getMonth() === now.getMonth() && 
                             goalDate.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Goals */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Active Goals</h3>
            <Button
              onClick={() => setShowCreateGoal(true)}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Goal
            </Button>
          </div>
          
          {activeGoals.length > 0 ? (
            <div className="space-y-4">
              {activeGoals.map((goal) => {
                const progress = goal.target_value > 0 ? (goal.current_value / goal.target_value) * 100 : 0;
                const isOverdue = new Date(goal.target_date) < new Date() && goal.status !== 'completed';
                
                return (
                  <div key={goal.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                        {goal.description && (
                          <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {goal.current_value} / {goal.target_value} {goal.unit}
                        </p>
                        <p className={`text-xs ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                          Due: {new Date(goal.target_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Progress value={Math.min(progress, 100)} className="h-2" />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{progress.toFixed(1)}% complete</span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleProgressUpdate(goal.id, Math.min(goal.current_value + 1, goal.target_value))}
                            disabled={goal.current_value >= goal.target_value}
                          >
                            +1
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleProgressUpdate(goal.id, Math.min(goal.current_value + 5, goal.target_value))}
                            disabled={goal.current_value >= goal.target_value}
                          >
                            +5
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-teal-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                <Target className="w-6 h-6 text-teal-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">No active goals</h4>
              <p className="text-sm text-gray-600 mb-3">Create your first goal to get started</p>
              <Button
                onClick={() => setShowCreateGoal(true)}
                size="sm"
                className="bg-teal-600 hover:bg-teal-700"
              >
                Create Goal
              </Button>
            </div>
          )}
        </div>

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Completed Goals</h3>
            <div className="space-y-3">
              {completedGoals.map((goal) => (
                <div key={goal.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{goal.title}</h4>
                    <p className="text-sm text-gray-600">
                      Completed {new Date(goal.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">
                      {goal.target_value} {goal.unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <CreateGoalDialog
        open={showCreateGoal}
        onOpenChange={setShowCreateGoal}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["goals"] });
          setShowCreateGoal(false);
        }}
      />

      <BottomNavigation />
    </div>
  );
}
