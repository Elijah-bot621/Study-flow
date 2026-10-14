import { 
  Exam, 
  Subject, 
  Topic, 
  StudySession, 
  StudyPeriod, 
  TopicDifficulty, 
  SessionType, 
  PracticeScore 
} from '../types';

interface GenerationParams {
  exam: Exam;
  startDate?: string; // YYYY-MM-DD (defaults to today)
  horizonDays?: number; // how many days ahead to schedule (e.g. up to exam date or 30 days)
}

const PERIOD_TIME_SLOTS: Record<StudyPeriod, { start: string; end: string }[]> = {
  early_morning: [
    { start: '05:30', end: '06:30' },
    { start: '06:30', end: '07:30' },
  ],
  morning: [
    { start: '09:00', end: '10:00' },
    { start: '10:30', end: '11:30' },
    { start: '11:30', end: '12:30' },
  ],
  afternoon: [
    { start: '14:00', end: '15:00' },
    { start: '15:15', end: '16:15' },
    { start: '16:30', end: '17:30' },
  ],
  evening: [
    { start: '17:30', end: '18:30' },
    { start: '18:45', end: '19:45' },
  ],
  night: [
    { start: '20:30', end: '21:30' },
    { start: '21:45', end: '22:45' },
  ],
};

function formatIsoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return formatIsoDate(d);
}

function getDaysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1 + 'T00:00:00').getTime();
  const d2 = new Date(date2 + 'T00:00:00').getTime();
  const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 1);
}

/**
 * Smart Study Engine Scheduler
 * Generates an adaptive, balanced timetable based on topics, difficulty weights,
 * spaced repetition intervals, and user study slots.
 */
