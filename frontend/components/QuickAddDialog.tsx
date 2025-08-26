import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBackend } from "@/hooks/useBackend";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export function QuickAddDialog() {
  const { isQuickAddOpen, closeQuickAdd } = useAppStore();
  const [listId, setListId] = useState<string | undefined>();
  const [name, setName] = useState('');
  const backend = useBackend();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: shoppingLists, isLoading: isLoadingLists } = useQuery({
    queryKey: ['shopping-lists'],
    queryFn: () => backend.shopping.getLists(),
    enabled: isQuickAddOpen, // Only fetch when the dialog is open
  });

  const createShoppingItem = useMutation({
    mutationFn: (vars: { listId: number; name: string }) =>
      backend.shopping.createItem({ list_id: vars.listId, name: vars.name }),
    onSuccess: (_, vars) => {
      toast({ title: "Success", description: "Shopping item added." });
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
      queryClient.invalidateQueries({ queryKey: ['shopping-list', String(vars.listId)] });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!listId || !name) {
      toast({
        title: "Missing fields",
        description: "Please select a list and enter an item name.",
        variant: "destructive",
      });
      return;
    }
    createShoppingItem.mutate({ listId: Number(listId), name });
  };

  const handleClose = () => {
    setName('');
    setListId(undefined);
    closeQuickAdd();
  };

  return (
    <Dialog open={isQuickAddOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick Add Shopping Item</DialogTitle>
          <DialogDescription>
            Quickly add a new item to one of your shopping lists.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="shopping-list" className="text-right">
              List
            </Label>
            <Select value={listId} onValueChange={setListId} disabled={isLoadingLists}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={isLoadingLists ? "Loading lists..." : "Select a list"} />
              </SelectTrigger>
              <SelectContent>
                {shoppingLists?.lists.map((list) => (
                  <SelectItem key={list.id} value={String(list.id)}>
                    {list.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Item Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., 'Buy milk'"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
          <Button type="submit" onClick={handleCreate} disabled={createShoppingItem.isPending}>
            {createShoppingItem.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
