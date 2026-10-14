import React, { useState } from 'react';
import { Check, X, Sparkles, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../types';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateTier: (tier: 'free' | 'premium') => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateTier,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [justUpgraded, setJustUpgraded] = useState(false);

  if (!isOpen) return null;

  const handleSelectTier = (tier: 'free' | 'premium') => {
    onUpdateTier(tier);
    setJustUpgraded(true);
    setTimeout(() => {
      setJustUpgraded(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
              StudyFlow Plans & Pricing
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Empowering students preparing for WAEC, JAMB, NECO, and university finals.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
          {/* Billing Cadence Selector */}
          <div className="flex justify-center">
            <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Monthly Term
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  billingCycle === 'yearly'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <span>Academic Session (Annual)</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Save 25%
                </span>
              </button>
            </div>
          </div>

          {justUpgraded && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center text-xs text-emerald-800 dark:text-emerald-300 font-medium">
              Study plan updated successfully! Your active plan is saved on this device.
            </div>
          )}

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-stretch">
            {/* Free Plan */}
            <div className={`p-5 sm:p-6 rounded-2xl border flex flex-col justify-between transition-colors ${
              userProfile.tier === 'free'
                ? 'border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30'
                : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'
            }`}>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                    Starter Scholar
                  </h3>
                  {userProfile.tier === 'free' && (
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                      Current Plan
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  For individual students studying for a single primary examination.
                </p>

                <div className="mt-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white tabular-nums">
                      ₦0
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">/ forever free</span>
                  </div>
                </div>

                <ul className="mt-5 space-y-2.5 text-xs text-neutral-600 dark:text-neutral-300">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>One active exam timetable (e.g. JAMB or WAEC)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Basic automated daily & weekly timetable generator</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Basic progress tracking and completed sessions log</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Practice test score logging</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-neutral-400 dark:text-neutral-500">
                    <X className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Multi-exam parallel study planning</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-neutral-400 dark:text-neutral-500">
                    <X className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Spaced repetition weak-topic auto-scheduler</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 sm:mt-8">
                <button
                  onClick={() => handleSelectTier('free')}
                  disabled={userProfile.tier === 'free'}
                  className={`w-full py-2.5 text-xs font-semibold rounded-xl border transition-colors ${
                    userProfile.tier === 'free'
                      ? 'border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-default'
                      : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
                  }`}
                >
                  {userProfile.tier === 'free' ? 'Active Plan' : 'Downgrade to Starter'}
                </button>
              </div>
            </div>

            {/* Premium Plan */}
            <div className={`p-5 sm:p-6 rounded-2xl border flex flex-col justify-between relative transition-colors ${
              userProfile.tier === 'premium'
                ? 'border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/20 shadow-md'
                : 'border-neutral-900 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-md'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                  <span>High-Performance Student</span>
                </div>
                {userProfile.tier === 'premium' && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    Active Plan
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-base font-semibold text-neutral-900 dark:text-white mt-2">
                  StudyFlow Premium
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  For students seeking top percentile scores in competitive national exams.
                </p>

                <div className="mt-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white tabular-nums">
                      {billingCycle === 'monthly' ? '₦2,500' : '₦1,850'}
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      / month {billingCycle === 'yearly' && '(billed annually)'}
                    </span>
                  </div>
                </div>

                <ul className="mt-5 space-y-2.5 text-xs text-neutral-700 dark:text-neutral-200">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="font-medium">Unlimited multiple exams (e.g. JAMB + WAEC + Post-UTME)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Advanced Smart Study Engine with automatic weak-topic boosting</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Automated missed session redistribution & balanced recovery</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Detailed syllabus mastery analytics & score distribution charts</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Spaced repetition revision intervals (2, 5, 12-day schedules)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Ready for upcoming CBT test questions integration</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 sm:mt-8 space-y-2">
                <button
                  onClick={() => handleSelectTier('premium')}
                  className={`w-full py-2.5 text-xs font-semibold rounded-xl transition-colors ${
                    userProfile.tier === 'premium'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  }`}
                >
                  {userProfile.tier === 'premium' ? 'Currently Subscribed' : 'Upgrade to Premium'}
                </button>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 dark:text-neutral-500">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Mock checkout mode · Ready for Paystack / Flutterwave</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 bg-neutral-50 dark:bg-neutral-800/40 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 shrink-0">
          <span>Cancel or switch anytime without lock-in.</span>
          <button onClick={onClose} className="hover:text-neutral-800 dark:hover:text-neutral-200">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