export function generateStudyTimetable(params: GenerationParams): StudySession[] {
  const { exam, startDate = formatIsoDate(new Date()) } = params;
  const sessions: StudySession[] = [];

  const daysToExam = getDaysBetween(startDate, exam.examDate);
  // Schedule either to exam date or a sensible planning window (min 14, max 60 days)
  const totalDaysToSchedule = Math.min(Math.max(daysToExam, 7), 60);

  // Check which subjects have custom sequencing vs automatic prioritization
  interface SubjectTopicPlan {
    subject: Subject;
    topics: {
      topic: Topic;
      weight: number;
      sessionsNeeded: number;
      sequenceOrder?: number;
      sessionsScheduled: number;
      lastScheduledDay: number;
    }[];
    hasCustomSequence: boolean;
    currentSequenceIndex: number;
  }

  const subjectPlans: SubjectTopicPlan[] = exam.subjects.map((subject) => {
    // Check if this subject has custom sequence
    const hasCustomSequence = Boolean(
      subject.hasCustomSequence || 
      subject.topics.some((t) => typeof t.sequenceOrder === 'number')
    );

    const topics = subject.topics.map((topic, index) => {
      let weight = 1.0;
      let sessionsNeeded = 2;

      if (topic.difficulty === 'weak') {
        weight = 2.8;
        sessionsNeeded = 5;
      } else if (topic.difficulty === 'average') {
        weight = 1.8;
        sessionsNeeded = 3;
      } else {
        weight = 1.0;
        sessionsNeeded = 2;
      }

      if (topic.recentScore !== undefined && topic.recentScore !== null) {
        if (topic.recentScore < 60) {
          weight *= 1.4;
          sessionsNeeded += 2;
        } else if (topic.recentScore >= 80) {
          weight *= 0.8;
        }
      }

      const seqOrder = typeof topic.sequenceOrder === 'number' 
        ? topic.sequenceOrder 
        : (hasCustomSequence ? index + 1 : undefined);

      return {
        topic,
        weight,
        sessionsNeeded,
        sequenceOrder: seqOrder,
        sessionsScheduled: 0,
        lastScheduledDay: -999,
      };
    });

    if (hasCustomSequence) {
      // Sort strictly by sequenceOrder for introduction
      topics.sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0));
    } else {
      // Sort by weight: weaker topics and higher-priority topics scheduled first
      topics.sort((a, b) => b.weight - a.weight);
    }

    return {
      subject,
      topics,
      hasCustomSequence,
      currentSequenceIndex: 0,
    };
  }).filter((sp) => sp.topics.length > 0);

  if (subjectPlans.length === 0) {
    return [];
  }

  // Calculate maximum sessions per day based on dailyStudyHours (approx 1 hour per session)
  const sessionDuration = 60; // 60 minutes
  const maxSessionsPerDay = Math.max(1, Math.min(Math.round(exam.dailyStudyHours), 6));

  // Determine available time slots each day from preferredPeriods
  const activePeriods: StudyPeriod[] = exam.preferredPeriods.length > 0 
    ? exam.preferredPeriods 
    : (['morning', 'evening'] as StudyPeriod[]);
  const dailySlots: { period: StudyPeriod; start: string; end: string }[] = [];

  activePeriods.forEach((period: StudyPeriod) => {
    const slots = PERIOD_TIME_SLOTS[period] || [];
    slots.forEach((s: { start: string; end: string }) => {
      dailySlots.push({ period, start: s.start, end: s.end });
    });
  });

  let subjectPointer = 0;

  for (let dayOffset = 0; dayOffset < totalDaysToSchedule; dayOffset++) {
    const currentDate = addDays(startDate, dayOffset);
    if (currentDate >= exam.examDate) break;

    const slotsForToday = dailySlots.slice(0, maxSessionsPerDay);

    slotsForToday.forEach((slot, slotIndex) => {
      // Rotate among subjects for balanced variety
      const currentSubjectPlan = subjectPlans[subjectPointer % subjectPlans.length];
      subjectPointer++;

      // Pick the next topic to schedule for this subject:
      // If custom sequence is enabled:
      // 1. First priority: Check if a previously introduced topic is due for spaced revision/practice
      //    (e.g., scheduled at least 2 days ago and still needs sessions, especially weak topics).
      // 2. Otherwise, introduce the next topic in the custom sequence (currentSequenceIndex).
      // 3. If all sequenced topics have been introduced, cycle back for revision/test sessions.
      let chosenTopicMeta = currentSubjectPlan.topics[0];

      if (currentSubjectPlan.hasCustomSequence) {
        // Find if an already-introduced topic needs revision (spaced repetition)
        const dueRevisionTopic = currentSubjectPlan.topics
          .slice(0, currentSubjectPlan.currentSequenceIndex)
          .find((t) => 
            t.sessionsScheduled < t.sessionsNeeded && 
            dayOffset - t.lastScheduledDay >= (t.topic.difficulty === 'weak' ? 2 : 4)
          );

        if (dueRevisionTopic) {
          chosenTopicMeta = dueRevisionTopic;
        } else if (currentSubjectPlan.currentSequenceIndex < currentSubjectPlan.topics.length) {
          // Introduce next topic in the specified sequence!
          chosenTopicMeta = currentSubjectPlan.topics[currentSubjectPlan.currentSequenceIndex];
          currentSubjectPlan.currentSequenceIndex++;
        } else {
          // All topics introduced, pick the one with most remaining sessions or highest priority
          const remaining = currentSubjectPlan.topics
            .filter((t) => t.sessionsScheduled < t.sessionsNeeded)
            .sort((a, b) => b.weight - a.weight);
          
          if (remaining.length > 0) {
            chosenTopicMeta = remaining[0];
          } else {
            // General review cycle
            chosenTopicMeta = currentSubjectPlan.topics[slotIndex % currentSubjectPlan.topics.length];
          }
        }
      } else {
        // Automatic prioritization:
        // Prioritize topics that need sessions, weighted by difficulty
        const candidateTopics = currentSubjectPlan.topics
          .filter((t) => t.sessionsScheduled < t.sessionsNeeded)
          .sort((a, b) => {
            // Give extra weight to topics not scheduled today
            const aDaysSince = dayOffset - a.lastScheduledDay;
            const bDaysSince = dayOffset - b.lastScheduledDay;
            return (b.weight * Math.min(bDaysSince, 3)) - (a.weight * Math.min(aDaysSince, 3));
          });

        if (candidateTopics.length > 0) {
          chosenTopicMeta = candidateTopics[0];
        } else {
          chosenTopicMeta = currentSubjectPlan.topics[slotIndex % currentSubjectPlan.topics.length];
        }
      }

      const count = chosenTopicMeta.sessionsScheduled;
      chosenTopicMeta.sessionsScheduled++;
      chosenTopicMeta.lastScheduledDay = dayOffset;

      // Determine session type based on repetition cycle
      let sessionType: SessionType = 'learn';
      if (count === 1) {
        sessionType = 'practice';
      } else if (count === 2) {
        sessionType = 'revision';
      } else if (count >= 3 && count % 2 === 1) {
        sessionType = 'test';
      } else if (count >= 3) {
        sessionType = 'revision';
      }

      if (chosenTopicMeta.topic.difficulty === 'strong' && count === 0) {
        sessionType = 'practice';
      }

      const sessionId = `sess-${exam.id}-${currentDate}-${slotIndex}-${Math.random().toString(36).substr(2, 6)}`;

      sessions.push({
        id: sessionId,
        examId: exam.id,
        subjectId: currentSubjectPlan.subject.id,
        topicId: chosenTopicMeta.topic.id,
        subjectName: currentSubjectPlan.subject.name,
        topicName: chosenTopicMeta.topic.name,
        date: currentDate,
        timeSlot: `${slot.start} - ${slot.end}`,
        preferredPeriod: slot.period,
        durationMinutes: sessionDuration,
        sessionType,
        difficulty: chosenTopicMeta.topic.difficulty,
        status: 'scheduled',
        isPriorityBoosted: chosenTopicMeta.topic.difficulty === 'weak' || (chosenTopicMeta.topic.recentScore ?? 100) < 60,
        topicSequenceOrder: chosenTopicMeta.sequenceOrder,
      });
    });
  }

  return sessions;
}

