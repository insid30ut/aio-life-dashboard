import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBackend } from "../../hooks/useBackend";
import { useToast } from "@/components/ui/use-toast";

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateEventDialog({ open, onOpenChange, onSuccess }: CreateEventDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState("12:00");
  
  const backend = useBackend();
  const { toast } = useToast();

  const createEventMutation = useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      date: string;
    }) => backend.calendar.createEvent(data),
    onSuccess: () => {
      toast({
        title: "Event created",
        description: "Your event has been added to the calendar.",
      });
      setTitle("");
      setDescription("");
      setDate(new Date().toISOString().split('T')[0]);
      setTime("12:00");
      onSuccess();
    },
    onError: (error) => {
      console.error("Failed to create event:", error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const eventDate = new Date(`${date}T${time}`);

    createEventMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      date: eventDate.toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter event title..."
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
              placeholder="Enter event description..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1"
              />
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
              disabled={!title.trim() || createEventMutation.isPending}
              className="flex-1"
            >
              {createEventMutation.isPending ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
