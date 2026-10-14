import React from 'react';
import { 
  Exam, 
  StudySession, 
  UserProfile, 
  ActivePage,
  Topic 
} from '../types';
import { 
  Calendar, 
  Flame, 
  Clock, 
  CheckCircle, 
  Play, 
  AlertTriangle, 
  RefreshCw, 
  ArrowRight, 
  BookOpen, 
  TrendingDown,
  ListOrdered,
  Sparkles
} from 'lucide-react';

interface DashboardProps {
  exam: Exam | null;
  sessions: StudySession[];
  userProfile: UserProfile;
  onNavigate: (page: ActivePage) => void;
  onStartFocusSession: (session: StudySession) => void;
  onToggleSessionStatus: (sessionId: string, currentStatus: StudySession['status']) => void;
  onAutoRedistribute: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  exam,
  sessions,
  userProfile,
  onNavigate,
  onStartFocusSession,
  onToggleSessionStatus,
  onAutoRedistribute,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Filter today's tasks
  const todayTasks = sessions.filter((s) => s.date === todayStr);
  const completedToday = todayTasks.filter((s) => s.status === 'completed');
  const todayProgressPercent = todayTasks.length > 0 
    ? Math.round((completedToday.length / todayTasks.length) * 100) 
    : 0;

  // Check for missed sessions in past days
  const missedSessions = sessions.filter(
    (s) => (s.status === 'scheduled' && s.date < todayStr) || s.status === 'skipped'
  );

  // Recently completed tasks (across all days)
  const recentlyCompleted = sessions
    .filter((s) => s.status === 'completed')
    .slice(-4)
    .reverse();

  // Find weakest topics from the exam subjects
  const allTopics: { subjectName: string; topic: Topic }[] = [];
  if (exam) {
    exam.subjects.forEach((subj) => {
      subj.topics.forEach((top) => {
        allTopics.push({ subjectName: subj.name, topic: top });
      });
    });
  }

  const weakTopics = allTopics
    .filter((t) => t.topic.difficulty === 'weak' || (t.topic.recentScore ?? 100) < 60)
    .slice(0, 4);

