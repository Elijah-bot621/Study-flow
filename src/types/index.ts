export type ExamType = 'JAMB' | 'WAEC' | 'NECO' | 'POST_UTME' | 'UNIVERSITY' | 'CUSTOM';

export type TopicDifficulty = 'weak' | 'average' | 'strong';

export type SessionType = 'learn' | 'practice' | 'revision' | 'test';

export type SessionStatus = 'scheduled' | 'completed' | 'skipped' | 'rescheduled';

export type StudyPeriod = 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'night';

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  difficulty: TopicDifficulty;
  masteryScore: number; // 0 - 100
  revisionIntervalDays: number;
  lastReviewed?: string | null;
  totalSessionsCompleted: number;
  recentScore?: number | null;
  sequenceOrder?: number; // Optional 1-based order within subject
}

export interface Subject {
  id: string;
  examId: string;
  name: string;
  color: string;
  iconName?: string;
  topics: Topic[];
  hasCustomSequence?: boolean; // True when student chose custom topic ordering
}

export interface Exam {
  id: string;
  title: string;
  examType: ExamType;
  examDate: string; // YYYY-MM-DD
  dailyStudyHours: number;
  preferredPeriods: StudyPeriod[];
  subjects: Subject[];
  createdAt: string;
  isActive: boolean;
}

export interface StudySession {
  id: string;
  examId: string;
  subjectId: string;
  topicId: string;
  subjectName: string;
  topicName: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "07:00 - 08:00"
  preferredPeriod: StudyPeriod;
  durationMinutes: number;
  sessionType: SessionType;
  difficulty: TopicDifficulty;
  status: SessionStatus;
  completedAt?: string;
  notes?: string;
  isPriorityBoosted?: boolean;
  topicSequenceOrder?: number;
}

export interface PracticeScore {
  id: string;
  examId: string;
  subjectId: string;
  topicId: string;
  subjectName: string;
  topicName: string;
  scorePercentage: number;
  totalQuestions: number;
  correctAnswers: number;
  date: string; // YYYY-MM-DD
  notes?: string;
  impactActionTaken?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'upcoming' | 'missed' | 'countdown' | 'revision' | 'goal';
  timestamp: string;
  read: boolean;
  actionLabel?: string;
  actionType?: 'reschedule' | 'review' | 'timetable';
}

export interface UserNotificationSettings {
  sessionReminders: boolean;
  dailyGoals: boolean;
  missedAlerts: boolean;
  examCountdown: boolean;
  soundEnabled: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  school: string;
  targetExam: string;
  targetScore: string;
  tier: 'free' | 'premium';
  streakDays: number;
  totalStudyHours: number;
  lastStudyDate: string;
  avatarUrl: string;
  notificationSettings: UserNotificationSettings;
}

export type ActivePage = 
  | 'dashboard' 
  | 'create-plan' 
  | 'timetable' 
  | 'progress' 
  | 'practice' 
  | 'pricing' 
  | 'profile';
