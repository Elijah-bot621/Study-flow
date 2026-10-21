/**
 * StudyFlow Validation Service
 * Provides consistent, user-friendly validation across all data entry forms.
 */

import { Subject, Topic } from '../types';
import { getTodayLocalDateString, toLocalDateString, parseLocalDate } from './dateUtils';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

function getTodayIso(): string {
  return getTodayLocalDateString();
}

/**
 * Validates a subject name
 */
export function validateSubjectName(
  rawName: string,
  existingSubjects: Subject[] = [],
  currentSubjectId?: string
): ValidationResult {
  const trimmed = rawName.trim();

  if (!trimmed) {
    return { valid: false, error: 'Subject name cannot be empty or just spaces.' };
  }

  if (trimmed.length < 2) {
    return { valid: false, error: 'Subject name must have at least 2 characters.' };
  }

  if (trimmed.length > 60) {
    return { valid: false, error: 'Subject name cannot exceed 60 characters.' };
  }

  // Check for duplicate subject (case-insensitive)
  const isDuplicate = existingSubjects.some(
    (s) => s.id !== currentSubjectId && s.name.trim().toLowerCase() === trimmed.toLowerCase()
  );

  if (isDuplicate) {
    return { valid: false, error: `"${trimmed}" is already added to your study plan.` };
  }

  return { valid: true };
}

/**
 * Validates a topic name within a subject
 */
export function validateTopicName(
  rawName: string,
  existingTopics: Topic[] = [],
  currentTopicId?: string
): ValidationResult {
  const trimmed = rawName.trim();

  if (!trimmed) {
    return { valid: false, error: 'Topic name cannot be empty or just spaces.' };
  }

  if (trimmed.length < 2) {
    return { valid: false, error: 'Topic name must have at least 2 characters.' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Topic name cannot exceed 100 characters.' };
  }

  // Check for duplicate topic within the same subject (case-insensitive)
  const isDuplicate = existingTopics.some(
    (t) => t.id !== currentTopicId && t.name.trim().toLowerCase() === trimmed.toLowerCase()
  );

  if (isDuplicate) {
    return { valid: false, error: `Topic "${trimmed}" already exists in this subject.` };
  }

  return { valid: true };
}

/**
 * Validates an examination date
 */
export function validateExamDate(dateStr: string): ValidationResult {
  if (!dateStr || !dateStr.trim()) {
    return { valid: false, error: 'Please choose an examination date.' };
  }

  const parsed = parseLocalDate(dateStr);
  if (isNaN(parsed.getTime())) {
    return { valid: false, error: 'Please select a valid calendar date.' };
  }

  const today = getTodayIso();
  if (dateStr < today) {
    return {
      valid: false,
      error: 'Exam date cannot be in the past. Please choose today or a future date.',
    };
  }

  // Prevent dates excessively far in the future (> 2 years)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 2);
  const maxDateIso = toLocalDateString(maxDate);

  if (dateStr > maxDateIso) {
    return {
      valid: false,
      error: 'Exam date is too far in the future. Please choose a date within 2 years.',
    };
  }

  return { valid: true };
}

/**
 * Validates daily study hours
 */
export function validateDailyStudyHours(hours: number): ValidationResult {
  if (isNaN(hours) || hours === null || hours === undefined) {
    return { valid: false, error: 'Please enter a valid number of daily hours.' };
  }

  if (hours < 0.5) {
    return { valid: false, error: 'Daily study time must be at least 30 minutes (0.5 hours).' };
  }

  if (hours > 12) {
    return { valid: false, error: 'Daily study time cannot exceed 12 hours to prevent burnout.' };
  }

  return { valid: true };
}

/**
 * Validates exam title
 */
export function validateExamTitle(rawTitle: string): ValidationResult {
  const trimmed = rawTitle.trim();
  if (!trimmed) {
    return { valid: false, error: 'Exam title cannot be empty or just spaces.' };
  }
  if (trimmed.length < 2) {
    return { valid: false, error: 'Exam title must have at least 2 characters.' };
  }
  if (trimmed.length > 80) {
    return { valid: false, error: 'Exam title cannot exceed 80 characters.' };
  }
  return { valid: true };
}

/**
 * Validates study periods selection
 */
export function validateStudyPeriods(periods: string[]): ValidationResult {
  if (!periods || periods.length === 0) {
    return { valid: false, error: 'Please select at least one preferred study period.' };
  }
  return { valid: true };
}

/**
 * Validates practice test questions and correct score
 */
export function validatePracticeScoreInputs(
  totalQuestions: number,
  correctAnswers: number
): ValidationResult {
  if (isNaN(totalQuestions) || totalQuestions < 1) {
    return { valid: false, error: 'Total questions must be at least 1.' };
  }

  if (totalQuestions > 200) {
    return { valid: false, error: 'Total questions cannot exceed 200 per test.' };
  }

  if (isNaN(correctAnswers) || correctAnswers < 0) {
    return { valid: false, error: 'Correct answers cannot be negative.' };
  }

  if (correctAnswers > totalQuestions) {
    return {
      valid: false,
      error: `Correct answers (${correctAnswers}) cannot exceed total questions (${totalQuestions}).`,
    };
  }

  return { valid: true };
}

/**
 * Validates student profile fields
 */
export function validateStudentProfile(
  name: string,
  school: string,
  targetExam: string,
  targetScore: string
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const trimmedName = name.trim();
  if (!trimmedName) {
    errors.name = 'Please enter your name.';
  } else if (trimmedName.length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  } else if (trimmedName.length > 60) {
    errors.name = 'Name cannot exceed 60 characters.';
  }

  const trimmedSchool = school.trim();
  if (trimmedSchool && trimmedSchool.length > 80) {
    errors.school = 'School name cannot exceed 80 characters.';
  }

  const trimmedExam = targetExam.trim();
  if (!trimmedExam) {
    errors.targetExam = 'Please specify your target exam (e.g. JAMB, WAEC).';
  } else if (trimmedExam.length > 60) {
    errors.targetExam = 'Exam title cannot exceed 60 characters.';
  }

  const trimmedScore = targetScore.trim();
  if (trimmedScore && trimmedScore.length > 40) {
    errors.targetScore = 'Target score cannot exceed 40 characters.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates reschedule slot
 */
export function validateRescheduleSlot(dateStr: string, timeSlot: string): ValidationResult {
  const dateResult = validateExamDate(dateStr);
  if (!dateResult.valid) {
    return dateResult;
  }

  if (!timeSlot || !timeSlot.trim()) {
    return { valid: false, error: 'Please select a valid study time slot.' };
  }

  return { valid: true };
}
