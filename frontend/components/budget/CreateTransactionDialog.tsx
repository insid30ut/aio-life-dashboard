import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBackend } from "../../hooks/useBackend";
import { useToast } from "@/components/ui/use-toast";

interface CreateTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Array<{ id: number; name: string; type: string }>;
  onSuccess: () => void;
}

export function CreateTransactionDialog({ open, onOpenChange, categories, onSuccess }: CreateTransactionDialogProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [categoryId, setCategoryId] = useState<string>("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const backend = useBackend();
  const { toast } = useToast();

  const createTransactionMutation = useMutation({
    mutationFn: (data: {
      description: string;
      amount: number;
      type: "income" | "expense";
      category_id?: number;
      date: string;
    }) => backend.budget.createTransaction(data),
    onSuccess: () => {
      toast({
        title: "Transaction added",
        description: "Your transaction has been recorded successfully.",
      });
      setDescription("");
      setAmount("");
      setType("expense");
      setCategoryId("");
      setDate(new Date().toISOString().split('T')[0]);
      onSuccess();
    },
    onError: (error) => {
      console.error("Failed to create transaction:", error);
      toast({
        title: "Error",
        description: "Failed to add transaction. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount.trim()) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive",
      });
      return;
    }

    createTransactionMutation.mutate({
      description: description.trim(),
      amount: amountNum,
      type,
      category_id: categoryId ? parseInt(categoryId) : undefined,
      date,
    });
  };

  const filteredCategories = categories.filter(cat => cat.type === type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description..."
              className="mt-1"
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(value: "income" | "expense") => {
              setType(value);
              setCategoryId(""); // Reset category when type changes
            }}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="category">Category (optional)</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
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
              disabled={!description.trim() || !amount.trim() || createTransactionMutation.isPending}
              className="flex-1"
            >
              {createTransactionMutation.isPending ? "Adding..." : "Add Transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
