import { 
  UserProfile, 
  Exam, 
  StudySession, 
  PracticeScore, 
  NotificationItem 
} from '../types';

const STORAGE_KEYS = {
  USER_PROFILE: 'studyflow_user_profile',
  EXAMS: 'studyflow_exams',
  SESSIONS: 'studyflow_study_sessions',
  SCORES: 'studyflow_practice_scores',
  NOTIFICATIONS: 'studyflow_notifications',
  APP_THEME: 'studyflow_theme',
  SETUP_COMPLETED: 'studyflow_setup_completed',
};

/**
 * In-memory fallback cache in case localStorage is disabled or quota exceeded
 */
const inMemoryCache: Record<string, string> = {};
const errorListeners: Array<(err: string) => void> = [];

function notifyStorageError(message: string) {
  errorListeners.forEach((listener) => {
    try {
      listener(message);
    } catch (e) {
      console.error('Error listener threw:', e);
    }
  });
}

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = window.localStorage.getItem(key);
      if (val !== null) return val;
    }
  } catch {
    // fallback to in-memory
  }
  return inMemoryCache[key] ?? null;
}

function safeSetItem(key: string, value: string): boolean {
  try {
    inMemoryCache[key] = value;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return true;
    }
  } catch (err) {
    console.warn(`[StudyFlow Storage] Failed to write key "${key}" to localStorage:`, err);
    notifyStorageError('Device storage appears full or restricted. Your study data is temporarily kept in session memory.');
    return false;
  }
  return true;
}

/**
 * Creates clean default student profile without pre-populated fictional data
 */
export function createDefaultUserProfile(): UserProfile {
  return {
    id: 'student_user_primary',
    name: '',
    school: '',
    targetExam: '',
    targetScore: '',
    tier: 'free',
    streakDays: 0,
    totalStudyHours: 0,
    lastStudyDate: '',
    avatarUrl: '/src/assets/images/avatar_student_user_1790893100314.jpg',
    notificationSettings: {
      sessionReminders: true,
      dailyGoals: true,
      missedAlerts: true,
      examCountdown: true,
      soundEnabled: true,
    },
  };
}

class StorageService {
  private lastError: string | null = null;

