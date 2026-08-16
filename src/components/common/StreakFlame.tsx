import React from 'react';
import { Flame } from 'lucide-react';

export const StreakFlame: React.FC<{ streakDays: number; size?: 'sm' | 'md' | 'lg' }> = ({
  streakDays,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3.5 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  return (
    <div
      className={`inline-flex items-center rounded-full font-bold bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-400 shadow-xs ${sizeClasses[size]}`}
      title={`${streakDays} Day Study Streak`}
    >
      <Flame
        size={iconSizes[size]}
        className="text-amber-500 fill-amber-500"
      />
      <span className="font-mono tracking-tight font-semibold">{streakDays}d Streak</span>
    </div>
  );
};
