import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBackend } from "../../hooks/useBackend";
import { useToast } from "@/components/ui/use-toast";

interface CreateGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateGoalDialog({ open, onOpenChange, onSuccess }: CreateGoalDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("");
  const [targetDate, setTargetDate] = useState("");
  
  const backend = useBackend();
  const { toast } = useToast();

  const createGoalMutation = useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      target_value: number;
      unit: string;
      target_date: string;
    }) => backend.goals.createGoal(data),
    onSuccess: () => {
      toast({
        title: "Goal created",
        description: "Your new goal has been created successfully.",
      });
      setTitle("");
      setDescription("");
      setTargetValue("");
      setUnit("");
      setTargetDate("");
      onSuccess();
    },
    onError: (error) => {
      console.error("Failed to create goal:", error);
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetValue.trim() || !unit.trim() || !targetDate) return;

    const targetNum = parseFloat(targetValue);
    if (isNaN(targetNum) || targetNum <= 0) {
      toast({
        title: "Invalid target value",
        description: "Please enter a valid target value greater than 0.",
        variant: "destructive",
      });
      return;
    }

    createGoalMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      target_value: targetNum,
      unit: unit.trim(),
      target_date: targetDate,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Goal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Goal Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter goal title..."
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
              placeholder="Enter goal description..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="targetValue">Target Value</Label>
              <Input
                id="targetValue"
                type="number"
                min="1"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="100"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="pages, lbs, hours..."
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="targetDate">Target Date</Label>
            <Input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="mt-1"
              min={new Date().toISOString().split('T')[0]}
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
              disabled={!title.trim() || !targetValue.trim() || !unit.trim() || !targetDate || createGoalMutation.isPending}
              className="flex-1"
            >
              {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