/**
 * Auto-Redistribute missed or skipped sessions
 * Reallocates uncompleted tasks into upcoming open days without overloading the student
 */
export function redistributeMissedSessions(
  currentSessions: StudySession[],
  exam: Exam,
  todayStr: string = formatIsoDate(new Date())
): { updatedSessions: StudySession[]; countRedistributed: number } {
  // Find sessions that were missed (scheduled before today) or marked as skipped
  const missedSessions = currentSessions.filter(
    (s) => (s.status === 'scheduled' && s.date < todayStr) || s.status === 'skipped'
  );

  if (missedSessions.length === 0) {
    return { updatedSessions: currentSessions, countRedistributed: 0 };
  }

  // Active future sessions
  const futureSessions = currentSessions.filter(
    (s) => !( (s.status === 'scheduled' && s.date < todayStr) || s.status === 'skipped' )
  );

  // Find future capacity: count sessions per day
  const dailyCounts: Record<string, number> = {};
  futureSessions.forEach((s) => {
    dailyCounts[s.date] = (dailyCounts[s.date] || 0) + 1;
  });

  const maxSessionsPerDay = Math.max(1, Math.min(Math.round(exam.dailyStudyHours), 6));
  const activePeriods: StudyPeriod[] = exam.preferredPeriods.length > 0 
    ? exam.preferredPeriods 
    : (['morning', 'evening'] as StudyPeriod[]);
  const dailySlots: { period: StudyPeriod; start: string; end: string }[] = [];

  activePeriods.forEach((period: StudyPeriod) => {
    (PERIOD_TIME_SLOTS[period] || []).forEach((slot: { start: string; end: string }) => {
      dailySlots.push({ period, start: slot.start, end: slot.end });
    });
  });

  let redistributedCount = 0;
  const newRedistributed: StudySession[] = [];

  let searchDayOffset = 0;
  for (const missed of missedSessions) {
    let placed = false;

    // Look up to 30 days ahead from today for an available slot
    while (!placed && searchDayOffset < 30) {
      const targetDate = addDays(todayStr, searchDayOffset);
      if (targetDate >= exam.examDate) {
        break;
      }

      const countOnDay = (dailyCounts[targetDate] || 0);
      if (countOnDay < maxSessionsPerDay) {
        // Can place here!
        const slotIdx = countOnDay % dailySlots.length;
        const slot = dailySlots[slotIdx] || { period: 'evening', start: '17:30', end: '18:30' };

        newRedistributed.push({
          ...missed,
          id: `resched-${missed.id}-${Math.random().toString(36).substr(2, 4)}`,
          date: targetDate,
          timeSlot: `${slot.start} - ${slot.end}`,
          preferredPeriod: slot.period,
          status: 'rescheduled',
          notes: missed.notes ? `${missed.notes} (Auto-redistributed)` : 'Auto-redistributed from earlier missed session',
        });

        dailyCounts[targetDate] = countOnDay + 1;
        redistributedCount++;
        placed = true;
      } else {
        searchDayOffset++;
      }
    }

    if (!placed) {
      // If no space, place on closest upcoming day as rescheduled
      const targetDate = addDays(todayStr, 1);
      newRedistributed.push({
        ...missed,
        date: targetDate,
        status: 'rescheduled',
      });
      redistributedCount++;
    }
  }

  // Combine: completed/past history preserved, future sessions kept, newly rescheduled appended
  const updatedSessions = [...futureSessions, ...newRedistributed].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.timeSlot.localeCompare(b.timeSlot);
  });

  return { updatedSessions, countRedistributed: redistributedCount };
}

