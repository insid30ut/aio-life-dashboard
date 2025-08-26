import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBackend } from "@/hooks/useBackend";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface CreateHabitDialogProps {
  children: React.ReactNode; // To use a button as the trigger
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateHabitDialog({ children, open, onOpenChange }: CreateHabitDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const backend = useBackend();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createHabit = useMutation({
    mutationFn: () => backend.habits.createHabit({ name, description }),
    onSuccess: () => {
      toast({ title: "Success", description: "New habit created." });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      onOpenChange(false); // Close the dialog
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!name) {
      toast({
        title: "Name is required",
        description: "Please enter a name for the habit.",
        variant: "destructive",
      });
      return;
    }
    createHabit.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Habit</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 'Exercise for 30 minutes'"
              disabled={createHabit.isPending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., 'Go for a run or do a home workout'"
              disabled={createHabit.isPending}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createHabit.isPending}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={createHabit.isPending}>
            {createHabit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Habit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
