import React, { useState } from 'react';
import { Exam, PracticeScore, ActivePage } from '../types';
import { 
  Target, 
  Plus, 
  Sparkles, 
  BookOpen, 
  X,
  AlertCircle
} from 'lucide-react';
import { validatePracticeScoreInputs } from '../services/validation';

interface PracticeScoreTrackerProps {
  exam: Exam | null;
  practiceScores: PracticeScore[];
  onLogScore: (scoreData: {
    subjectId: string;
    topicId: string;
    subjectName: string;
    topicName: string;
    scorePercentage: number;
    totalQuestions: number;
    correctAnswers: number;
    notes?: string;
  }) => void;
  onNavigate: (page: ActivePage) => void;
}

export const PracticeScoreTracker: React.FC<PracticeScoreTrackerProps> = ({
  exam,
  practiceScores,
  onLogScore,
  onNavigate,
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    exam?.subjects[0]?.id || ''
  );
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    exam?.subjects[0]?.topics[0]?.id || ''
  );
  const [correctAnswers, setCorrectAnswers] = useState<number>(9);
  const [totalQuestions, setTotalQuestions] = useState<number>(20);
  const [notes, setNotes] = useState<string>('Struggled with relative velocity and projectile angles.');
  const [recentImpactMsg, setRecentImpactMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Subject and topic handling
  const activeSubject = exam?.subjects.find((s) => s.id === selectedSubjectId);
  const activeTopic = activeSubject?.topics.find((t) => t.id === selectedTopicId);

  const calculatedPercentage = totalQuestions > 0
    ? Math.round((correctAnswers / totalQuestions) * 100)
    : 0;

  const handleSubmitScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubject || !activeTopic) {
      setFormError('Please select both a subject and a topic.');
      return;
    }

    const validation = validatePracticeScoreInputs(totalQuestions, correctAnswers);
    if (!validation.valid) {
      setFormError(validation.error || 'Please provide valid score values.');
      return;
    }

    setFormError(null);
    onLogScore({
      subjectId: activeSubject.id,
      topicId: activeTopic.id,
      subjectName: activeSubject.name,
      topicName: activeTopic.name,
      scorePercentage: calculatedPercentage,
      totalQuestions,
      correctAnswers,
      notes,
    });

    if (calculatedPercentage < 60) {
      setRecentImpactMsg(
        `Score recorded (${calculatedPercentage}%). Smart Engine flagged "${activeTopic.name}" as a Weak Area and added priority revision sessions to your timetable!`
      );
    } else {
      setRecentImpactMsg(
        `Great job! Score recorded (${calculatedPercentage}%). Topic mastery updated.`
      );
    }

    setIsModalOpen(false);
    setTimeout(() => {
      setRecentImpactMsg(null);
    }, 6000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Practice & Test Score Tracking
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Log scores from past questions, mock exams, and CBT practice to automatically adapt your revision plan.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs self-start sm:self-auto transition-colors w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log Practice Test</span>
        </button>
      </div>

      {/* Dynamic Feedback Banner when score is saved */}
      {recentImpactMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
              Timetable Adaptive Rebalancing Applied
            </div>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
              {recentImpactMsg}
            </p>
          </div>
        </div>
      )}

      {/* Concept Demonstration Spotlight */}
      <div className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
          <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>How Low Practice Scores Trigger Future Schedule Adjustments</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-xs">
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
            <span className="font-semibold text-neutral-900 dark:text-white block mb-1">
              1. Take Practice Test
            </span>
            <span className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Enter your test result (e.g. Physics — Kinematics — 45%).
            </span>
          </div>
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
            <span className="font-semibold text-neutral-900 dark:text-white block mb-1">
              2. Weak Area Detection
            </span>
            <span className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Scores under 60% automatically lower topic difficulty to 'Weak' and lower syllabus mastery.
            </span>
          </div>
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
            <span className="font-semibold text-neutral-900 dark:text-white block mb-1">
              3. Automated Reinforcement
            </span>
            <span className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
              The Smart Study Engine injects spaced revision sessions into your timetable within 2-5 days.
            </span>
          </div>
        </div>
      </div>

      {/* Practice Scores Log Table */}
      <div className="p-4 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">
            Recorded Practice Tests ({practiceScores.length})
          </h2>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Sorted by most recent
          </span>
        </div>

        {practiceScores.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-400 dark:text-neutral-500 space-y-3">
            <BookOpen className="w-8 h-8 mx-auto opacity-30" />
            <p>No practice tests recorded yet.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
            >
              Log Your First Practice Score
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
            {practiceScores.map((score) => {
              const isWeak = score.scorePercentage < 60;
              const isStrong = score.scorePercentage >= 80;

              return (
                <div key={score.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                        <span className="font-semibold text-neutral-900 dark:text-white">
                          {score.subjectName}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{score.date}</span>
                        <span aria-hidden="true">·</span>
                        <span>{score.correctAnswers}/{score.totalQuestions} questions</span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white truncate">
                        {score.topicName}
                      </h3>
                    </div>

                    {/* Score Percentage */}
                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      <div className="text-right">
                        <div className={`text-xl font-bold font-mono tabular-nums ${
                          isWeak ? 'text-rose-500' : isStrong ? 'text-emerald-500' : 'text-amber-500'
                        }`}>
                          {score.scorePercentage}%
                        </div>
                        <div className="text-[10px] text-neutral-400 dark:text-neutral-500">
                          {isWeak ? 'Weak (<60%)' : isStrong ? 'Mastered (80%+)' : 'Average'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {score.notes && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 italic">
                      "{score.notes}"
                    </p>
                  )}

                  {/* Impact Action Note */}
                  {score.impactActionTaken && (
                    <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-300 flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{score.impactActionTaken}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Log Score Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 sm:px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Log Practice Test Score
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  The system will update topic mastery and calibrate your timetable.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!exam || !exam.subjects || exam.subjects.length === 0 ? (
              <div className="p-6 sm:p-8 text-center space-y-3">
                <BookOpen className="w-8 h-8 text-neutral-400 dark:text-neutral-500 mx-auto" />
                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  No Subjects Found
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
                  Please create your study plan first before logging practice examination scores.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    onNavigate('create-plan');
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                >
                  Create Study Plan
                </button>
              </div>
            ) : (
            <form onSubmit={handleSubmitScore} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">{formError}</span>
                </div>
              )}

              {/* Select Subject */}
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-semibold mb-1">
                  Subject
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    const sub = exam?.subjects.find((s) => s.id === e.target.value);
                    if (sub && sub.topics.length > 0) {
                      setSelectedTopicId(sub.topics[0].id);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  required
                >
                  {exam?.subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Select Topic */}
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-semibold mb-1">
                  Topic Tested
                </label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  required
                >
                  {activeSubject?.topics.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Score Input (Correct / Total) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-semibold mb-1">
                    Correct Answers
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={totalQuestions}
                    value={correctAnswers}
                    onChange={(e) => setCorrectAnswers(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300 font-semibold mb-1">
                    Total Questions
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={totalQuestions}
                    onChange={(e) => setTotalQuestions(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono"
                    required
                  />
                </div>
              </div>

              {/* Calculated Percentage Preview */}
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">Score Percentage:</span>
                <span className="font-mono text-base font-bold text-neutral-900 dark:text-white">
                  {calculatedPercentage}%
                </span>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-semibold mb-1">
                  Test Observations / Areas of Confusion
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Lost marks on projectile equations and graph analysis."
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors"
                >
                  Save & Update Schedule
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
