import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, MoreHorizontal } from "lucide-react";
import { useBackend } from "../../hooks/useBackend";
import { useState } from "react";
import { CreateListDialog } from "./CreateListDialog";
import { CreateCardDialog } from "./CreateCardDialog";
import { CardDetail } from "./CardDetail";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import type { CardWithMembers } from "~backend/tasks/types";

export function BoardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const backend = useBackend();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [showCreateList, setShowCreateList] = useState(false);
  const [showCreateCard, setShowCreateCard] = useState<{ listId: number } | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardWithMembers | null>(null);

  const { data: boardData, isLoading } = useQuery({
    queryKey: ["board", id],
    queryFn: () => backend.tasks.getBoard({ id: parseInt(id!) }),
    enabled: !!id,
  });

  const updateCardMutation = useMutation({
    mutationFn: (data: { id: number; list_id?: number; position?: number }) =>
      backend.tasks.updateCard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", id] });
    },
    onError: (error) => {
      console.error("Failed to update card:", error);
      toast({
        title: "Error",
        description: "Failed to update card. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading board...</p>
        </div>
      </div>
    );
  }

  if (!boardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Board not found</h2>
          <Button onClick={() => navigate("/tasks")}>Back to Tasks</Button>
        </div>
      </div>
    );
  }

  const { board } = boardData;

  const handleCardMove = (cardId: number, newListId: number, newPosition: number) => {
    updateCardMutation.mutate({
      id: cardId,
      list_id: newListId,
      position: newPosition,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div 
        className="px-4 py-6"
        style={{ background: `linear-gradient(135deg, ${board.background}, ${board.background}dd)` }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/tasks")}
            className="text-white hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-white">{board.title}</h1>
            <p className="text-white/80 text-sm">{board.lists.length} lists</p>
          </div>
          <button className="text-white hover:text-white/80 transition-colors">
            <MoreHorizontal className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Lists */}
      <div className="p-4">
        <div className="flex gap-4 overflow-x-auto pb-4">
          {board.lists.map((list) => (
            <div
              key={list.id}
              className="min-w-[280px] bg-gray-100 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{list.title}</h3>
                <button
                  onClick={() => setShowCreateCard({ listId: list.id })}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                {list.cards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => setSelectedCard(card)}
                    className="bg-white rounded-xl p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <h4 className="font-medium text-gray-900 mb-2">{card.title}</h4>
                    
                    {card.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {card.labels.map((label, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {card.due_date && (
                      <div className="text-xs text-gray-500">
                        Due: {new Date(card.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Add List Button */}
          <div className="min-w-[280px]">
            <button
              onClick={() => setShowCreateList(true)}
              className="w-full h-12 bg-white/50 hover:bg-white/70 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add a list
            </button>
          </div>
        </div>
      </div>

      <CreateListDialog
        open={showCreateList}
        onOpenChange={setShowCreateList}
        boardId={parseInt(id!)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["board", id] });
          setShowCreateList(false);
        }}
      />

      {showCreateCard && (
        <CreateCardDialog
          open={true}
          onOpenChange={() => setShowCreateCard(null)}
          listId={showCreateCard.listId}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["board", id] });
            setShowCreateCard(null);
          }}
        />
      )}

      {selectedCard && (
        <CardDetail
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ["board", id] });
            setSelectedCard(null);
          }}
        />
      )}
    </div>
  );
}
