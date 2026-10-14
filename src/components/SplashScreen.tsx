import React, { useEffect, useState } from 'react';
import { BookOpen, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [fadeOut, setFadeOut] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    // Fill progress bar smoothly across ~1.8 seconds
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 90);

    // Trigger fade out at 1.85s
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 1850);

    // Final finish callback at 2.1s (smooth transition)
    const endTimer = setTimeout(() => {
      onFinish();
    }, 2100);

    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-opacity duration-300 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="StudyFlow Launching"
    >
      <div className="flex flex-col items-center max-w-sm px-6 text-center space-y-6 animate-fadeIn">
        {/* App Logo */}
        <div className="relative">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-emerald-600 text-white flex items-center justify-center shadow-xl shadow-emerald-600/20 transform transition-transform hover:scale-105">
            <BookOpen className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Brand Name & Purpose */}
        <div className="space-y-1.5">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            StudyFlow
          </h1>
          <p className="text-xs sm:text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Adaptive Exam Preparation & Timetable Planner
          </p>
        </div>

        {/* Micro Subtitle: WAEC · JAMB · NECO */}
        <div className="flex items-center gap-2 text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
          <span>JAMB UTME</span>
          <span aria-hidden="true">·</span>
          <span>WAEC</span>
          <span aria-hidden="true">·</span>
          <span>NECO</span>
          <span aria-hidden="true">·</span>
          <span>FINALS</span>
        </div>

        {/* Sleek Hairline Progress Bar */}
        <div className="w-48 sm:w-56 h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden mt-4">
          <div
            className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <span className="text-[11px] text-neutral-400 font-mono">
          Loading your study workspace...
        </span>
      </div>
    </div>
  );
};
