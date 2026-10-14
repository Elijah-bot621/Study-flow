import React, { useState } from 'react';
import { UserProfile } from '../types';
import { validateStudentProfile } from '../services/validation';
import { BookOpen, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

interface WelcomeSetupProps {
  initialProfile: UserProfile;
  onComplete: (updatedProfile: UserProfile) => void;
  onSkip: () => void;
}

export const WelcomeSetup: React.FC<WelcomeSetupProps> = ({
  initialProfile,
  onComplete,
  onSkip,
}) => {
  const [name, setName] = useState(initialProfile.name || '');
  const [school, setSchool] = useState(initialProfile.school || '');
  const [targetExam, setTargetExam] = useState(initialProfile.targetExam || '');
  const [targetScore, setTargetScore] = useState(initialProfile.targetScore || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateStudentProfile(name, school, targetExam, targetScore);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    const updated: UserProfile = {
      ...initialProfile,
      name: name.trim(),
      school: school.trim(),
      targetExam: targetExam.trim(),
      targetScore: targetScore.trim(),
    };
    onComplete(updated);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col justify-center items-center px-4 py-8 sm:py-12 transition-colors">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 mb-1">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Welcome to StudyFlow
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
            Personalize your study profile in seconds. Enter only what is necessary to calibrate your study plan.
          </p>
        </div>

        {/* Profile Box (Reused from Profile Modal, excluding preferences tab) */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-5 sm:p-7 space-y-5">
          {/* Profile Header Preview */}
          <div className="flex items-center gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <img
              src={initialProfile.avatarUrl}
              alt={name || 'Student avatar'}
              className="w-14 h-14 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                {name.trim() || 'New Student'}
              </h3>
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                <span className="truncate">{targetExam || 'General Examination'}</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium shrink-0">Setup Ready</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleFinish} className="space-y-4 text-xs">
            {/* Student Name */}
            <div>
              <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-semibold">
                Student Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                placeholder="e.g. Alex Morgan or Sarah Adebayo"
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 ${
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

            {/* School / Institution */}
            <div>
              <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-semibold">
                School / Institution <span className="text-neutral-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={school}
                onChange={(e) => {
                  setSchool(e.target.value);
                  if (errors.school) setErrors((prev) => ({ ...prev, school: '' }));
                }}
                placeholder="e.g. University / High School / Academy"
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 ${
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

            {/* Primary Exam and Target Score in Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-semibold">
                  Primary Examination <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={targetExam}
                  onChange={(e) => {
                    setTargetExam(e.target.value);
                    if (errors.targetExam) setErrors((prev) => ({ ...prev, targetExam: '' }));
                  }}
                  placeholder="e.g. JAMB, WAEC, GCSE, Finals"
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 ${
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
                <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-semibold">
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
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 ${
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

            {/* Privacy Promise */}
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400 flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Zero signups or passwords. All your study schedule data is stored privately on your local device.
              </span>
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <span>Save & Continue to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onSkip}
                className="w-full py-2 text-xs text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 font-medium transition-colors cursor-pointer"
              >
                Skip for now & go to Dashboard
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
