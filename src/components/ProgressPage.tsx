import React, { useState } from 'react';
import { Exam, StudySession, PracticeScore, UserProfile, ActivePage, Topic } from '../types';
import { 
  TrendingUp, 
  Flame, 
  Clock, 
  CheckCircle, 
  Target, 
  ArrowRight,
  Sparkles,
  BookOpen
} from 'lucide-react';

interface ProgressPageProps {
  exam: Exam | null;
  sessions: StudySession[];
  practiceScores: PracticeScore[];
  userProfile: UserProfile;
  onNavigate: (page: ActivePage) => void;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({
  exam,
  sessions,
  practiceScores,
  userProfile,
  onNavigate,
}) => {
  const [selectedSubjectTab, setSelectedSubjectTab] = useState<string>('all');

  // Overall sessions completion stats
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.status === 'completed').length;
  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  // Flatten all topics
  interface TopicWithSubject {
    subjectName: string;
    subjectColor: string;
    topic: Topic;
  }
  const allTopics: TopicWithSubject[] = [];

  if (exam) {
    exam.subjects.forEach((subj) => {
      subj.topics.forEach((t) => {
        allTopics.push({
          subjectName: subj.name,
          subjectColor: subj.color,
          topic: t,
        });
      });
    });
  }

  // Weak, Average, Strong Topic counts
  const weakCount = allTopics.filter((t) => t.topic.difficulty === 'weak' || (t.topic.recentScore ?? 100) < 60).length;
  const avgCount = allTopics.filter((t) => t.topic.difficulty === 'average' && (t.topic.recentScore ?? 70) >= 60).length;
  const strongCount = allTopics.filter((t) => t.topic.difficulty === 'strong' || (t.topic.recentScore ?? 0) >= 80).length;

  // Average Practice Score
  const avgPracticeScore = practiceScores.length > 0
    ? Math.round(
        practiceScores.reduce((acc, curr) => acc + curr.scorePercentage, 0) / practiceScores.length
      )
    : 0;

  // Subject Progress breakdown
  const subjectBreakdown = exam
    ? exam.subjects.map((s) => {
        const subjSessions = sessions.filter((sess) => sess.subjectName === s.name);
        const subjCompleted = subjSessions.filter((sess) => sess.status === 'completed');
        const subjScores = practiceScores.filter((sc) => sc.subjectName === s.name);
        const avgScore = subjScores.length > 0
          ? Math.round(subjScores.reduce((a, b) => a + b.scorePercentage, 0) / subjScores.length)
          : null;

        const masteryAvg = Math.round(
          s.topics.reduce((acc, t) => acc + t.masteryScore, 0) / (s.topics.length || 1)
        );

        return {
          id: s.id,
          name: s.name,
          color: s.color,
          topicsCount: s.topics.length,
          weakTopicsCount: s.topics.filter((t) => t.difficulty === 'weak').length,
          sessionsCount: subjSessions.length,
          completedCount: subjCompleted.length,
          completionPercent: subjSessions.length > 0 ? Math.round((subjCompleted.length / subjSessions.length) * 100) : 0,
          masteryAvg,
          avgScore,
          topics: s.topics,
        };
      })
    : [];

  const displayedSubjects = selectedSubjectTab === 'all'
    ? subjectBreakdown
    : subjectBreakdown.filter((s) => s.name === selectedSubjectTab);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Academic Progress & Mastery
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Tracking syllabus coverage, topic mastery levels, and practice examination readiness.
          </p>
        </div>

