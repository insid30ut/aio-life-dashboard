import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Tag, Trash2, Plus, CheckSquare, MessageSquare, Paperclip, User } from "lucide-react";
import { useBackend } from "../../hooks/useBackend";
import { useToast } from "@/components/ui/use-toast";
import type { CardWithMembers, CardWithDetails } from "~backend/tasks/types";

interface CardDetailProps {
  card: CardWithMembers;
  onClose: () => void;
  onUpdate: () => void;
}

export function CardDetail({ card, onClose, onUpdate }: CardDetailProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [dueDate, setDueDate] = useState(
    card.due_date ? new Date(card.due_date).toISOString().split('T')[0] : ""
  );
  const [newLabel, setNewLabel] = useState("");
  const [labels, setLabels] = useState<string[]>(card.labels);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newComment, setNewComment] = useState("");
  
  const backend = useBackend();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get detailed card data
  const { data: cardDetails } = useQuery({
    queryKey: ["card-details", card.id],
    queryFn: () => backend.tasks.getCard({ id: card.id }),
  });

  const updateCardMutation = useMutation({
    mutationFn: (data: any) => backend.tasks.updateCard(data),
    onSuccess: () => {
      toast({
        title: "Card updated",
        description: "Your card has been updated successfully.",
      });
      onUpdate();
    },
    onError: (error) => {
      console.error("Failed to update card:", error);
      toast({
        title: "Error",
        description: "Failed to update card. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: () => backend.tasks.deleteCard({ id: card.id }),
    onSuccess: () => {
      toast({
        title: "Card deleted",
        description: "Your card has been deleted successfully.",
      });
      onUpdate();
    },
    onError: (error) => {
      console.error("Failed to delete card:", error);
      toast({
        title: "Error",
        description: "Failed to delete card. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createChecklistMutation = useMutation({
    mutationFn: (data: { title: string; card_id: number }) =>
      backend.tasks.createChecklist(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card-details", card.id] });
      setNewChecklistTitle("");
      toast({
        title: "Checklist created",
        description: "Your checklist has been created successfully.",
      });
    },
    onError: (error) => {
      console.error("Failed to create checklist:", error);
      toast({
        title: "Error",
        description: "Failed to create checklist. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createChecklistItemMutation = useMutation({
    mutationFn: (data: { title: string; checklist_id: number }) =>
      backend.tasks.createChecklistItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card-details", card.id] });
    },
    onError: (error) => {
      console.error("Failed to create checklist item:", error);
      toast({
        title: "Error",
        description: "Failed to create checklist item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateChecklistItemMutation = useMutation({
    mutationFn: (data: { id: number; completed?: boolean; title?: string }) =>
      backend.tasks.updateChecklistItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card-details", card.id] });
    },
    onError: (error) => {
      console.error("Failed to update checklist item:", error);
      toast({
        title: "Error",
        description: "Failed to update checklist item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: (data: { content: string; card_id: number }) =>
      backend.tasks.createComment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card-details", card.id] });
      setNewComment("");
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
    },
    onError: (error) => {
      console.error("Failed to create comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateCardMutation.mutate({
      id: card.id,
      title: title.trim(),
      description: description.trim(),
      due_date: dueDate ? new Date(dueDate) : null,
      labels,
    });
  };

  const handleAddLabel = () => {
    if (newLabel.trim() && !labels.includes(newLabel.trim())) {
      setLabels([...labels, newLabel.trim()]);
      setNewLabel("");
    }
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    setLabels(labels.filter(label => label !== labelToRemove));
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this card?")) {
      deleteCardMutation.mutate();
    }
  };

  const handleCreateChecklist = () => {
    if (newChecklistTitle.trim()) {
      createChecklistMutation.mutate({
        title: newChecklistTitle.trim(),
        card_id: card.id,
      });
    }
  };

  const handleAddChecklistItem = (checklistId: number, title: string) => {
    if (title.trim()) {
      createChecklistItemMutation.mutate({
        title: title.trim(),
        checklist_id: checklistId,
      });
    }
  };

  const handleToggleChecklistItem = (itemId: number, completed: boolean) => {
    updateChecklistItemMutation.mutate({
      id: itemId,
      completed,
    });
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      createCommentMutation.mutate({
        content: newComment.trim(),
        card_id: card.id,
      });
    }
  };

  const details = cardDetails?.card;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Card Details</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
                rows={4}
                placeholder="Add a description..."
              />
            </div>

            {/* Checklists */}
            {details?.checklists && details.checklists.length > 0 && (
              <div>
                <Label className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" />
                  Checklists
                </Label>
                <div className="mt-2 space-y-4">
                  {details.checklists.map((checklist) => {
                    const completedItems = checklist.items.filter(item => item.completed).length;
                    const totalItems = checklist.items.length;
                    const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
                    
                    return (
                      <div key={checklist.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{checklist.title}</h4>
                          <span className="text-sm text-gray-500">
                            {completedItems}/{totalItems}
                          </span>
                        </div>
                        
                        {totalItems > 0 && (
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          {checklist.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-2">
                              <Checkbox
                                checked={item.completed}
                                onCheckedChange={(checked) =>
                                  handleToggleChecklistItem(item.id, checked as boolean)
                                }
                              />
                              <span className={item.completed ? "line-through text-gray-500" : ""}>
                                {item.title}
                              </span>
                            </div>
                          ))}
                          
                          <div className="flex gap-2 mt-3">
                            <Input
                              placeholder="Add an item..."
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddChecklistItem(checklist.id, e.currentTarget.value);
                                  e.currentTarget.value = '';
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              onClick={(e) => {
                                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                handleAddChecklistItem(checklist.id, input.value);
                                input.value = '';
                              }}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add Checklist */}
            <div>
              <div className="flex gap-2">
                <Input
                  value={newChecklistTitle}
                  onChange={(e) => setNewChecklistTitle(e.target.value)}
                  placeholder="Add a checklist..."
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateChecklist()}
                />
                <Button
                  onClick={handleCreateChecklist}
                  disabled={!newChecklistTitle.trim() || createChecklistMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <CheckSquare className="w-4 h-4" />
                  Add Checklist
                </Button>
              </div>
            </div>

            {/* Comments */}
            {details?.comments && details.comments.length > 0 && (
              <div>
                <Label className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Comments
                </Label>
                <div className="mt-2 space-y-3">
                  {details.comments.map((comment) => (
                    <div key={comment.id} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4" />
                        <span className="text-sm font-medium">{comment.user_id}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Comment */}
            <div>
              <div className="flex gap-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  rows={2}
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || createCommentMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Comment
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Due Date */}
            <div>
              <Label htmlFor="dueDate" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Due Date
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Labels */}
            <div>
              <Label className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Labels
              </Label>
              <div className="mt-2 space-y-3">
                {labels.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {labels.map((label) => (
                      <Badge
                        key={label}
                        variant="secondary"
                        className="cursor-pointer hover:bg-red-100 hover:text-red-700"
                        onClick={() => handleRemoveLabel(label)}
                      >
                        {label} ×
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Add a label..."
                    onKeyPress={(e) => e.key === 'Enter' && handleAddLabel()}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddLabel}
                    disabled={!newLabel.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Attachments */}
            {details?.attachments && details.attachments.length > 0 && (
              <div>
                <Label className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Attachments
                </Label>
                <div className="mt-2 space-y-2">
                  {details.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-2 p-2 border rounded">
                      <Paperclip className="w-4 h-4" />
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex-1"
                      >
                        {attachment.name}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Card Info */}
            <div className="text-sm text-gray-500 space-y-1">
              <p>Created: {new Date(card.created_at).toLocaleString()}</p>
              <p>Last updated: {new Date(card.updated_at).toLocaleString()}</p>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                onClick={handleSave}
                disabled={updateCardMutation.isPending}
                className="w-full"
              >
                {updateCardMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteCardMutation.isPending}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Card
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