/**
 * Smart Practice Test Impact Engine:
 * When a student scores in a practice test (e.g. Physics - Kinematics: 45%),
 * the system recognizes low scores (<60%) as weak areas and increases their
 * priority in future study plans by injecting targeted revision and practice sessions.
 */
export function applyPracticeScoreImpact(
  currentSessions: StudySession[],
  score: PracticeScore,
  exam: Exam,
  todayStr: string = formatIsoDate(new Date())
): { updatedSessions: StudySession[]; impactMessage: string } {
  let impactMessage = '';
  const updatedSessions = [...currentSessions];

  if (score.scorePercentage < 60) {
    // Weak score: immediately inject 2 high-priority sessions within the next 2-7 days
    const dayOffsets = [2, 5];
    const newSessions: StudySession[] = [];

    dayOffsets.forEach((offset, idx) => {
      const targetDate = addDays(todayStr, offset);
      if (targetDate <= exam.examDate) {
        newSessions.push({
          id: `boost-${score.topicId}-${targetDate}-${idx}`,
          examId: exam.id,
          subjectId: score.subjectId,
          topicId: score.topicId,
          subjectName: score.subjectName,
          topicName: score.topicName,
          date: targetDate,
          timeSlot: idx === 0 ? '16:00 - 17:00' : '18:00 - 19:00',
          preferredPeriod: idx === 0 ? 'afternoon' : 'evening',
          durationMinutes: 60,
          sessionType: idx === 0 ? 'revision' : 'practice',
          difficulty: 'weak',
          status: 'scheduled',
          isPriorityBoosted: true,
          notes: `Priority reinforcement triggered by practice test score (${score.scorePercentage}%).`,
        });
      }
    });

    updatedSessions.push(...newSessions);
    impactMessage = `Weakness detected in "${score.topicName}" (${score.scorePercentage}%). Automatically added ${newSessions.length} priority revision & practice sessions to your timetable.`;
  } else if (score.scorePercentage >= 80) {
    impactMessage = `Great mastery on "${score.topicName}" (${score.scorePercentage}%). Topic mastery upgraded to Strong!`;
  } else {
    impactMessage = `Solid progress on "${score.topicName}" (${score.scorePercentage}%). Regular revision scheduled.`;
  }

  // Re-sort
  updatedSessions.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.timeSlot.localeCompare(b.timeSlot);
  });

  return { updatedSessions, impactMessage };
}
