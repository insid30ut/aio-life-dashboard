import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBackend } from "../../hooks/useBackend";
import { useToast } from "@/components/ui/use-toast";

interface CreateListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: number;
  onSuccess: () => void;
}

export function CreateListDialog({ open, onOpenChange, boardId, onSuccess }: CreateListDialogProps) {
  const [title, setTitle] = useState("");
  const backend = useBackend();
  const { toast } = useToast();

  const createListMutation = useMutation({
    mutationFn: (data: { title: string; board_id: number }) =>
      backend.tasks.createList(data),
    onSuccess: () => {
      toast({
        title: "List created",
        description: "Your new list has been created successfully.",
      });
      setTitle("");
      onSuccess();
    },
    onError: (error) => {
      console.error("Failed to create list:", error);
      toast({
        title: "Error",
        description: "Failed to create list. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createListMutation.mutate({
      title: title.trim(),
      board_id: boardId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New List</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">List Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter list title..."
              className="mt-1"
              autoFocus
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
              disabled={!title.trim() || createListMutation.isPending}
              className="flex-1"
            >
              {createListMutation.isPending ? "Creating..." : "Create List"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