  private ensureInitialized() {
    if (safeGetItem(STORAGE_KEYS.EXAMS) === null) {
      safeSetItem(STORAGE_KEYS.EXAMS, JSON.stringify([]));
    }
    if (safeGetItem(STORAGE_KEYS.SESSIONS) === null) {
      safeSetItem(STORAGE_KEYS.SESSIONS, JSON.stringify([]));
    }
    if (safeGetItem(STORAGE_KEYS.SCORES) === null) {
      safeSetItem(STORAGE_KEYS.SCORES, JSON.stringify([]));
    }
    if (safeGetItem(STORAGE_KEYS.NOTIFICATIONS) === null) {
      safeSetItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    }
    if (safeGetItem(STORAGE_KEYS.USER_PROFILE) === null) {
      safeSetItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(createDefaultUserProfile()));
    }
  }

  getLastError(): string | null {
    return this.lastError;
  }

  clearLastError(): void {
    this.lastError = null;
  }

  onError(listener: (err: string) => void): () => void {
    errorListeners.push(listener);
    return () => {
      const idx = errorListeners.indexOf(listener);
      if (idx >= 0) errorListeners.splice(idx, 1);
    };
  }

  isSetupCompleted(): boolean {
    const val = safeGetItem(STORAGE_KEYS.SETUP_COMPLETED);
    return val === 'true';
  }

  setSetupCompleted(completed: boolean): void {
    safeSetItem(STORAGE_KEYS.SETUP_COMPLETED, completed ? 'true' : 'false');
  }

  getUserProfile(): UserProfile {
    this.ensureInitialized();
    try {
      const data = safeGetItem(STORAGE_KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : createDefaultUserProfile();
    } catch {
      return createDefaultUserProfile();
    }
  }

  saveUserProfile(profile: UserProfile): boolean {
    const success = safeSetItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    if (!success) {
      this.lastError = 'Unable to save profile changes to persistent storage.';
    }
    return success;
  }

  getExams(): Exam[] {
    this.ensureInitialized();
    try {
      const data = safeGetItem(STORAGE_KEYS.EXAMS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  getActiveExam(): Exam | null {
    const exams = this.getExams();
    return exams.find((e) => e.isActive) || exams[0] || null;
  }

  saveExam(exam: Exam): boolean {
    const exams = this.getExams();
    const existingIndex = exams.findIndex((e) => e.id === exam.id);
    if (existingIndex >= 0) {
      exams[existingIndex] = exam;
    } else {
      // If setting this exam as active, deactivate other exams
      if (exam.isActive) {
        exams.forEach((e) => (e.isActive = false));
      }
      exams.push(exam);
    }
    const success = safeSetItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
    if (!success) {
      this.lastError = 'Unable to save examination plan to persistent storage.';
    }
    return success;
  }

  getStudySessions(examId?: string): StudySession[] {
    this.ensureInitialized();
    try {
      const data = safeGetItem(STORAGE_KEYS.SESSIONS);
      const all: StudySession[] = data ? JSON.parse(data) : [];
      if (examId) {
        return all.filter((s) => s.examId === examId);
      }
      return all;
    } catch {
      return [];
    }
  }

  saveStudySessions(sessions: StudySession[]): boolean {
    const success = safeSetItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    if (!success) {
      this.lastError = 'Unable to save timetable sessions to persistent storage.';
    }
    return success;
  }

  updateStudySession(sessionId: string, updates: Partial<StudySession>): StudySession[] {
    const all = this.getStudySessions();
    const idx = all.findIndex((s) => s.id === sessionId);
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...updates };
      this.saveStudySessions(all);
    }
    return all;
  }

  getPracticeScores(examId?: string): PracticeScore[] {
    this.ensureInitialized();
    try {
      const data = safeGetItem(STORAGE_KEYS.SCORES);
      const all: PracticeScore[] = data ? JSON.parse(data) : [];
      if (examId) {
        return all.filter((s) => s.examId === examId);
      }
      return all;
    } catch {
      return [];
    }
  }

  savePracticeScore(score: PracticeScore): PracticeScore[] {
    const all = this.getPracticeScores();
    all.unshift(score);
    safeSetItem(STORAGE_KEYS.SCORES, JSON.stringify(all));
    return all;
  }

  getNotifications(): NotificationItem[] {
    this.ensureInitialized();
    try {
      const data = safeGetItem(STORAGE_KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveNotifications(notifications: NotificationItem[]): boolean {
    return safeSetItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }

  markNotificationAsRead(id: string): NotificationItem[] {
    const notifs = this.getNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
    this.saveNotifications(notifs);
    return notifs;
  }

  addNotification(item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>): NotificationItem[] {
    const notifs = this.getNotifications();
    const newItem: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    notifs.unshift(newItem);
    this.saveNotifications(notifs);
    return notifs;
  }

  /**
   * Resets entire application data back to initial fresh state.
   * Clears all subjects, topics, schedules, sessions, scores, notifications, and profile.
   * Preserves theme preference.
   */
  resetApp(): void {
    safeSetItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(createDefaultUserProfile()));
    safeSetItem(STORAGE_KEYS.EXAMS, JSON.stringify([]));
    safeSetItem(STORAGE_KEYS.SESSIONS, JSON.stringify([]));
    safeSetItem(STORAGE_KEYS.SCORES, JSON.stringify([]));
    safeSetItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    safeSetItem(STORAGE_KEYS.SETUP_COMPLETED, 'false');
  }

  /**
   * Alias for backward compatibility
   */
  resetToDemoDatabase(): void {
    this.resetApp();
  }
}

export const storage = new StorageService();
