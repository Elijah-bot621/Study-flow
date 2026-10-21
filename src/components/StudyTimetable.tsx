import React, { useState } from 'react';
import { 
  StudySession, 
  SessionStatus, 
  SessionType, 
  TopicDifficulty,
  Exam 
} from '../types';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  SkipForward, 
  Play, 
  Filter, 
  RefreshCw,
  BookOpen,
  CalendarDays,
  LayoutGrid,
  ListOrdered,
  X,
  AlertCircle
} from 'lucide-react';
import { validateRescheduleSlot } from '../services/validation';
import { getTodayLocalDateString, toLocalDateString, parseLocalDate, addDaysToLocalDateString } from '../services/dateUtils';

interface StudyTimetableProps {
  sessions: StudySession[];
  exam: Exam | null;
  onStartFocusSession: (session: StudySession) => void;
  onUpdateSessionStatus: (sessionId: string, newStatus: SessionStatus) => void;
  onRescheduleSession: (sessionId: string, newDate: string, newTimeSlot: string) => void;
  onAutoRedistribute: () => void;
}

export const StudyTimetable: React.FC<StudyTimetableProps> = ({
  sessions,
  exam,
  onStartFocusSession,
  onUpdateSessionStatus,
  onRescheduleSession,
  onAutoRedistribute,
}) => {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'calendar'>('daily');
  const todayIso = getTodayLocalDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Reschedule state
  const [reschedulingSession, setReschedulingSession] = useState<StudySession | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>(todayIso);
  const [rescheduleTime, setRescheduleTime] = useState<string>('17:30 - 18:30');
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  // Date navigation helpers
  const shiftDay = (days: number) => {
    setSelectedDate(addDaysToLocalDateString(selectedDate, days));
  };

  // Filtered sessions
  const filteredSessions = sessions.filter((s) => {
    if (subjectFilter !== 'all' && s.subjectName !== subjectFilter) return false;
    if (typeFilter !== 'all' && s.sessionType !== typeFilter) return false;
    return true;
  });

  // Unique subjects for filter
  const subjectsList = Array.from(new Set(sessions.map((s) => s.subjectName)));

  // Daily View Sessions
  const dailySessions = filteredSessions
    .filter((s) => s.date === selectedDate)
    .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

  // Weekly View Calculations (7 days from selectedDate or start of week)
  const getWeekDates = (baseDateStr: string) => {
    const curr = parseLocalDate(baseDateStr);
    const firstDayOfWeek = new Date(curr);
    firstDayOfWeek.setDate(curr.getDate() - curr.getDay() + 1); // Monday start
    const week: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(firstDayOfWeek);
      d.setDate(firstDayOfWeek.getDate() + i);
      week.push(toLocalDateString(d));
    }
    return week;
  };

  const weekDates = getWeekDates(selectedDate);

  // Calendar View Month Calculations
  const getCalendarDays = (dateStr: string) => {
    const d = parseLocalDate(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push({ dateStr: '', dayNum: 0, isCurrentMonth: false });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({ dateStr: formatted, dayNum: day, isCurrentMonth: true });
    }
    
    return days;
  };

  const calendarDays = getCalendarDays(selectedDate);

  const getDifficultyBadge = (diff: TopicDifficulty) => {
    if (diff === 'weak') {
      return <span className="text-rose-600 dark:text-rose-400 font-medium">Weak Area</span>;
    }
    if (diff === 'average') {
      return <span className="text-amber-600 dark:text-amber-400">Average</span>;
    }
    return <span className="text-emerald-600 dark:text-emerald-400">Strong</span>;
  };

  const getTypeStyle = (type: SessionType) => {
    switch (type) {
      case 'learn':
        return 'text-blue-600 dark:text-blue-400';
      case 'practice':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'revision':
        return 'text-amber-600 dark:text-amber-400';
      case 'test':
        return 'text-purple-600 dark:text-purple-400';
      default:
        return 'text-neutral-500';
    }
  };

  const handleSaveReschedule = () => {
    if (!reschedulingSession) return;
    const validation = validateRescheduleSlot(rescheduleDate, rescheduleTime);
    if (!validation.valid) {
      setRescheduleError(validation.error || 'Please choose a valid future date.');
      return;
    }
    setRescheduleError(null);
    onRescheduleSession(reschedulingSession.id, rescheduleDate, rescheduleTime);
    setReschedulingSession(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Top Header & View Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Study Timetable
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            <span className="font-medium text-neutral-700 dark:text-neutral-300">{exam ? exam.title : 'Study Plan'}</span>
            <span aria-hidden="true">·</span>
            <span>Spaced Repetition & Daily Flow</span>
          </div>
        </div>

        {/* View Mode Tabs (Daily, Weekly, Calendar) */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs font-medium">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                viewMode === 'daily'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Daily</span>
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                viewMode === 'weekly'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Weekly</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
          </div>

          <button
            onClick={onAutoRedistribute}
            className="p-2 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Auto-Redistribute Missed Tasks"
            aria-label="Auto-Redistribute Missed Tasks"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter & Date Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs text-xs">
        {/* Date Selector Navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => shiftDay(-1)}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono text-xs"
          />

          <button
            onClick={() => shiftDay(1)}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {selectedDate !== todayIso && (
            <button
              onClick={() => setSelectedDate(todayIso)}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline px-1.5 py-1"
            >
              Today
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs max-w-[150px] truncate"
          >
            <option value="all">All Subjects</option>
            {subjectsList.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs max-w-[150px] truncate"
          >
            <option value="all">All Types</option>
            <option value="learn">Learn</option>
            <option value="practice">Practice</option>
            <option value="revision">Revision</option>
            <option value="test">Test</option>
          </select>
        </div>
      </div>

      {/* 1. DAILY VIEW */}
      {viewMode === 'daily' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>
              Schedule for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="font-mono tabular-nums">{dailySessions.length} Study Sessions</span>
          </div>

          {dailySessions.length === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
              <BookOpen className="w-8 h-8 text-neutral-400 dark:text-neutral-500 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  {sessions.length === 0 ? 'No study timetable generated yet' : 'No study sessions for this date with active filters'}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                  {sessions.length === 0
                    ? 'Create your study plan to generate your personalized daily timetable.'
                    : 'Try selecting another date or resetting filters.'}
                </p>
              </div>
              {sessions.length > 0 && (
                <button
                  onClick={() => {
                    setSubjectFilter('all');
                    setTypeFilter('all');
                  }}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {dailySessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    session.status === 'completed'
                      ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/20'
                      : session.status === 'skipped'
                      ? 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 opacity-70'
                      : session.status === 'rescheduled'
                      ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/15 dark:bg-amber-950/20'
                      : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Metadata & Topic */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                        <span className="font-bold text-neutral-900 dark:text-white">
                          {session.subjectName}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-neutral-700 dark:text-neutral-300 tabular-nums">
                          {session.timeSlot}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className={`capitalize font-medium ${getTypeStyle(session.sessionType)}`}>
                          {session.sessionType}
                        </span>
                        <span aria-hidden="true">·</span>
                        {getDifficultyBadge(session.difficulty)}
                        {session.topicSequenceOrder && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] flex items-center gap-0.5 font-medium">
                              <ListOrdered className="w-3 h-3" />
                              <span>Seq #{session.topicSequenceOrder}</span>
                            </span>
                          </>
                        )}
                        {session.isPriorityBoosted && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">Priority Boost</span>
                          </>
                        )}
                        {session.status === 'rescheduled' && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-amber-600 text-[11px]">Rescheduled</span>
                          </>
                        )}
                      </div>

                      <h3 className={`text-base font-semibold truncate sm:whitespace-normal ${
                        session.status === 'completed'
                          ? 'line-through text-neutral-400 dark:text-neutral-500'
                          : 'text-neutral-900 dark:text-white'
                      }`}>
                        {session.topicName}
                      </h3>

                      {session.notes && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 italic">
                          "{session.notes}"
                        </p>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-end md:self-center">
                      {session.status !== 'completed' && (
                        <button
                          onClick={() => onStartFocusSession(session)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200/60 dark:border-emerald-800/80 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Start Focus</span>
                        </button>
                      )}

                      <button
                        onClick={() =>
                          onUpdateSessionStatus(
                            session.id,
                            session.status === 'completed' ? 'scheduled' : 'completed'
                          )
                        }
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                          session.status === 'completed'
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200'
                        }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{session.status === 'completed' ? 'Done' : 'Mark Done'}</span>
                      </button>

                      {session.status !== 'completed' && (
                        <>
                          <button
                            onClick={() =>
                              onUpdateSessionStatus(
                                session.id,
                                session.status === 'skipped' ? 'scheduled' : 'skipped'
                              )
                            }
                            className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            title={session.status === 'skipped' ? 'Restore Session' : 'Skip Session'}
                            aria-label="Skip session"
                          >
                            <SkipForward className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setReschedulingSession(session);
                              setRescheduleDate(session.date);
                              setRescheduleTime(session.timeSlot);
                            }}
                            className="text-xs text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white px-2 py-1.5 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
                          >
                            Reschedule
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. WEEKLY VIEW */}
      {viewMode === 'weekly' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {weekDates.map((dateStr) => {
              const daySessions = filteredSessions.filter((s) => s.date === dateStr);
              const d = new Date(dateStr + 'T00:00:00');
              const isToday = dateStr === todayIso;
              const isSelected = dateStr === selectedDate;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all min-h-[160px] flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-600 ring-1 ring-emerald-600 bg-emerald-50/15 dark:bg-emerald-950/25'
                      : isToday
                      ? 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900'
                      : 'border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800 text-xs">
                      <span className={`font-semibold ${isToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                        {d.toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span className="font-mono text-neutral-400 dark:text-neutral-500 tabular-nums">
                        {d.getDate()}
                      </span>
                    </div>

                    {/* Session miniature cards */}
                    <div className="mt-2 space-y-1.5">
                      {daySessions.slice(0, 3).map((s) => (
                        <div
                          key={s.id}
                          className={`p-1.5 rounded-lg border text-[11px] leading-tight ${
                            s.status === 'completed'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 line-through dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/40'
                              : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                          }`}
                        >
                          <div className="font-semibold truncate">{s.subjectName}</div>
                          <div className="text-[10px] text-neutral-400 dark:text-neutral-400 truncate">{s.topicName}</div>
                        </div>
                      ))}

                      {daySessions.length > 3 && (
                        <div className="text-[10px] text-neutral-400 dark:text-neutral-500 text-center font-mono">
                          +{daySessions.length - 3} more
                        </div>
                      )}

                      {daySessions.length === 0 && (
                        <div className="text-[11px] text-neutral-400 dark:text-neutral-500 pt-3 text-center">
                          Free Day
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-[10px] text-neutral-400 dark:text-neutral-500 text-right font-mono pt-2">
                    {daySessions.filter((s) => s.status === 'completed').length}/{daySessions.length} done
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => setViewMode('daily')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
            >
              Open Selected Day ({selectedDate}) in Detailed Daily View &rarr;
            </button>
          </div>
        </div>
      )}

      {/* 3. CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="p-4 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between text-sm font-bold text-neutral-900 dark:text-white pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <span>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => shiftDay(-30)}
                className="p-1 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => shiftDay(30)}
                className="p-1 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 text-center text-[11px] sm:text-xs font-semibold text-neutral-400 dark:text-neutral-500">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Month Matrix */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarDays.map((cell, idx) => {
              if (!cell.isCurrentMonth) {
                return <div key={idx} className="min-h-[50px] sm:h-20 bg-neutral-50/30 dark:bg-neutral-950/20 rounded-xl" />;
              }

              const cellSessions = filteredSessions.filter((s) => s.date === cell.dateStr);
              const isSelected = cell.dateStr === selectedDate;
              const isToday = cell.dateStr === todayIso;

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => setSelectedDate(cell.dateStr)}
                  className={`min-h-[52px] sm:h-20 p-1 sm:p-2 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20 ring-1 ring-emerald-600'
                      : isToday
                      ? 'border-neutral-400 dark:border-neutral-600 bg-white dark:bg-neutral-800'
                      : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/60'
                  }`}
                >
                  <div className="flex justify-between text-[11px] sm:text-xs">
                    <span className={`font-mono ${isToday ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-neutral-600 dark:text-neutral-400'}`}>
                      {cell.dayNum}
                    </span>
                    {cellSessions.length > 0 && (
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                        {cellSessions.length}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-0.5 sm:gap-1 mt-1">
                    {cellSessions.slice(0, 3).map((s) => (
                      <div
                        key={s.id}
                        className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                          s.status === 'completed'
                            ? 'bg-emerald-500'
                            : s.difficulty === 'weak'
                            ? 'bg-rose-500'
                            : 'bg-blue-500'
                        }`}
                        title={`${s.subjectName}: ${s.topicName}`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Reschedule Study Session
              </h3>
              <button
                onClick={() => setReschedulingSession(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Moving "{reschedulingSession.topicName}" ({reschedulingSession.subjectName})
            </p>

            {rescheduleError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-start gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{rescheduleError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">New Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  min={todayIso}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-medium mb-1">Time Slot</label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                >
                  <option value="06:00 - 07:00">Early Morning (06:00 - 07:00)</option>
                  <option value="09:30 - 10:30">Morning (09:30 - 10:30)</option>
                  <option value="15:00 - 16:00">Afternoon (15:00 - 16:00)</option>
                  <option value="17:30 - 18:30">Evening (17:30 - 18:30)</option>
                  <option value="20:30 - 21:30">Night (20:30 - 21:30)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                onClick={() => setReschedulingSession(null)}
                className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReschedule}
                className="px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
              >
                Save New Time
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
