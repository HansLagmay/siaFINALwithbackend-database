import { useMemo, useState, useEffect } from 'react';
import { calendarAPI, usersAPI } from '../../services/api';
import { inquiriesAPI } from '../../services/api';
import type { CalendarEvent, Inquiry, User } from '../../types';
import ScheduleViewingModal from './ScheduleViewingModal';
import { getUser } from '../../utils/session';

interface AgentCalendarProps {
  user: User | null;
}

const AgentCalendar = ({ user }: AgentCalendarProps) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [effectiveUser, setEffectiveUser] = useState<User | null>(null);
    const [inquiryMap, setInquiryMap] = useState<Record<string, Inquiry>>({});
    const [agentMap, setAgentMap] = useState<Record<string, User>>({});
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
    const [currentMonth, setCurrentMonth] = useState(() => new Date());
    const [selectedDate, setSelectedDate] = useState(() => new Date());

  useEffect(() => {
    const u = user || getUser('agent');
    setEffectiveUser(u);
  }, [user]);

  useEffect(() => {
    if (effectiveUser) {
      loadEvents();
      loadAgentInquiries(effectiveUser);
      loadAgents();
    } else {
      setLoading(false);
    }
  }, [effectiveUser]);

  const loadEvents = async () => {
    try {
      const response = await calendarAPI.getAll({ shared: true });
      if (Array.isArray(response.data)) {
        setEvents(response.data);
      } else {
        setEvents([]);
        setError('Failed to load calendar events. Please try again later.');
      }
    } catch (error) {
      console.error('Failed to load calendar events:', error);
      setError('Failed to load calendar events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = async () => {
    try {
      const res = await usersAPI.getAgents();
      const map: Record<string, User> = {};
      res.data.forEach((agent: User) => { map[agent.id] = agent; });
      setAgentMap(map);
    } catch (err) {
      console.error('Failed to load agents for calendar display:', err);
    }
  };

  const loadAgentInquiries = async (u: User) => {
    try {
      const res = await inquiriesAPI.getAll();
      const mine = res.data.filter((i: Inquiry) =>
        (i.assignedTo === u.id || i.claimedBy === u.id)
      );
      const map: Record<string, Inquiry> = {};
      mine.forEach((i: Inquiry) => { map[i.id] = i; });
      setInquiryMap(map);
    } catch (err) {
      console.error('Failed to load inquiries for calendar details:', err);
    }
  };

  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const selectedLabel = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const startDay = startOfMonth.getDay();
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const calendarDays = useMemo(() => {
    return Array.from({ length: 42 }, (_, i) => {
      const dayNumber = i - startDay + 1;
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNumber);
      const inMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
      return { date, inMonth };
    });
  }, [currentMonth, startDay, daysInMonth]);
  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const eventsForSelectedDate = Array.isArray(events)
    ? events.filter((event) => isSameDay(new Date(event.start), selectedDate))
    : [];
  const dateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    const d = `${date.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const eventCountByDate = useMemo(() => {
    if (!Array.isArray(events)) return {};
    return events.reduce<Record<string, number>>((acc, event) => {
      const key = dateKey(new Date(event.start));
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [events]);
  const formatDateInput = (date: Date) => {
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    const d = `${date.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const selectedDateInput = formatDateInput(selectedDate);

  if (loading) {
    return <div className="p-8">Loading calendar...</div>;
  }

  return (
    <div className="p-8">
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Calendar</h1>
        <button
          onClick={() => { setEditingEvent(null); setShowScheduleModal(true); }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
        >
          + Schedule Viewing
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-gray-900 font-semibold">{monthLabel}</div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              className="px-2 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
            >
              ‹
            </button>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              className="px-2 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
            >
              ›
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 text-sm text-gray-500 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <div key={d} className="text-center py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map(({ date, inMonth }, index) => {
            const isSelected = isSameDay(date, selectedDate);
            const key = dateKey(date);
            const count = eventCountByDate[key] || 0;
            return (
              <button
                key={`${currentMonth.getFullYear()}-${currentMonth.getMonth()}-${index}`}
                onClick={() => { setSelectedDate(date); setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1)); }}
                className={`h-12 w-full rounded-lg text-base relative ${isSelected ? 'bg-blue-600 text-white' : inMonth ? 'text-gray-800 hover:bg-blue-50' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                <span>{date.getDate()}</span>
                {count > 0 && (
                  <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 text-xs rounded-full ${isSelected ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-700'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="text-gray-900 font-semibold">{selectedLabel}</div>
          <div className="text-sm text-gray-500">
            {eventsForSelectedDate.length} event{eventsForSelectedDate.length === 1 ? '' : 's'}
          </div>
        </div>
        {eventsForSelectedDate.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            No scheduled events on this date.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {eventsForSelectedDate.map((event) => (
              <div key={event.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{event.title}</h3>
                    <div className="text-sm text-gray-600 mb-3 space-y-1">
                      {(() => {
                        const linkedInquiry = event.inquiryId ? inquiryMap[event.inquiryId] : undefined;
                        const customerLine = event.description?.split('\n').find(l => l.startsWith('Customer: '));
                        const ticketLine = event.description?.split('\n').find(l => l.startsWith('Ticket: '));
                        const agent = agentMap[event.agentId];
                        return (
                          <>
                            <p>Customer: <span className="font-semibold">{linkedInquiry?.name || (customerLine ? customerLine.replace('Customer: ', '') : '—')}</span></p>
                            <p>Ticket: <span className="font-mono">{linkedInquiry?.ticketNumber || (ticketLine ? ticketLine.replace('Ticket: ', '') : '—')}</span></p>
                            <p>Agent: <span className="font-semibold">{agent ? agent.name : event.agentId}</span></p>
                            {linkedInquiry?.propertyTitle && (
                              <p>Property: <span className="font-semibold">{linkedInquiry.propertyTitle}</span></p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>📅 <strong>Start:</strong> {new Date(event.start).toLocaleString()}</p>
                      <p>📅 <strong>End:</strong> {new Date(event.end).toLocaleString()}</p>
                      <p>🏷️ <strong>Type:</strong> 
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                          event.type === 'viewing' ? 'bg-blue-100 text-blue-800' :
                          event.type === 'meeting' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {event.type}
                        </span>
                      </p>
                    </div>
                  </div>
                  {effectiveUser && event.agentId === effectiveUser.id && (
                    <div className="ml-4">
                      <button
                        onClick={() => { setEditingEvent(event); setShowScheduleModal(true); }}
                        className="px-3 py-2 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 p-6 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Click a date to view events. Use the + button to schedule a viewing.
        </p>
      </div>

      {showScheduleModal && effectiveUser && (
        <ScheduleViewingModal
          user={effectiveUser}
          event={editingEvent || undefined}
          initialDate={editingEvent ? undefined : selectedDateInput}
          onClose={() => setShowScheduleModal(false)}
          onSuccess={() => {
            if (effectiveUser) {
              loadEvents();
            }
          }}
        />
      )}
    </div>
  );
};

export default AgentCalendar;
