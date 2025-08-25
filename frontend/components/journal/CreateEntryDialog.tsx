import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBackend } from "../../hooks/useBackend";
import { useToast } from "@/components/ui/use-toast";

interface CreateEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const moods = [
  "😊 Happy",
  "😔 Sad", 
  "😴 Tired",
  "😤 Frustrated",
  "😌 Peaceful",
  "😰 Anxious",
  "🤔 Thoughtful",
  "😍 Excited",
  "😐 Neutral",
  "🥰 Grateful"
];

export function CreateEntryDialog({ open, onOpenChange, onSuccess }: CreateEntryDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  
  const backend = useBackend();
  const { toast } = useToast();

  const createEntryMutation = useMutation({
    mutationFn: (data: {
      title: string;
      content: string;
      mood?: string;
      date: string;
    }) => backend.journal.createEntry(data),
    onSuccess: () => {
      toast({
        title: "Entry saved",
        description: "Your journal entry has been saved successfully.",
      });
      setTitle("");
      setContent("");
      setMood("");
      setDate(new Date().toISOString().split('T')[0]);
      setTime(new Date().toTimeString().slice(0, 5));
      onSuccess();
    },
    onError: (error) => {
      console.error("Failed to create entry:", error);
      toast({
        title: "Error",
        description: "Failed to save entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const entryDate = new Date(`${date}T${time}`);

    createEntryMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      mood: mood || undefined,
      date: entryDate.toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Journal Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's on your mind today?"
              className="mt-1"
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts here..."
              className="mt-1"
              rows={8}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="mood">Mood (optional)</Label>
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="How are you feeling?" />
                </SelectTrigger>
                <SelectContent>
                  {moods.map((moodOption) => (
                    <SelectItem key={moodOption} value={moodOption}>
                      {moodOption}
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
              disabled={!title.trim() || !content.trim() || createEntryMutation.isPending}
              className="flex-1"
            >
              {createEntryMutation.isPending ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
