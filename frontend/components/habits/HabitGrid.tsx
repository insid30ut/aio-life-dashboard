import type { HabitWithEntries } from "~backend/habits/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useBackend } from "@/hooks/useBackend";
import { useToast } from "@/components/ui/use-toast";
import { format, subDays, isSameDay } from 'date-fns';
import { cn } from "@/lib/utils"; // For combining classNames

interface HabitGridProps {
  habits: HabitWithEntries[];
}

export function HabitGrid({ habits }: HabitGridProps) {
  const backend = useBackend();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const dates = Array.from({ length: 30 }).map((_, i) => subDays(new Date(), i)).reverse();

  const trackMutation = useMutation({
    mutationFn: (vars: { habit_id: number; date: string; completed: boolean }) => {
      if (vars.completed) {
        return backend.habits.untrackHabit(vars);
      } else {
        return backend.habits.trackHabit(vars);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
    onError: (error) => {
      toast({ title: "Error", description: `Failed to update habit: ${error.message}`, variant: "destructive" });
    },
  });

  return (
    <div className="overflow-x-auto bg-white p-4 rounded-lg shadow-sm">
      <div className="inline-grid grid-cols-31 gap-1 items-center">
        {/* Header: Habit Name */}
        <div className="font-semibold sticky left-0 bg-white pr-2">Habit</div>
        {/* Header: Dates */}
        {dates.map(date => (
          <div key={date.toISOString()} className="text-center text-xs w-8">
            <div className="text-gray-500">{format(date, 'EEE')}</div>
            <div>{format(date, 'd')}</div>
          </div>
        ))}

        {/* Grid Body */}
        {habits.map(habit => (
          <>
            <div className="font-semibold sticky left-0 bg-white pr-2">{habit.name}</div>
            {dates.map(date => {
              const entry = habit.entries.find(e => isSameDay(new Date(e.completed_at), date));
              const completed = !!entry;

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => trackMutation.mutate({ habit_id: habit.id, date: format(date, 'yyyy-MM-dd'), completed })}
                  className={cn(
                    "w-8 h-8 rounded-md transition-all",
                    completed ? 'opacity-100' : 'opacity-20 hover:opacity-40',
                    trackMutation.isPending &&
                    trackMutation.variables?.habit_id === habit.id &&
                    trackMutation.variables?.date === format(date, 'yyyy-MM-dd') &&
                    'animate-pulse'
                  )}
                  style={{ backgroundColor: habit.color }}
                  aria-label={`Track ${habit.name} for ${format(date, 'MMMM d')}`}
                  disabled={trackMutation.isPending}
                />
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}