  // Days remaining calculation
  let daysRemaining = 0;
  if (exam) {
    const d1 = new Date(todayStr + 'T00:00:00').getTime();
    const d2 = new Date(exam.examDate + 'T00:00:00').getTime();
    daysRemaining = Math.max(0, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Top Banner / Student Greeting & Countdown */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {userProfile.name ? `Welcome back, ${userProfile.name.split(' ')[0]}` : 'Welcome to StudyFlow'}
          </h1>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              {exam ? exam.title : 'No active study timetable'}
            </span>
            {userProfile.targetScore && (
              <>
                <span aria-hidden="true">·</span>
                <span>Target: {userProfile.targetScore}</span>
              </>
            )}
            {userProfile.school && (
              <>
                <span aria-hidden="true">·</span>
                <span>{userProfile.school}</span>
              </>
            )}
          </div>
        </div>

        {exam && (
          <div className="flex items-center gap-3 bg-white dark:bg-neutral-900 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-neutral-400 dark:text-neutral-500">Exam Countdown</div>
              <div className="text-base sm:text-lg font-bold font-mono tracking-tight text-neutral-900 dark:text-white tabular-nums">
                {daysRemaining} Days Left
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Helpful Onboarding Empty State when user has no study timetable yet */}
      {(!exam || sessions.length === 0) && (
        <div className="p-6 sm:p-8 rounded-3xl border border-emerald-200/60 dark:border-emerald-900/60 bg-linear-to-b from-white to-emerald-50/20 dark:from-neutral-900 dark:to-emerald-950/20 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200/80 dark:border-neutral-800">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ready to Start</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
                Create Your First Study Timetable
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-xl leading-relaxed">
                You haven't created a study timetable yet. Build your personalized schedule in 3 simple steps:
              </p>
            </div>

            <button
              onClick={() => onNavigate('create-plan')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <span>Create Study Plan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                1
              </div>
              <h3 className="font-bold text-neutral-900 dark:text-white text-sm">
                Set Your Exam & Target
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-[11px]">
                Define your examination name, future exam date, daily hours commitment, and preferred times of day.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                2
              </div>
              <h3 className="font-bold text-neutral-900 dark:text-white text-sm">
                Add Subjects & Topics
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-[11px]">
                Select popular subjects or create custom ones, customize topic lists, and optionally set sequence order.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                3
              </div>
              <h3 className="font-bold text-neutral-900 dark:text-white text-sm">
                Generate Smart Timetable
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-[11px]">
                StudyFlow's engine calculates optimal spaced repetition sessions and balances your daily study workload.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Missed Sessions Auto-Redistribute Alert Banner */}
      {missedSessions.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                {missedSessions.length} Uncompleted Study Session{missedSessions.length > 1 ? 's' : ''} Detected
              </h2>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5 leading-relaxed">
                Missed some sessions? StudyFlow's Smart Engine can automatically redistribute them across your upcoming open slots without cramming.
              </p>
            </div>
          </div>
          <button
            onClick={onAutoRedistribute}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors shrink-0 w-full sm:w-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Auto-Redistribute Now</span>
          </button>
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Tasks Progress */}
        <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-2">
            <span>Today's Progress</span>
            <span className="font-mono tabular-nums">{todayProgressPercent}%</span>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white tabular-nums">
            {completedToday.length} / {todayTasks.length}
          </div>
          <div className="mt-3 w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${todayProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Study Streak */}
        <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-2">
            <span>Study Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white tabular-nums">
            {userProfile.streakDays} Days
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">
            Maintain daily focus to boost retention
          </p>
        </div>

        {/* Total Study Hours */}
        <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-2">
            <span>Total Study Hours</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white tabular-nums">
            {userProfile.totalStudyHours}h
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">
            Target: ~{exam ? Math.round(exam.dailyStudyHours * daysRemaining) : 120}h before exam
          </p>
        </div>

        {/* Weak Topics Flagged */}
        <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-2">
            <span>Weak Topics Flagged</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white tabular-nums">
            {weakTopics.length} Areas
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">
            Priority multiplier: 2.8x sessions
          </p>
        </div>
      </div>

      {/* Main Content Grid: Today's Tasks & Weak Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Left Column (8 cols): Today's Study Tasks */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                Today's Study Sessions
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <button
              onClick={() => onNavigate('timetable')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Full Timetable</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {todayTasks.length === 0 ? (
            <div className="p-8 sm:p-10 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
              <BookOpen className="w-8 h-8 text-neutral-400 dark:text-neutral-500 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  {exam ? 'No sessions scheduled for today' : 'No study sessions scheduled yet'}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                  {exam 
                    ? 'Take a rest or review upcoming days in your full timetable.' 
                    : 'Create your study plan above to generate your daily timetable sessions.'}
                </p>
              </div>
              <button
                onClick={() => onNavigate(exam ? 'timetable' : 'create-plan')}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
              >
                {exam ? 'View Full Timetable' : 'Create Study Plan'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTasks.map((session) => (
                <div
                  key={session.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    session.status === 'completed'
                      ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/20'
                      : session.status === 'skipped'
                      ? 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40 opacity-60'
                      : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Session Details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                        <span className="font-semibold text-neutral-900 dark:text-white">
                          {session.subjectName}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-neutral-700 dark:text-neutral-300 tabular-nums">
                          {session.timeSlot}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{session.sessionType}</span>
                        {session.topicSequenceOrder && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] flex items-center gap-0.5">
                              <ListOrdered className="w-3 h-3" />
                              <span>Seq #{session.topicSequenceOrder}</span>
                            </span>
                          </>
                        )}
                        {session.isPriorityBoosted && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-amber-600 dark:text-amber-400 font-medium">Priority</span>
                          </>
                        )}
                      </div>

                      <h3 className={`text-sm sm:text-base font-semibold truncate sm:whitespace-normal ${
                        session.status === 'completed'
                          ? 'line-through text-neutral-400 dark:text-neutral-500'
                          : 'text-neutral-900 dark:text-white'
                      }`}>
                        {session.topicName}
                      </h3>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-400 dark:text-neutral-500">
                        <span>{session.durationMinutes} mins</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">Difficulty: {session.difficulty}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
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
                        onClick={() => onToggleSessionStatus(session.id, session.status)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                          session.status === 'completed'
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{session.status === 'completed' ? 'Completed' : 'Mark Done'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Weak Topics & History */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Weak Topics Spotlight */}
          <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                Weak Topics Requiring Attention
              </h2>
              <button
                onClick={() => onNavigate('practice')}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                Log Test
              </button>
            </div>

            {weakTopics.length === 0 ? (
              <p className="text-xs text-neutral-400 dark:text-neutral-500 py-4 text-center">
                No weak topics flagged yet. Log practice test scores to detect areas for improvement.
              </p>
            ) : (
              <div className="space-y-3">
                {weakTopics.map(({ subjectName, topic }) => (
                  <div
                    key={topic.id}
                    className="p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                      <span>{subjectName}</span>
                      <span className="font-mono text-rose-500 font-medium">
                        {topic.recentScore ? `${topic.recentScore}% Recent` : 'Rated Weak'}
                      </span>
                    </div>
                    <div className="font-semibold text-neutral-900 dark:text-white">
                      {topic.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recently Completed Sessions */}
          <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white pb-3 border-b border-neutral-100 dark:border-neutral-800">
              Recently Completed
            </h2>
            {recentlyCompleted.length === 0 ? (
              <p className="text-xs text-neutral-400 dark:text-neutral-500 py-4 text-center">
                No study sessions logged as completed yet today.
              </p>
            ) : (
              <div className="space-y-2.5">
                {recentlyCompleted.map((s) => (
                  <div key={s.id} className="flex items-start gap-2.5 text-xs">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {s.topicName}
                      </div>
                      <div className="text-[11px] text-neutral-400 dark:text-neutral-500">
                        {s.subjectName} · {s.durationMinutes}m · {s.date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
