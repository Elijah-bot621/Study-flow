/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ActivePage, 
  UserProfile, 
  Exam, 
  StudySession, 
  PracticeScore, 
  NotificationItem, 
  SessionStatus,
  TopicDifficulty 
} from './types';
import { storage } from './services/storage';
import { 
  generateStudyTimetable, 
  redistributeMissedSessions, 
  applyPracticeScoreImpact 
} from './services/studyEngine';

import { SplashScreen } from './components/SplashScreen';
import { WelcomeSetup } from './components/WelcomeSetup';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { CreateStudyPlan } from './components/CreateStudyPlan';
import { StudyTimetable } from './components/StudyTimetable';
import { ProgressPage } from './components/ProgressPage';
import { PracticeScoreTracker } from './components/PracticeScoreTracker';
import { FocusTimerModal } from './components/FocusTimerModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { StudentProfileModal } from './components/StudentProfileModal';
import { PricingModal } from './components/PricingModal';
import { useTheme } from './context/ThemeContext';

export default function App() {
  // Startup Flow: Splash Screen (approx 2s) -> Welcome/Setup (for new user) -> Dashboard
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [isSetupDone, setIsSetupDone] = useState<boolean>(() => storage.isSetupCompleted());
  const [storageErrorBanner, setStorageErrorBanner] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');

  useEffect(() => {
    const unsubscribe = storage.onError((errMsg) => {
      setStorageErrorBanner(errMsg);
    });
    return unsubscribe;
  }, []);
  
  // Local Student Data
  const [userProfile, setUserProfile] = useState<UserProfile>(() => storage.getUserProfile());
  const [activeExam, setActiveExam] = useState<Exam | null>(() => storage.getActiveExam());
  const [sessions, setSessions] = useState<StudySession[]>(() => storage.getStudySessions());
  const [practiceScores, setPracticeScores] = useState<PracticeScore[]>(() => storage.getPracticeScores());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => storage.getNotifications());

  // Modal States
  const [focusSession, setFocusSession] = useState<StudySession | null>(null);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState<boolean>(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false);

  // Centralized Theme from ThemeContext
  const { isDarkMode, toggleDarkMode } = useTheme();

  // Sync state helpers
  const handleUpdateProfile = (updated: UserProfile) => {
    setUserProfile(updated);
    storage.saveUserProfile(updated);
  };

  const handleUpdateTier = (tier: 'free' | 'premium') => {
    const updated: UserProfile = { ...userProfile, tier };
    handleUpdateProfile(updated);
    storage.addNotification({
      title: tier === 'premium' ? 'Upgraded to StudyFlow Premium' : 'Switched to Starter Plan',
      message: tier === 'premium' 
        ? 'Unlocked multiple exams, spaced repetition auto-scheduler, and advanced analytics.'
        : 'Active plan updated.',
      type: 'goal',
    });
    setNotifications(storage.getNotifications());
  };

  // Toggle session status
  const handleToggleSessionStatus = (sessionId: string, currentStatus: SessionStatus) => {
    const newStatus: SessionStatus = currentStatus === 'completed' ? 'scheduled' : 'completed';
    const updatedList = storage.updateStudySession(sessionId, {
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
    });
    setSessions([...updatedList]);

    // If marked completed, update user stats
    if (newStatus === 'completed') {
      const targetSession = sessions.find((s) => s.id === sessionId);
      const hoursLogged = targetSession ? targetSession.durationMinutes / 60 : 1;
      const updatedProfile: UserProfile = {
        ...userProfile,
        totalStudyHours: Math.round((userProfile.totalStudyHours + hoursLogged) * 10) / 10,
        lastStudyDate: new Date().toISOString().split('T')[0],
      };
      handleUpdateProfile(updatedProfile);

      if (targetSession) {
        storage.addNotification({
          title: 'Study Session Completed',
          message: `Logged ${hoursLogged}h study time for ${targetSession.subjectName}: ${targetSession.topicName}.`,
          type: 'upcoming',
        });
        setNotifications(storage.getNotifications());
      }
    }
  };

  // Reschedule session
  const handleRescheduleSession = (sessionId: string, newDate: string, newTimeSlot: string) => {
    const updatedList = storage.updateStudySession(sessionId, {
      date: newDate,
      timeSlot: newTimeSlot,
      status: 'rescheduled',
    });
    setSessions([...updatedList]);
    storage.addNotification({
      title: 'Session Rescheduled',
      message: `Study session moved to ${newDate} (${newTimeSlot}).`,
      type: 'upcoming',
    });
    setNotifications(storage.getNotifications());
  };

  // Focus timer actions
  const handleStartFocusSession = (session: StudySession) => {
    setFocusSession(session);
    setIsFocusModalOpen(true);
  };

  const handleCompleteFromTimer = (sessionId: string, notes?: string) => {
    handleToggleSessionStatus(sessionId, 'scheduled');
    if (notes) {
      storage.updateStudySession(sessionId, { notes });
    }
  };

  // Auto-redistribute missed sessions
  const handleAutoRedistribute = () => {
    if (!activeExam) return;
    const { updatedSessions, countRedistributed } = redistributeMissedSessions(
      sessions,
      activeExam
    );
    setSessions(updatedSessions);
    storage.saveStudySessions(updatedSessions);

    storage.addNotification({
      title: 'Timetable Auto-Rebalanced',
      message: `Successfully reallocated ${countRedistributed} missed sessions across upcoming open study periods.`,
      type: 'revision',
      actionLabel: 'View Timetable',
      actionType: 'timetable',
    });
    setNotifications(storage.getNotifications());
  };

  // Log Practice Score
  const handleLogPracticeScore = (scoreData: {
    subjectId: string;
    topicId: string;
    subjectName: string;
    topicName: string;
    scorePercentage: number;
    totalQuestions: number;
    correctAnswers: number;
    notes?: string;
  }) => {
    if (!activeExam) return;

    const newScore: PracticeScore = {
      id: `score-${Date.now()}`,
      examId: activeExam.id,
      subjectId: scoreData.subjectId,
      topicId: scoreData.topicId,
      subjectName: scoreData.subjectName,
      topicName: scoreData.topicName,
      scorePercentage: scoreData.scorePercentage,
      totalQuestions: scoreData.totalQuestions,
      correctAnswers: scoreData.correctAnswers,
      date: new Date().toISOString().split('T')[0],
      notes: scoreData.notes,
    };

    // Apply Smart Engine impact
    const { updatedSessions, impactMessage } = applyPracticeScoreImpact(
      sessions,
      newScore,
      activeExam
    );

    newScore.impactActionTaken = impactMessage;

    // Save score
    const updatedScores = storage.savePracticeScore(newScore);
    setPracticeScores([...updatedScores]);

    // Save updated sessions
    setSessions([...updatedSessions]);
    storage.saveStudySessions(updatedSessions);

    // Update topic difficulty in activeExam subjects
    const updatedSubjects = activeExam.subjects.map((s) => {
      if (s.id !== scoreData.subjectId) return s;
      return {
        ...s,
        topics: s.topics.map((t) => {
          if (t.id !== scoreData.topicId) return t;
          const newDiff: TopicDifficulty = scoreData.scorePercentage < 60 ? 'weak' : scoreData.scorePercentage >= 80 ? 'strong' : 'average';
          return {
            ...t,
            difficulty: newDiff,
            masteryScore: scoreData.scorePercentage,
            recentScore: scoreData.scorePercentage,
          };
        }),
      };
    });

    const updatedExam: Exam = { ...activeExam, subjects: updatedSubjects };
    setActiveExam(updatedExam);
    storage.saveExam(updatedExam);

    // Add alert
    storage.addNotification({
      title: scoreData.scorePercentage < 60 ? 'Weak Topic Detected: Timetable Adjusted' : 'Practice Score Logged',
      message: impactMessage,
      type: scoreData.scorePercentage < 60 ? 'revision' : 'goal',
      actionLabel: 'Check Timetable',
      actionType: 'timetable',
    });
    setNotifications(storage.getNotifications());
  };

  // Plan created from wizard
  const handlePlanCreated = (newExam: Exam) => {
    storage.saveExam(newExam);
    setActiveExam(newExam);

    // Generate timetable
    const generated = generateStudyTimetable({ exam: newExam, horizonDays: 45 });
    storage.saveStudySessions(generated);
    setSessions(generated);

    // Update student profile target exam
    const updatedUser = {
      ...userProfile,
      targetExam: newExam.title,
    };
    handleUpdateProfile(updatedUser);

    storage.addNotification({
      title: 'New Study Plan Generated',
      message: `Created balanced timetable for ${newExam.title} with ${newExam.subjects.length} subjects.`,
      type: 'upcoming',
      actionLabel: 'Open Timetable',
      actionType: 'timetable',
    });
    setNotifications(storage.getNotifications());

    setActivePage('timetable');
  };

  // Complete Reset App
  const handleResetApp = () => {
    storage.resetApp();
    setUserProfile(storage.getUserProfile());
    setActiveExam(null);
    setSessions([]);
    setPracticeScores([]);
    setNotifications([]);
    setIsSetupDone(false);
    setShowSplash(true);
    setActivePage('dashboard');
    setIsProfileModalOpen(false);
  };

  const handleCompleteWelcomeSetup = (updated: UserProfile) => {
    handleUpdateProfile(updated);
    storage.setSetupCompleted(true);
    setIsSetupDone(true);
    setActivePage('dashboard');
  };

  const handleSkipWelcomeSetup = () => {
    storage.setSetupCompleted(true);
    setIsSetupDone(true);
    setActivePage('dashboard');
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col transition-colors selection:bg-emerald-500/20">
      {/* Dedicated Splash Screen (Smooth 2-second automatic transition) */}
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}

      {/* For brand-new users, show clean welcome/setup before dashboard */}
      {!showSplash && !isSetupDone ? (
        <WelcomeSetup
          initialProfile={userProfile}
          onComplete={handleCompleteWelcomeSetup}
          onSkip={handleSkipWelcomeSetup}
        />
      ) : (
        <>
          {/* Storage Warning Banner */}
          {storageErrorBanner && (
            <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-700 dark:text-amber-300 px-4 py-2.5 text-xs flex items-center justify-between">
              <span>{storageErrorBanner}</span>
              <button
                onClick={() => setStorageErrorBanner(null)}
                className="font-bold underline ml-3 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Top Navbar adhering to Top Bar Contract */}
          <Navbar
            activePage={activePage}
            onNavigate={(page) => setActivePage(page)}
            userProfile={userProfile}
            notifications={notifications}
            onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onOpenPricing={() => setIsPricingModalOpen(true)}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
          />

      {/* Main Pages */}
      <main className="flex-1">
        {activePage === 'dashboard' && (
          <Dashboard
            exam={activeExam}
            sessions={sessions}
            userProfile={userProfile}
            onNavigate={(page) => setActivePage(page)}
            onStartFocusSession={handleStartFocusSession}
            onToggleSessionStatus={(id, status) => handleToggleSessionStatus(id, status)}
            onAutoRedistribute={handleAutoRedistribute}
          />
        )}

        {activePage === 'create-plan' && (
          <CreateStudyPlan
            onPlanCreated={handlePlanCreated}
            onCancel={() => setActivePage('dashboard')}
          />
        )}

        {activePage === 'timetable' && (
          <StudyTimetable
            sessions={sessions}
            exam={activeExam}
            onStartFocusSession={handleStartFocusSession}
            onUpdateSessionStatus={(id, status) => handleToggleSessionStatus(id, status)}
            onRescheduleSession={handleRescheduleSession}
            onAutoRedistribute={handleAutoRedistribute}
          />
        )}

        {activePage === 'progress' && (
          <ProgressPage
            exam={activeExam}
            sessions={sessions}
            practiceScores={practiceScores}
            userProfile={userProfile}
            onNavigate={(page) => setActivePage(page)}
          />
        )}

        {activePage === 'practice' && (
          <PracticeScoreTracker
            exam={activeExam}
            practiceScores={practiceScores}
            onLogScore={handleLogPracticeScore}
            onNavigate={(page) => setActivePage(page)}
          />
        )}

        {activePage === 'pricing' && (
          <div className="py-8">
            <div className="max-w-4xl mx-auto px-4">
              <button
                onClick={() => setActivePage('dashboard')}
                className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white mb-4 block"
              >
                &larr; Back to Dashboard
              </button>
            </div>
            {/* Embedded Pricing view */}
            <PricingModal
              isOpen={true}
              onClose={() => setActivePage('dashboard')}
              userProfile={userProfile}
              onUpdateTier={handleUpdateTier}
            />
          </div>
        )}
      </main>

      {/* Focus Timer Modal (Pomodoro / Study Clock) */}
      <FocusTimerModal
        isOpen={isFocusModalOpen}
        session={focusSession}
        onClose={() => {
          setIsFocusModalOpen(false);
          setFocusSession(null);
        }}
        onCompleteSession={handleCompleteFromTimer}
      />

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onMarkAsRead={(id) => {
          const updated = storage.markNotificationAsRead(id);
          setNotifications([...updated]);
        }}
        onAutoRescheduleMissed={handleAutoRedistribute}
        onNavigateToPage={(page) => setActivePage(page)}
      />

      {/* Student Profile Settings & Goals Modal (Local device storage) */}
      <StudentProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userProfile={userProfile}
        onUpdateProfile={handleUpdateProfile}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onResetApp={handleResetApp}
      />

      {/* Pricing Modal */}
      {activePage !== 'pricing' && (
        <PricingModal
          isOpen={isPricingModalOpen}
          onClose={() => setIsPricingModalOpen(false)}
          userProfile={userProfile}
          onUpdateTier={handleUpdateTier}
        />
      )}
        </>
      )}
    </div>
  );
}
