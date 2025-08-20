import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBackend } from "../../hooks/useBackend";
import { useToast } from "@/components/ui/use-toast";

interface CreateBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const backgroundColors = [
  "#007AFF", // Blue
  "#5856D6", // Purple
  "#34C759", // Green
  "#FF9500", // Orange
  "#FF3B30", // Red
  "#30B0C7", // Teal
];

export function CreateBoardDialog({ open, onOpenChange, onSuccess }: CreateBoardDialogProps) {
  const [title, setTitle] = useState("");
  const [selectedBackground, setSelectedBackground] = useState(backgroundColors[0]);
  const backend = useBackend();
  const { toast } = useToast();

  const createBoardMutation = useMutation({
    mutationFn: (data: { title: string; background: string }) =>
      backend.tasks.createBoard(data),
    onSuccess: () => {
      toast({
        title: "Board created",
        description: "Your new board has been created successfully.",
      });
      setTitle("");
      setSelectedBackground(backgroundColors[0]);
      onSuccess();
    },
    onError: (error) => {
      console.error("Failed to create board:", error);
      toast({
        title: "Error",
        description: "Failed to create board. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createBoardMutation.mutate({
      title: title.trim(),
      background: selectedBackground,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Board</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Board Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter board title..."
              className="mt-1"
            />
          </div>
          
          <div>
            <Label>Background Color</Label>
            <div className="grid grid-cols-6 gap-2 mt-2">
              {backgroundColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedBackground(color)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    selectedBackground === color
                      ? "border-gray-900 scale-110"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
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
              disabled={!title.trim() || createBoardMutation.isPending}
              className="flex-1"
            >
              {createBoardMutation.isPending ? "Creating..." : "Create Board"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
