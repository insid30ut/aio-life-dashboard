import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBackend } from "../../hooks/useBackend";
import { useToast } from "@/components/ui/use-toast";

interface CreateCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listId: number;
  onSuccess: () => void;
}

export function CreateCardDialog({ open, onOpenChange, listId, onSuccess }: CreateCardDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const backend = useBackend();
  const { toast } = useToast();

  const createCardMutation = useMutation({
    mutationFn: (data: { title: string; description?: string; list_id: number; due_date?: Date }) =>
      backend.tasks.createCard(data),
    onSuccess: () => {
      toast({
        title: "Card created",
        description: "Your new card has been created successfully.",
      });
      setTitle("");
      setDescription("");
      setDueDate("");
      onSuccess();
    },
    onError: (error) => {
      console.error("Failed to create card:", error);
      toast({
        title: "Error",
        description: "Failed to create card. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createCardMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      list_id: listId,
      due_date: dueDate ? new Date(dueDate) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Card</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Card Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter card title..."
              className="mt-1"
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter card description..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="dueDate">Due Date (optional)</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || createCardMutation.isPending}
              className="flex-1"
            >
              {createCardMutation.isPending ? "Creating..." : "Create Card"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
