import React, { useState, useEffect } from 'react';
import { StudySession } from '../types';
import { Play, Pause, RotateCcw, CheckCircle, X, Clock, BookOpen } from 'lucide-react';

interface FocusTimerModalProps {
  session: StudySession | null;
  isOpen: boolean;
  onClose: () => void;
  onCompleteSession: (sessionId: string, notes?: string) => void;
}

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({
  session,
  isOpen,
  onClose,
  onCompleteSession,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [timerDurationMinutes, setTimerDurationMinutes] = useState<number>(25);
  const [sessionNotes, setSessionNotes] = useState<string>('');

  useEffect(() => {
    if (session) {
      const dur = Math.min(session.durationMinutes, 60);
      setTimerDurationMinutes(dur);
      setSecondsRemaining(dur * 60);
      setIsActive(false);
      setSessionNotes(session.notes || '');
    }
  }, [session]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isActive) {
      setIsActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsRemaining]);

  if (!isOpen || !session) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.round(
    ((timerDurationMinutes * 60 - secondsRemaining) / (timerDurationMinutes * 60)) * 100
  );

  const setPreset = (mins: number) => {
    setTimerDurationMinutes(mins);
    setSecondsRemaining(mins * 60);
    setIsActive(false);
  };

  const handleFinish = () => {
    onCompleteSession(session.id, sessionNotes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Active Study Focus</span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">{session.sessionType}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 text-center space-y-5 sm:space-y-6 overflow-y-auto flex-1">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              {session.topicName}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {session.subjectName} · {session.timeSlot}
            </p>
          </div>

          {/* Timer Display */}
          <div className="relative inline-flex items-center justify-center">
            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full border-4 border-neutral-100 dark:border-neutral-800 flex flex-col items-center justify-center relative">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  className="stroke-emerald-600 dark:stroke-emerald-500"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray="289"
                  strokeDashoffset={289 - (289 * progressPercent) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-3xl sm:text-4xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white tabular-nums">
                {formatTime(secondsRemaining)}
              </span>
              <span className="text-[11px] sm:text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                {isActive ? 'In Focus Mode' : secondsRemaining === 0 ? 'Session Complete!' : 'Paused'}
              </span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 text-xs">
            <button
              onClick={() => setPreset(25)}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                timerDurationMinutes === 25
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent'
                  : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
              }`}
            >
              25m Pomodoro
            </button>
            <button
              onClick={() => setPreset(45)}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                timerDurationMinutes === 45
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent'
                  : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
              }`}
            >
              45m Deep Study
            </button>
            <button
              onClick={() => setPreset(60)}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                timerDurationMinutes === 60
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent'
                  : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
              }`}
            >
              60m Full Hour
            </button>
          </div>

          {/* Timer Controls */}
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => setIsActive(!isActive)}
              className="flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm transition-colors shadow-xs"
            >
              {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isActive ? 'Pause Timer' : 'Start Focus'}</span>
            </button>
            <button
              onClick={() => {
                setIsActive(false);
                setSecondsRemaining(timerDurationMinutes * 60);
              }}
              className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
              title="Reset Timer"
              aria-label="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Notes */}
          <div className="text-left space-y-1.5">
            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Session Insights & Formulas Noted
            </label>
            <textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="e.g. Mastered v = u + at and work done formula, need more practice on relative velocity."
              rows={2}
              className="w-full text-xs p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 px-5 sm:px-6 py-4 bg-neutral-50 dark:bg-neutral-800/40 border-t border-neutral-100 dark:border-neutral-800 shrink-0">
          <button
            onClick={onClose}
            className="text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 py-1"
          >
            Study in Background
          </button>
          <button
            onClick={handleFinish}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors w-full sm:w-auto"
          >
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Mark Complete & Log Study Time</span>
          </button>
        </div>
      </div>
    </div>
  );
};
