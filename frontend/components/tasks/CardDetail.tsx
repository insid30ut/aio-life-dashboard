import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Tag, Trash2 } from "lucide-react";
import { useBackend } from "../../hooks/useBackend";
import { useToast } from "@/components/ui/use-toast";
import type { CardWithMembers } from "~backend/tasks/types";

interface CardDetailProps {
  card: CardWithMembers;
  onClose: () => void;
  onUpdate: () => void;
}

export function CardDetail({ card, onClose, onUpdate }: CardDetailProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [dueDate, setDueDate] = useState(
    card.due_date ? new Date(card.due_date).toISOString().split('T')[0] : ""
  );
  const [newLabel, setNewLabel] = useState("");
  const [labels, setLabels] = useState<string[]>(card.labels);
  
  const backend = useBackend();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateCardMutation = useMutation({
    mutationFn: (data: any) => backend.tasks.updateCard(data),
    onSuccess: () => {
      toast({
        title: "Card updated",
        description: "Your card has been updated successfully.",
      });
      onUpdate();
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

  const deleteCardMutation = useMutation({
    mutationFn: () => backend.tasks.deleteCard({ id: card.id }),
    onSuccess: () => {
      toast({
        title: "Card deleted",
        description: "Your card has been deleted successfully.",
      });
      onUpdate();
    },
    onError: (error) => {
      console.error("Failed to delete card:", error);
      toast({
        title: "Error",
        description: "Failed to delete card. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateCardMutation.mutate({
      id: card.id,
      title: title.trim(),
      description: description.trim(),
      due_date: dueDate ? new Date(dueDate) : null,
      labels,
    });
  };

  const handleAddLabel = () => {
    if (newLabel.trim() && !labels.includes(newLabel.trim())) {
      setLabels([...labels, newLabel.trim()]);
      setNewLabel("");
    }
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    setLabels(labels.filter(label => label !== labelToRemove));
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this card?")) {
      deleteCardMutation.mutate();
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Card Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
              rows={4}
              placeholder="Add a description..."
            />
          </div>

          {/* Due Date */}
          <div>
            <Label htmlFor="dueDate" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Due Date
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Labels */}
          <div>
            <Label className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Labels
            </Label>
            <div className="mt-2 space-y-3">
              {labels.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {labels.map((label) => (
                    <Badge
                      key={label}
                      variant="secondary"
                      className="cursor-pointer hover:bg-red-100 hover:text-red-700"
                      onClick={() => handleRemoveLabel(label)}
                    >
                      {label} ×
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Add a label..."
                  onKeyPress={(e) => e.key === 'Enter' && handleAddLabel()}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddLabel}
                  disabled={!newLabel.trim()}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Card Info */}
          <div className="text-sm text-gray-500 space-y-1">
            <p>Created: {new Date(card.created_at).toLocaleString()}</p>
            <p>Last updated: {new Date(card.updated_at).toLocaleString()}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={updateCardMutation.isPending}
              className="flex-1"
            >
              {updateCardMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteCardMutation.isPending}
              className="px-3"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
