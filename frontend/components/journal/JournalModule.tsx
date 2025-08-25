import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, BookOpen, Calendar, Search } from "lucide-react";
import { useBackend } from "../../hooks/useBackend";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateEntryDialog } from "./CreateEntryDialog";
import { BottomNavigation } from "../BottomNavigation";

export function JournalModule() {
  const navigate = useNavigate();
  const backend = useBackend();
  const queryClient = useQueryClient();
  
  const [showCreateEntry, setShowCreateEntry] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: entries } = useQuery({
    queryKey: ["journal-entries"],
    queryFn: () => backend.journal.getEntries(),
  });

  const filteredEntries = entries?.entries.filter(entry =>
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.content.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const groupedEntries = filteredEntries.reduce((groups, entry) => {
    const date = new Date(entry.date).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {} as Record<string, typeof filteredEntries>);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-rose-600 px-4 py-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="text-white hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-white">Digital Journal</h1>
            <p className="text-white/80 text-sm">Capture your thoughts and memories</p>
          </div>
          <button
            onClick={() => setShowCreateEntry(true)}
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your entries..."
            className="pl-10"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Button
            onClick={() => setShowCreateEntry(true)}
            className="flex-1 bg-pink-600 hover:bg-pink-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Entry
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              const todayEntry = entries?.entries.find(entry => 
                entry.date.split('T')[0] === today
              );
              if (todayEntry) {
                // Could open edit dialog here
              } else {
                setShowCreateEntry(true);
              }
            }}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Today's Entry
          </Button>
        </div>

        {/* Journal Entries */}
        {Object.keys(groupedEntries).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedEntries)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([date, dayEntries]) => (
                <div key={date} className="bg-white rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar className="w-5 h-5 text-pink-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {new Date(date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    {dayEntries.map((entry) => (
                      <div key={entry.id} className="border-l-4 border-l-pink-500 pl-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{entry.title}</h4>
                          <span className="text-sm text-gray-500">
                            {new Date(entry.date).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        <div className="prose prose-sm max-w-none">
                          <p className="text-gray-700 whitespace-pre-wrap">{entry.content}</p>
                        </div>
                        {entry.mood && (
                          <div className="mt-3">
                            <span className="inline-flex items-center px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">
                              Mood: {entry.mood}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-pink-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-pink-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? "No entries found" : "Start your journal"}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery 
                ? "Try adjusting your search terms" 
                : "Write your first entry to begin capturing your thoughts"
              }
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setShowCreateEntry(true)}
                className="bg-pink-600 hover:bg-pink-700"
              >
                Write First Entry
              </Button>
            )}
          </div>
        )}
      </div>

      <CreateEntryDialog
        open={showCreateEntry}
        onOpenChange={setShowCreateEntry}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
          setShowCreateEntry(false);
        }}
      />

      <BottomNavigation />
    </div>
  );
}
