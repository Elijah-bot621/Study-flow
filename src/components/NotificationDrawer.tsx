import React from 'react';
import { NotificationItem, ActivePage } from '../types';
import { Bell, Check, Clock, AlertTriangle, Calendar, Award, X } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onAutoRescheduleMissed: () => void;
  onNavigateToPage: (page: ActivePage) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onAutoRescheduleMissed,
  onNavigateToPage,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'missed':
        return <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />;
      case 'upcoming':
        return <Clock className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />;
      case 'countdown':
        return <Calendar className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />;
      case 'revision':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
      case 'goal':
        return <Award className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />;
      default:
        return <Bell className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />;
    }
  };

  const handleAction = (item: NotificationItem) => {
    onMarkAsRead(item.id);
    if (item.actionType === 'reschedule') {
      onAutoRescheduleMissed();
      onClose();
    } else if (item.actionType === 'timetable') {
      onNavigateToPage('timetable');
      onClose();
    } else if (item.actionType === 'review') {
      onNavigateToPage('progress');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-neutral-950/40 backdrop-blur-xs flex justify-end">
      <div 
        className="w-full sm:max-w-md bg-white dark:bg-neutral-900 h-full border-l border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-2">
            <h2 id="notification-title" className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Study Alerts & Reminders
            </h2>
            {unreadCount > 0 && (
              <span className="text-xs px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full font-mono tabular-nums">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-sm text-neutral-400 dark:text-neutral-500">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No active study notifications.</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 sm:p-4 rounded-xl border transition-colors ${
                  item.read
                    ? 'bg-neutral-50/50 dark:bg-neutral-900/50 border-neutral-100 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                    : 'bg-white dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  {getIcon(item.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-xs font-semibold truncate ${item.read ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-900 dark:text-white'}`}>
                        {item.title}
                      </h4>
                      {!item.read && (
                        <button
                          onClick={() => onMarkAsRead(item.id)}
                          className="text-[11px] text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-0.5 shrink-0"
                          title="Mark read"
                        >
                          <Check className="w-3 h-3" />
                          <span>Dismiss</span>
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                      {item.message}
                    </p>

                    {item.actionLabel && (
                      <button
                        onClick={() => handleAction(item)}
                        className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        {item.actionLabel} &rarr;
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 shrink-0">
          <span>Reminders synced with exam syllabus</span>
          <button
            onClick={() => {
              notifications.forEach((n) => onMarkAsRead(n.id));
            }}
            className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white font-medium"
          >
            Mark all read
          </button>
        </div>
      </div>
    </div>
  );
};
