import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Moon, Sun, X, RefreshCw, User, Settings, AlertCircle, AlertTriangle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { validateStudentProfile } from '../services/validation';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onResetApp: () => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
  isDarkMode: propIsDarkMode,
  onToggleDarkMode: propOnToggleDarkMode,
  onResetApp,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const themeContext = useTheme();
  const isDark = propIsDarkMode !== undefined ? propIsDarkMode : themeContext.isDarkMode;
  const toggleTheme = propOnToggleDarkMode || themeContext.toggleDarkMode;

  // Form states (strictly non-auth fields)
  const [name, setName] = useState(userProfile.name);
  const [school, setSchool] = useState(userProfile.school);
  const [targetExam, setTargetExam] = useState(userProfile.targetExam);
  const [targetScore, setTargetScore] = useState(userProfile.targetScore);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateStudentProfile(name, school, targetExam, targetScore);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    const updated: UserProfile = {
      ...userProfile,
      name: name.trim(),
      school: school.trim(),
      targetExam: targetExam.trim(),
      targetScore: targetScore.trim(),
    };
    onUpdateProfile(updated);
    setSaveSuccessMsg('Profile saved to your device!');
    setTimeout(() => setSaveSuccessMsg(''), 2500);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs">
        <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-3 py-1 font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Student Profile</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1 font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Preferences</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Close modal"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab 1: Profile Details */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
              {saveSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium text-center">
                  {saveSuccessMsg}
                </div>
              )}

              <div className="flex items-center gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.name || 'Student'}
                  className="w-14 h-14 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800"
                />
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {userProfile.name || 'New Student'}
                  </h3>
                  <div className="text-neutral-500 dark:text-neutral-400 text-xs">
                    {userProfile.targetExam || 'No examination set'} · <span className="capitalize text-emerald-600 dark:text-emerald-400 font-medium">{userProfile.tier} Plan</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                    Student Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    placeholder="e.g. Alex Morgan"
                    className={`w-full px-3 py-2 rounded-lg border bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 ${
                      errors.name
                        ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-500'
                        : 'border-neutral-200 dark:border-neutral-700 focus:ring-emerald-500'
                    }`}
                  />
                  {errors.name && (
                    <div className="flex items-center gap-1 text-[11px] text-rose-500 dark:text-rose-400 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.name}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                    Institution / School <span className="text-neutral-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => {
                      setSchool(e.target.value);
                      if (errors.school) setErrors((prev) => ({ ...prev, school: '' }));
                    }}
                    placeholder="e.g. University / High School / Academy"
                    className={`w-full px-3 py-2 rounded-lg border bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 ${
                      errors.school
                        ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-500'
                        : 'border-neutral-200 dark:border-neutral-700 focus:ring-emerald-500'
                    }`}
                  />
                  {errors.school && (
                    <div className="flex items-center gap-1 text-[11px] text-rose-500 dark:text-rose-400 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.school}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                      Primary Exam <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={targetExam}
                      onChange={(e) => {
                        setTargetExam(e.target.value);
                        if (errors.targetExam) setErrors((prev) => ({ ...prev, targetExam: '' }));
                      }}
                      placeholder="e.g. JAMB UTME, WAEC, SAT"
                      className={`w-full px-3 py-2 rounded-lg border bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 ${
                        errors.targetExam
                          ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-500'
                          : 'border-neutral-200 dark:border-neutral-700 focus:ring-emerald-500'
                      }`}
                    />
                    {errors.targetExam && (
                      <div className="flex items-center gap-1 text-[11px] text-rose-500 dark:text-rose-400 mt-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.targetExam}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                      Target Score / Goal <span className="text-neutral-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={targetScore}
                      onChange={(e) => {
                        setTargetScore(e.target.value);
                        if (errors.targetScore) setErrors((prev) => ({ ...prev, targetScore: '' }));
                      }}
                      placeholder="e.g. 320+ / 400 or Grade A"
                      className={`w-full px-3 py-2 rounded-lg border bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 ${
                        errors.targetScore
                          ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-500'
                          : 'border-neutral-200 dark:border-neutral-700 focus:ring-emerald-500'
                      }`}
                    />
                    {errors.targetScore && (
                      <div className="flex items-center gap-1 text-[11px] text-rose-500 dark:text-rose-400 mt-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.targetScore}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Settings & Appearance */}
          {activeTab === 'settings' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              <div>
                <h4 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-3">
                  Interface Theme
                </h4>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40">
                  <div className="flex items-center gap-2.5 text-xs text-neutral-700 dark:text-neutral-300">
                    {isDark ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                    <span>{isDark ? 'Dark Mode (Study friendly)' : 'Light Mode (Paper clean)'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 self-start sm:self-auto transition-colors cursor-pointer"
                  >
                    Switch to {isDark ? 'Light' : 'Dark'}
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-3">
                  Notification Preferences
                </h4>
                <div className="space-y-2.5 text-xs text-neutral-700 dark:text-neutral-300">
                  <label className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-colors">
                    <span>Daily Study Task Reminders</span>
                    <input
                      type="checkbox"
                      checked={userProfile.notificationSettings.sessionReminders}
                      onChange={(e) => {
                        onUpdateProfile({
                          ...userProfile,
                          notificationSettings: {
                            ...userProfile.notificationSettings,
                            sessionReminders: e.target.checked,
                          },
                        });
                      }}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-colors">
                    <span>Missed Session Alerts & Auto-Rebalancing</span>
                    <input
                      type="checkbox"
                      checked={userProfile.notificationSettings.missedAlerts}
                      onChange={(e) => {
                        onUpdateProfile({
                          ...userProfile,
                          notificationSettings: {
                            ...userProfile.notificationSettings,
                            missedAlerts: e.target.checked,
                          },
                        });
                      }}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-colors">
                    <span>Exam Days Countdown & Spaced Repetition</span>
                    <input
                      type="checkbox"
                      checked={userProfile.notificationSettings.examCountdown}
                      onChange={(e) => {
                        onUpdateProfile({
                          ...userProfile,
                          notificationSettings: {
                            ...userProfile.notificationSettings,
                            examCountdown: e.target.checked,
                          },
                        });
                      }}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <h4 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-2">
                  Device Storage Maintenance
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3 leading-relaxed">
                  All your study plans, subjects, timetables, and progress are stored safely on this device. You can reset the application to its initial state at any time.
                </p>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset App</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Reset App */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Reset Study Flow?
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  This will erase your saved study plan, subjects, topics, timetable, completed sessions, progress, profile information, and preferences. The app will return to its initial state, just like when you first opened it. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  onResetApp();
                  onClose();
                }}
                className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
