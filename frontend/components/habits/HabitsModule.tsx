import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBackend } from "@/hooks/useBackend";
import { CreateHabitDialog } from "./CreateHabitDialog";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { HabitGrid } from "./HabitGrid";

export function HabitsModule() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const backend = useBackend();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['habits'],
    queryFn: () => backend.habits.getHabits(),
  });

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Habit Tracker</h1>
        <CreateHabitDialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Habit
          </Button>
        </CreateHabitDialog>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        </div>
      )}
      {isError && <p className="text-red-500 text-center py-12">Failed to load habits.</p>}

      {data && data.habits.length === 0 && !isLoading && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">No habits yet!</h2>
          <p className="text-gray-500 mt-2">Get started by creating a new habit.</p>
          <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
            Create Your First Habit
          </Button>
        </div>
      )}

      {data && data.habits.length > 0 && (
        <HabitGrid habits={data.habits} />
      )}
    </div>
  );
}
