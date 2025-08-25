import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBackend } from "../../hooks/useBackend";
import { useToast } from "@/components/ui/use-toast";

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateCategoryDialog({ open, onOpenChange, onSuccess }: CreateCategoryDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  
  const backend = useBackend();
  const { toast } = useToast();

  const createCategoryMutation = useMutation({
    mutationFn: (data: { name: string; type: "income" | "expense" }) =>
      backend.budget.createCategory(data),
    onSuccess: () => {
      toast({
        title: "Category created",
        description: "Your new category has been created successfully.",
      });
      setName("");
      setType("expense");
      onSuccess();
    },
    onError: (error) => {
      console.error("Failed to create category:", error);
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createCategoryMutation.mutate({
      name: name.trim(),
      type,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter category name..."
              className="mt-1"
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(value: "income" | "expense") => setType(value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
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
              disabled={!name.trim() || createCategoryMutation.isPending}
              className="flex-1"
            >
              {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
