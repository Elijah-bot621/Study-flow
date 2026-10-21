import React, { useState } from 'react';
import { 
  Exam, 
  Subject, 
  Topic, 
  ExamType, 
  StudyPeriod, 
  TopicDifficulty 
} from '../types';
import { PRESET_CURRICULA, COMMON_SUBJECT_SUGGESTIONS } from '../data/curriculumData';
import { 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Sparkles, 
  ArrowUp, 
  ArrowDown, 
  ListOrdered, 
  GripVertical,
  RotateCcw,
  AlertCircle,
  BookOpen
} from 'lucide-react';
import {
  validateSubjectName,
  validateTopicName,
  validateExamDate,
  validateDailyStudyHours,
  validateExamTitle,
  validateStudyPeriods,
} from '../services/validation';
import { toLocalDateString, getTodayLocalDateString } from '../services/dateUtils';

interface CreateStudyPlanProps {
  onPlanCreated: (newExam: Exam) => void;
  onCancel: () => void;
}

export const CreateStudyPlan: React.FC<CreateStudyPlanProps> = ({
  onPlanCreated,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form states
  const [examType, setExamType] = useState<ExamType>('JAMB');
  const [examTitle, setExamTitle] = useState<string>('JAMB UTME 2026 Examination');
  
  // Default exam date: 45 days from today
  const defaultExamDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 45);
    return toLocalDateString(d);
  };
  const [examDate, setExamDate] = useState<string>(defaultExamDate());
  const [dailyHours, setDailyHours] = useState<number>(3.5);
  const [preferredPeriods, setPreferredPeriods] = useState<StudyPeriod[]>([
    'early_morning',
    'evening',
    'night',
  ]);

  // Selected subjects and topics state
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);

  const [newSubjectInput, setNewSubjectInput] = useState<string>('');
  const [newTopicInputs, setNewTopicInputs] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [draggedTopicState, setDraggedTopicState] = useState<{ subjectId: string; index: number } | null>(null);

  // Validation error states
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [subjectError, setSubjectError] = useState<string>('');
  const [topicErrors, setTopicErrors] = useState<Record<string, string>>({});
  const [planGenerationError, setPlanGenerationError] = useState<string>('');

  // Quick switch when user selects exam type
  const handleExamTypeChange = (type: ExamType) => {
    setExamType(type);
    let title = `${type} Examination`;
    if (type === 'JAMB') title = 'JAMB UTME 2026';
    if (type === 'WAEC') title = 'WAEC WASSCE 2026';
    if (type === 'NECO') title = 'NECO Senior School Certificate Exam';
    if (type === 'POST_UTME') title = 'Post-UTME Screening Exam';
    if (type === 'UNIVERSITY') title = 'University Semester Finals';
    setExamTitle(title);
  };

  const togglePeriod = (period: StudyPeriod) => {
    if (preferredPeriods.includes(period)) {
      if (preferredPeriods.length > 1) {
        setPreferredPeriods(preferredPeriods.filter((p) => p !== period));
      }
    } else {
      setPreferredPeriods([...preferredPeriods, period]);
    }
  };

  const handleAddCustomSubject = (name: string) => {
    const val = validateSubjectName(name, selectedSubjects);
    if (!val.valid) {
      setSubjectError(val.error || 'Please enter a valid subject name.');
      return;
    }
    setSubjectError('');
    const colors = ['#3B82F6', '#10B981', '#6366F1', '#F59E0B', '#EC4899', '#8B5CF6'];
    const subjId = `subj-custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    // If subject name matches a known curriculum preset, populate its official syllabus topics
    const matchingPreset = (PRESET_CURRICULA[examType] || []).find(
      (p) => p.name.toLowerCase() === name.trim().toLowerCase()
    ) || (PRESET_CURRICULA['JAMB'] || []).find(
      (p) => p.name.toLowerCase() === name.trim().toLowerCase()
    );

    const topics: Topic[] = matchingPreset
      ? matchingPreset.topics.map((t, tIdx) => ({
          id: `top-${subjId}-${tIdx + 1}`,
          subjectId: subjId,
          name: t.name,
          difficulty: t.defaultDifficulty,
          masteryScore: t.defaultDifficulty === 'strong' ? 85 : t.defaultDifficulty === 'average' ? 60 : 40,
          revisionIntervalDays: t.defaultDifficulty === 'weak' ? 3 : 7,
          totalSessionsCompleted: 0,
        }))
      : [
          {
            id: `top-${subjId}-1`,
            subjectId: subjId,
            name: 'Core Fundamentals & Definitions',
            difficulty: 'average',
            masteryScore: 60,
            revisionIntervalDays: 5,
            totalSessionsCompleted: 0,
          },
        ];

    const newSubj: Subject = {
      id: subjId,
      examId: 'temp_exam',
      name: name.trim(),
      color: matchingPreset?.color || colors[selectedSubjects.length % colors.length],
      hasCustomSequence: false,
      topics,
    };
    setSelectedSubjects([...selectedSubjects, newSubj]);
    setNewSubjectInput('');
  };

  const handleRemoveSubject = (subjectId: string) => {
    setSubjectError('');
    setSelectedSubjects(selectedSubjects.filter((s) => s.id !== subjectId));
  };

  const handleProceedToStep2 = () => {
    const titleVal = validateExamTitle(examTitle);
    if (!titleVal.valid) {
      setStepErrors({ examTitle: titleVal.error || 'Please enter a valid exam title.' });
      return;
    }
    setStepErrors({});
    setCurrentStep(2);
  };

  const handleProceedToStep3 = () => {
    const dateVal = validateExamDate(examDate);
    if (!dateVal.valid) {
      setStepErrors({ examDate: dateVal.error || 'Please enter a valid future exam date.' });
      return;
    }
    const hoursVal = validateDailyStudyHours(dailyHours);
    if (!hoursVal.valid) {
      setStepErrors({ dailyHours: hoursVal.error || 'Please enter valid study hours.' });
      return;
    }
    const periodsVal = validateStudyPeriods(preferredPeriods);
    if (!periodsVal.valid) {
      setStepErrors({ preferredPeriods: periodsVal.error || 'Please select at least one study period.' });
      return;
    }
    setStepErrors({});
    setCurrentStep(3);
  };

  const handleProceedToStep4 = () => {
    if (selectedSubjects.length === 0) {
      setSubjectError('You must have at least one subject in your study plan.');
      return;
    }
    setSubjectError('');
    setCurrentStep(4);
  };

  const handleTopicDifficultyChange = (
    subjectId: string,
    topicId: string,
    difficulty: TopicDifficulty
  ) => {
    setSelectedSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          topics: s.topics.map((t) => (t.id === topicId ? { ...t, difficulty } : t)),
        };
      })
    );
  };

  // Toggle optional custom sequence for a subject
  const handleToggleSequence = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== subjectId) return s;
        const willEnable = !s.hasCustomSequence;
        return {
          ...s,
          hasCustomSequence: willEnable,
          topics: s.topics.map((t, idx) => ({
            ...t,
            sequenceOrder: willEnable ? idx + 1 : undefined,
          })),
        };
      })
    );
  };

  // Reorder topics via Move Up button
  const handleMoveTopicUp = (subjectId: string, index: number) => {
    if (index <= 0) return;
    setSelectedSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== subjectId) return s;
        const newTopics = [...s.topics];
        const temp = newTopics[index - 1];
        newTopics[index - 1] = newTopics[index];
        newTopics[index] = temp;
        // update sequenceOrder for all
        return {
          ...s,
          hasCustomSequence: true,
          topics: newTopics.map((t, idx) => ({
            ...t,
            sequenceOrder: idx + 1,
          })),
        };
      })
    );
  };

  // Reorder topics via Move Down button
  const handleMoveTopicDown = (subjectId: string, index: number) => {
    setSelectedSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== subjectId) return s;
        if (index >= s.topics.length - 1) return s;
        const newTopics = [...s.topics];
        const temp = newTopics[index + 1];
        newTopics[index + 1] = newTopics[index];
        newTopics[index] = temp;
        return {
          ...s,
          hasCustomSequence: true,
          topics: newTopics.map((t, idx) => ({
            ...t,
            sequenceOrder: idx + 1,
          })),
        };
      })
    );
  };

  // Drag and drop reordering
  const handleDragStart = (subjectId: string, index: number) => {
    setDraggedTopicState({ subjectId, index });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetSubjectId: string, targetIndex: number) => {
    if (!draggedTopicState || draggedTopicState.subjectId !== targetSubjectId) {
      setDraggedTopicState(null);
      return;
    }
    const fromIndex = draggedTopicState.index;
    if (fromIndex === targetIndex) {
      setDraggedTopicState(null);
      return;
    }

    setSelectedSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== targetSubjectId) return s;
        const newTopics = [...s.topics];
        const [movedItem] = newTopics.splice(fromIndex, 1);
        newTopics.splice(targetIndex, 0, movedItem);
        return {
          ...s,
          hasCustomSequence: true,
          topics: newTopics.map((t, idx) => ({
            ...t,
            sequenceOrder: idx + 1,
          })),
        };
      })
    );
    setDraggedTopicState(null);
  };

  const handleAddTopic = (subjectId: string) => {
    const inputVal = newTopicInputs[subjectId] || '';
    const targetSubj = selectedSubjects.find((s) => s.id === subjectId);
    if (!targetSubj) return;

    const val = validateTopicName(inputVal, targetSubj.topics);
    if (!val.valid) {
      setTopicErrors((prev) => ({ ...prev, [subjectId]: val.error || 'Please enter a valid topic name.' }));
      return;
    }

    setTopicErrors((prev) => ({ ...prev, [subjectId]: '' }));
    setSelectedSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== subjectId) return s;
        const newTopic: Topic = {
          id: `top-custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          subjectId: s.id,
          name: inputVal.trim(),
          difficulty: 'weak',
          masteryScore: 40,
          revisionIntervalDays: 3,
          totalSessionsCompleted: 0,
          sequenceOrder: s.hasCustomSequence ? s.topics.length + 1 : undefined,
        };
        return {
          ...s,
          topics: [...s.topics, newTopic],
        };
      })
    );

    setNewTopicInputs({ ...newTopicInputs, [subjectId]: '' });
  };

  const handleRemoveTopic = (subjectId: string, topicId: string) => {
    setSelectedSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== subjectId) return s;
        if (s.topics.length <= 1) {
          setTopicErrors((prevErrors) => ({
            ...prevErrors,
            [subjectId]: `"${s.name}" must contain at least one topic.`,
          }));
          return s;
        }
        setTopicErrors((prevErrors) => ({
          ...prevErrors,
          [subjectId]: '',
        }));
        const remainingTopics = s.topics.filter((t) => t.id !== topicId);
        return {
          ...s,
          topics: remainingTopics.map((t, idx) => ({
            ...t,
            sequenceOrder: s.hasCustomSequence ? idx + 1 : undefined,
          })),
        };
      })
    );
  };

  const handleGeneratePlan = () => {
    const emptySubj = selectedSubjects.find((s) => s.topics.length === 0);
    if (emptySubj) {
      setPlanGenerationError(`Subject "${emptySubj.name}" must have at least one topic.`);
      return;
    }
    const dateVal = validateExamDate(examDate);
    if (!dateVal.valid) {
      setPlanGenerationError(dateVal.error || 'Exam date is invalid.');
      return;
    }

    setPlanGenerationError('');
    setIsGenerating(true);
    setTimeout(() => {
      const examId = `exam-${Date.now()}`;
      const finalizedSubjects = selectedSubjects.map((s) => ({
        ...s,
        examId: examId,
        hasCustomSequence: Boolean(s.hasCustomSequence),
        topics: s.topics.map((t, idx) => ({
          ...t,
          subjectId: s.id,
          sequenceOrder: s.hasCustomSequence ? (t.sequenceOrder ?? idx + 1) : undefined,
        })),
      }));

      const newExam: Exam = {
        id: examId,
        title: examTitle,
        examType: examType,
        examDate: examDate,
        dailyStudyHours: dailyHours,
        preferredPeriods: preferredPeriods,
        subjects: finalizedSubjects,
        createdAt: getTodayLocalDateString(),
        isActive: true,
      };

      onPlanCreated(newExam);
      setIsGenerating(false);
    }, 800);
  };

  const totalTopicsCount = selectedSubjects.reduce((acc, s) => acc + s.topics.length, 0);
  const weakTopicsCount = selectedSubjects.reduce(
    (acc, s) => acc + s.topics.filter((t) => t.difficulty === 'weak').length,
    0
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Create Study Plan
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Build an automated exam preparation timetable tailored to your syllabus and available hours.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400">
          <span>Step {currentStep} of 4</span>
        </div>
      </div>

      {/* Step 1: Exam Type & Title */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
              Select Examination Target
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { type: 'JAMB', label: 'JAMB UTME', sub: 'Unified Tertiary Matric' },
                { type: 'WAEC', label: 'WAEC WASSCE', sub: 'West African Senior Cert' },
                { type: 'NECO', label: 'NECO SSCE', sub: 'National Examinations' },
                { type: 'POST_UTME', label: 'Post-UTME', sub: 'University Screening' },
                { type: 'UNIVERSITY', label: 'University Exam', sub: 'Semester Exams / Finals' },
                { type: 'CUSTOM', label: 'Custom Test', sub: 'Personal Exam Schedule' },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleExamTypeChange(item.type as ExamType)}
                  className={`p-4 text-left rounded-xl border transition-all ${
                    examType === item.type
                      ? 'border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20 text-neutral-900 dark:text-white ring-1 ring-emerald-600'
                      : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-white">{item.label}</div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">{item.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Exam Title / Name
            </label>
            <input
              type="text"
              value={examTitle}
              onChange={(e) => {
                setExamTitle(e.target.value);
                if (stepErrors.examTitle) setStepErrors((prev) => ({ ...prev, examTitle: '' }));
              }}
              className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 ${
                stepErrors.examTitle
                  ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-500'
                  : 'border-neutral-200 dark:border-neutral-700 focus:ring-emerald-500'
              }`}
              placeholder="e.g. JAMB UTME 2026 Examination"
            />
            {stepErrors.examTitle && (
              <div className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{stepErrors.examTitle}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              Cancel
            </button>
            <button
              onClick={handleProceedToStep2}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
            >
              <span>Next: Dates & Hours</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Exam Date, Daily Hours & Time Periods */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Exam Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={examDate}
                  min={getTodayLocalDateString()}
                  onChange={(e) => {
                    setExamDate(e.target.value);
                    if (stepErrors.examDate) setStepErrors((prev) => ({ ...prev, examDate: '' }));
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white ${
                    stepErrors.examDate
                      ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-500'
                      : 'border-neutral-200 dark:border-neutral-700 focus:ring-emerald-500'
                  }`}
                />
              </div>
              {stepErrors.examDate ? (
                <div className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{stepErrors.examDate}</span>
                </div>
              ) : (
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                  StudyFlow will distribute topics evenly up to this date.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Target Study Hours Per Day: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{dailyHours}h</span>
              </label>
              <input
                type="range"
                min="1.5"
                max="6"
                step="0.5"
                value={dailyHours}
                onChange={(e) => {
                  setDailyHours(parseFloat(e.target.value));
                  if (stepErrors.dailyHours) setStepErrors((prev) => ({ ...prev, dailyHours: '' }));
                }}
                className="w-full accent-emerald-600 mt-2"
              />
              <div className="flex justify-between text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">
                <span>1.5 hrs</span>
                <span>3.5 hrs (Recommended)</span>
                <span>6.0 hrs</span>
              </div>
              {stepErrors.dailyHours && (
                <div className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{stepErrors.dailyHours}</span>
                </div>
              )}
            </div>
          </div>

          {/* Preferred Study Periods */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              When do you prefer to study during the day?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {[
                { period: 'early_morning', label: 'Early Morning', time: '05:30 - 07:30' },
                { period: 'morning', label: 'Morning', time: '09:00 - 12:30' },
                { period: 'afternoon', label: 'Afternoon', time: '14:00 - 17:30' },
                { period: 'evening', label: 'Evening', time: '17:30 - 19:45' },
                { period: 'night', label: 'Night Owl', time: '20:30 - 22:45' },
              ].map((p) => {
                const isSelected = preferredPeriods.includes(p.period as StudyPeriod);
                return (
                  <button
                    key={p.period}
                    type="button"
                    onClick={() => {
                      togglePeriod(p.period as StudyPeriod);
                      if (stepErrors.preferredPeriods) setStepErrors((prev) => ({ ...prev, preferredPeriods: '' }));
                    }}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20 text-neutral-900 dark:text-white ring-1 ring-emerald-600'
                        : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <div className="text-xs font-semibold">{p.label}</div>
                    <div className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono mt-0.5">{p.time}</div>
                  </button>
                );
              })}
            </div>
            {stepErrors.preferredPeriods && (
              <div className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{stepErrors.preferredPeriods}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <button
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={handleProceedToStep3}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
            >
              <span>Next: Select Subjects</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Select Subjects & Add Custom Subjects */}
      {currentStep === 3 && (
        <div className="space-y-6">
          {subjectError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{subjectError}</span>
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">
              Active Examination Subjects ({selectedSubjects.length})
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              Add or remove subjects. In the next step, you can optionally set topic study sequence and rate difficulty.
            </p>

            {selectedSubjects.length === 0 ? (
              <div className="p-6 sm:p-8 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-center space-y-2">
                <BookOpen className="w-8 h-8 text-neutral-400 dark:text-neutral-500 mx-auto" />
                <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  No subjects added yet
                </p>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 max-w-sm mx-auto">
                  Click on popular subjects below or type your custom subject name to add it to your plan.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedSubjects.map((subj) => (
                  <div
                    key={subj.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: subj.color }}
                      />
                      <div className="truncate">
                        <div className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                          {subj.name}
                        </div>
                        <div className="text-[11px] text-neutral-400 dark:text-neutral-500">
                          {subj.topics.length} topics loaded
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveSubject(subj.id)}
                      className="p-1.5 text-neutral-400 hover:text-rose-500 transition-colors shrink-0 cursor-pointer"
                      title="Remove subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Suggestions to add */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Quick Add Popular Subjects:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SUBJECT_SUGGESTIONS.filter(
                (name) => !selectedSubjects.some((s) => s.name.toLowerCase() === name.toLowerCase())
              ).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleAddCustomSubject(name)}
                  className="px-2.5 py-1 text-xs border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/60 rounded-lg hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors text-neutral-700 dark:text-neutral-300 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>{name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Subject Input */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newSubjectInput}
              onChange={(e) => setNewSubjectInput(e.target.value)}
              placeholder="Or type custom subject (e.g. Further Mathematics)"
              className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomSubject(newSubjectInput);
                }
              }}
            />
            <button
              onClick={() => handleAddCustomSubject(newSubjectInput)}
              className="px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shrink-0"
            >
              Add Subject
            </button>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <button
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={handleProceedToStep4}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
            >
              <span>Next: Topics & Sequence</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Topic Difficulty & Optional Topic Sequencing */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Smart Study Engine & Topic Sequencing</span>
            </div>
            <p className="leading-relaxed">
              • <strong>Topic Sequencing is optional</strong>: By default, StudyFlow automatically optimizes topic order based on difficulty and exam weighting.
              <br />
              • If you want topics covered in a specific curriculum order (e.g. Topic 1 → Topic 2 → Topic 3), click <strong>"Set Sequence"</strong> and arrange them with the <span className="font-mono">↑ / ↓</span> buttons or drag them into position.
            </p>
          </div>

          <div className="space-y-6">
            {selectedSubjects.map((subj) => (
              <div
                key={subj.id}
                className="p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4"
              >
                {/* Subject Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: subj.color }} />
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      {subj.name}
                    </h3>
                    <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">
                      ({subj.topics.length} Topics)
                    </span>
                  </div>

                  {/* Optional Sequencing Toggle Button */}
                  <div className="flex items-center gap-2">
                    {subj.hasCustomSequence ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <ListOrdered className="w-3 h-3" />
                          <span>Sequence Active</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleSequence(subj.id)}
                          className="text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 underline flex items-center gap-0.5"
                          title="Reset to automatic AI prioritization"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>Auto-order</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleSequence(subj.id)}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors flex items-center gap-1.5"
                      >
                        <ListOrdered className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Set Sequence (Optional)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Optional Sequence Explainer when active */}
                {subj.hasCustomSequence && (
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                    <span>
                      Order topics in the sequence you want them taught in your timetable (1 → {subj.topics.length}).
                    </span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold shrink-0 ml-2">
                      Sequenced
                    </span>
                  </div>
                )}

                {/* Topic list */}
                <div className="space-y-2">
                  {subj.topics.map((topic, index) => (
                    <div
                      key={topic.id}
                      draggable={Boolean(subj.hasCustomSequence)}
                      onDragStart={() => handleDragStart(subj.id, index)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(subj.id, index)}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-xl border transition-all ${
                        subj.hasCustomSequence
                          ? 'border-neutral-200 dark:border-neutral-700/80 bg-neutral-50/70 dark:bg-neutral-800/40'
                          : 'border-neutral-100 dark:border-neutral-800/60 bg-neutral-50/40 dark:bg-neutral-800/20'
                      }`}
                    >
                      {/* Left: Sequence index & reorder buttons + Topic Name */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {/* Optional Sequence indicator / Reorder Controls */}
                        {subj.hasCustomSequence ? (
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Drag handle */}
                            <span 
                              className="cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5 hidden sm:inline-block"
                              title="Drag to reorder"
                            >
                              <GripVertical className="w-3.5 h-3.5" />
                            </span>

                            {/* Sequence Number badge */}
                            <span className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-mono font-bold text-[11px] shadow-2xs">
                              {index + 1}
                            </span>

                            {/* Up & Down Reorder Buttons */}
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => handleMoveTopicUp(subj.id, index)}
                                className={`p-0.5 rounded transition-colors ${
                                  index === 0
                                    ? 'text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
                                    : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                }`}
                                title="Move earlier in sequence"
                                aria-label={`Move ${topic.name} earlier`}
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={index === subj.topics.length - 1}
                                onClick={() => handleMoveTopicDown(subj.id, index)}
                                className={`p-0.5 rounded transition-colors ${
                                  index === subj.topics.length - 1
                                    ? 'text-neutral-300 dark:text-neutral-700 cursor-not-allowed'
                                    : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                }`}
                                title="Move later in sequence"
                                aria-label={`Move ${topic.name} later`}
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="w-5 text-[11px] text-neutral-400 dark:text-neutral-500 font-mono text-center shrink-0">
                            •
                          </span>
                        )}

                        <span className="font-medium text-xs text-neutral-800 dark:text-neutral-200 truncate sm:whitespace-normal">
                          {topic.name}
                        </span>
                      </div>

                      {/* Right: Difficulty Segmented Selector + Delete */}
                      <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-neutral-200/60 dark:border-neutral-700/60">
                        <div className="flex items-center gap-1 p-0.5 bg-neutral-200/60 dark:bg-neutral-800 rounded-lg">
                          <button
                            type="button"
                            onClick={() => handleTopicDifficultyChange(subj.id, topic.id, 'weak')}
                            className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
                              topic.difficulty === 'weak'
                                ? 'bg-rose-600 text-white shadow-2xs font-semibold'
                                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                            }`}
                          >
                            Weak
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTopicDifficultyChange(subj.id, topic.id, 'average')}
                            className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
                              topic.difficulty === 'average'
                                ? 'bg-amber-600 text-white shadow-2xs font-semibold'
                                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                            }`}
                          >
                            Average
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTopicDifficultyChange(subj.id, topic.id, 'strong')}
                            className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
                              topic.difficulty === 'strong'
                                ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                            }`}
                          >
                            Strong
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveTopic(subj.id, topic.id)}
                          className="text-neutral-400 hover:text-rose-500 p-1 transition-colors"
                          title="Delete topic"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add custom topic under this subject */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <input
                    type="text"
                    value={newTopicInputs[subj.id] || ''}
                    onChange={(e) => {
                      setNewTopicInputs({ ...newTopicInputs, [subj.id]: e.target.value });
                      if (topicErrors[subj.id]) setTopicErrors((prev) => ({ ...prev, [subj.id]: '' }));
                    }}
                    placeholder={`Add new topic to ${subj.name}...`}
                    className={`flex-1 px-3 py-1.5 rounded-lg border bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 ${
                      topicErrors[subj.id]
                        ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-500'
                        : 'border-neutral-200 dark:border-neutral-700 focus:ring-emerald-500'
                    }`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTopic(subj.id);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTopic(subj.id)}
                    className="px-3 py-1.5 text-xs font-medium border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors shrink-0"
                  >
                    Add Topic
                  </button>
                </div>
                {topicErrors[subj.id] && (
                  <div className="flex items-center gap-1.5 text-[11px] text-rose-500 dark:text-rose-400 pt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{topicErrors[subj.id]}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Plan Generation Error Banner */}
          {planGenerationError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{planGenerationError}</span>
            </div>
          )}

          {/* Summary Box */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 text-xs text-neutral-600 dark:text-neutral-300 space-y-1">
            <div className="font-semibold text-neutral-900 dark:text-white">
              Ready to generate timetable:
            </div>
            <div>
              {selectedSubjects.length} subjects · {totalTopicsCount} syllabus topics · {weakTopicsCount} weak areas prioritized.
            </div>
            {selectedSubjects.some((s) => s.hasCustomSequence) && (
              <div className="text-emerald-700 dark:text-emerald-300 font-medium pt-0.5">
                Custom sequence active for: {selectedSubjects.filter((s) => s.hasCustomSequence).map((s) => s.name).join(', ')}.
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <button
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? 'Synthesizing Balanced Timetable...' : 'Generate My Timetable'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