        <button
          onClick={() => onNavigate('practice')}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 self-start sm:self-auto transition-colors w-full sm:w-auto"
        >
          <span>Log Practice Test Score</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Overall Completion */}
        <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-2">
            <span>Overall Plan Completed</span>
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white tabular-nums">
            {completionRate}%
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">
            {completedSessions} of {totalSessions} study sessions
          </p>
        </div>

        {/* Study Hours */}
        <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-2">
            <span>Logged Study Hours</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white tabular-nums">
            {userProfile.totalStudyHours}h
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">
            Across {exam?.subjects.length || 0} active exam subjects
          </p>
        </div>

        {/* Practice Test Average */}
        <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-2">
            <span>Avg Practice Score</span>
            <Target className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white tabular-nums">
            {avgPracticeScore > 0 ? `${avgPracticeScore}%` : 'No tests'}
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">
            {practiceScores.length} mock tests recorded
          </p>
        </div>

        {/* Streak */}
        <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-2">
            <span>Consistency Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white tabular-nums">
            {userProfile.streakDays} Days
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">
            Consecutive study activity
          </p>
        </div>
      </div>

      {/* Weak-Topic Detection & Mastery Distribution Bar */}
      <div className="p-4 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Syllabus Mastery Distribution
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {allTopics.length} total topics across active syllabus
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>{weakCount} Weak</span>
            </span>
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>{avgCount} Average</span>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{strongCount} Strong</span>
            </span>
          </div>
        </div>

        {/* Composite Mastery Visual Bar */}
        <div className="h-3 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden flex">
          <div 
            style={{ width: `${(weakCount / (allTopics.length || 1)) * 100}%` }}
            className="bg-rose-500 h-full"
            title={`${weakCount} Weak Topics`}
          />
          <div 
            style={{ width: `${(avgCount / (allTopics.length || 1)) * 100}%` }}
            className="bg-amber-500 h-full"
            title={`${avgCount} Average Topics`}
          />
          <div 
            style={{ width: `${(strongCount / (allTopics.length || 1)) * 100}%` }}
            className="bg-emerald-500 h-full"
            title={`${strongCount} Strong Topics`}
          />
        </div>

        {weakCount > 0 && (
          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-300 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-neutral-900 dark:text-white">Smart Engine Recommendation:</span>{' '}
              Focus your upcoming 3 days on Weak topics. Our algorithm has prioritized them for spaced review intervals to push your scores toward the 75%+ band.
            </div>
          </div>
        )}
      </div>

      {/* Subject-by-Subject Progress */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            Subject Progress Breakdown
          </h2>

          {/* Subject Tab Filter */}
          <div className="flex flex-wrap gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs">
            <button
              onClick={() => setSelectedSubjectTab('all')}
              className={`px-3 py-1 font-medium rounded-lg transition-colors ${
                selectedSubjectTab === 'all'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              All Subjects
            </button>
            {subjectBreakdown.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSubjectTab(s.name)}
                className={`px-3 py-1 font-medium rounded-lg transition-colors ${
                  selectedSubjectTab === s.name
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {displayedSubjects.length === 0 ? (
          <div className="p-8 sm:p-12 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
            <BookOpen className="w-8 h-8 text-neutral-400 dark:text-neutral-500 mx-auto" />
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              No subjects added to your study plan yet
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
              Create a study plan to track syllabus coverage, topic difficulties, and mastery metrics.
            </p>
            <button
              onClick={() => onNavigate('create-plan')}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
            >
              Create Study Plan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {displayedSubjects.map((subj) => (
            <div
              key={subj.id}
              className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs space-y-4 sm:space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: subj.color }} />
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white truncate">
                    {subj.name}
                  </h3>
                </div>
                <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400 shrink-0">
                  {subj.completedCount} / {subj.sessionsCount} sessions
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                  <span>Completion Rate</span>
                  <span className="font-mono tabular-nums font-semibold text-neutral-900 dark:text-white">
                    {subj.completionPercent}%
                  </span>
                </div>
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${subj.completionPercent}%`, backgroundColor: subj.color }}
                  />
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                <div>
                  <span className="text-neutral-400 dark:text-neutral-500 block">Topic Mastery Avg</span>
                  <span className="font-bold font-mono text-neutral-900 dark:text-white text-sm tabular-nums">
                    {subj.masteryAvg}%
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 dark:text-neutral-500 block">Mock Test Avg</span>
                  <span className="font-bold font-mono text-neutral-900 dark:text-white text-sm tabular-nums">
                    {subj.avgScore !== null ? `${subj.avgScore}%` : 'Not tested yet'}
                  </span>
                </div>
              </div>

              {/* Topics List under this subject */}
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block">
                  Topics Status ({subj.topics.length}):
                </span>
                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                  {subj.topics.map((t, idx) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 text-xs"
                    >
                      <div className="flex items-center gap-1.5 truncate pr-2">
                        {typeof t.sequenceOrder === 'number' && (
                          <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-500 shrink-0">
                            {t.sequenceOrder}.
                          </span>
                        )}
                        <span className="truncate text-neutral-800 dark:text-neutral-200 font-medium">
                          {t.name}
                        </span>
                      </div>
                      <span className={`text-[11px] font-mono shrink-0 font-medium ${
                        t.difficulty === 'weak' ? 'text-rose-500' : t.difficulty === 'average' ? 'text-amber-500' : 'text-emerald-500'
                      }`}>
                        {t.difficulty.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
};
