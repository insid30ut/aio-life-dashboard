import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useBackend } from "../../hooks/useBackend";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateEventDialog } from "./CreateEventDialog";
import { BottomNavigation } from "../BottomNavigation";

export function CalendarModule() {
  const navigate = useNavigate();
  const backend = useBackend();
  const queryClient = useQueryClient();
  
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: () => backend.calendar.getEvents(),
  });

  const currentMonth = currentDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getEventsForDay = (day: number) => {
    if (!events) return [];
    
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayString = dayDate.toISOString().split('T')[0];
    
    return events.events.filter(event => 
      event.date.split('T')[0] === dayString
    );
  };

  const upcomingEvents = events?.events
    .filter(event => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="text-white hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-white">Calendar</h1>
            <p className="text-white/80 text-sm">Manage your schedule and events</p>
          </div>
          <button
            onClick={() => setShowCreateEvent(true)}
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Calendar Navigation */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900">{currentMonth}</h2>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {getDaysInMonth().map((day, index) => {
              const dayEvents = day ? getEventsForDay(day) : [];
              const isToday = day && 
                new Date().toDateString() === 
                new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
              
              return (
                <div
                  key={index}
                  className={`min-h-[60px] p-1 border border-gray-100 ${
                    day ? 'bg-white hover:bg-gray-50 cursor-pointer' : 'bg-gray-50'
                  } ${isToday ? 'bg-blue-50 border-blue-200' : ''}`}
                  onClick={() => day && setShowCreateEvent(true)}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-medium ${
                        isToday ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        {day}
                      </div>
                      {dayEvents.length > 0 && (
                        <div className="space-y-1 mt-1">
                          {dayEvents.slice(0, 2).map(event => (
                            <div
                              key={event.id}
                              className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded truncate"
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
            <Button
              onClick={() => setShowCreateEvent(true)}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Event
            </Button>
          </div>
          
          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(event.date).toLocaleDateString()} at{' '}
                      {new Date(event.date).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                    {event.description && (
                      <p className="text-sm text-gray-500 mt-1">{event.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-indigo-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">No upcoming events</h4>
              <p className="text-sm text-gray-600 mb-3">Create your first event to get started</p>
              <Button
                onClick={() => setShowCreateEvent(true)}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Create Event
              </Button>
            </div>
          )}
        </div>
      </div>

      <CreateEventDialog
        open={showCreateEvent}
        onOpenChange={setShowCreateEvent}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["events"] });
          setShowCreateEvent(false);
        }}
      />

      <BottomNavigation />
    </div>
  );
}
