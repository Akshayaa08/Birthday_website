import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, CheckCircle2, Heart, Sparkles, ArrowRight } from 'lucide-react';
import { formatReadableDate } from '../utils/dateUtils';

export default function DayCard({ dayData, status, onClick, isLeft = true }) {
  const isLocked = status === 'LOCKED';
  const isAvailable = status === 'AVAILABLE';
  const isCompleted = status === 'COMPLETED';

  const dayNumberFormatted = dayData.day < 10 ? `0${dayData.day}` : `${dayData.day}`;
  const shortDate = formatReadableDate(dayData.date, true);

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      onClick={() => onClick(dayData, status)}
      className={`group relative w-full cursor-pointer transition-all duration-300 ${
        isAvailable ? 'z-20' : 'z-10'
      }`}
    >
      {/* Outer Romantic Glow for Available Day */}
      {isAvailable && (
        <div className="absolute -inset-1 bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 rounded-3xl blur-md opacity-70 group-hover:opacity-100 animate-pulse transition duration-500" />
      )}

      {/* Main Card Container */}
      <div
        className={`relative rounded-3xl p-5 sm:p-6 transition-all duration-300 overflow-hidden ${
          isAvailable
            ? 'bg-white/95 border-2 border-rose-400 shadow-romantic-lg'
            : isCompleted
            ? 'bg-white/85 border border-rose-200/90 shadow-romantic hover:border-rose-300'
            : 'bg-white/55 border border-rose-100/70 shadow-sm opacity-85 hover:opacity-100 backdrop-blur-md'
        }`}
      >
        {/* Subtle decorative background watermark */}
        <div className="absolute -right-4 -bottom-6 pointer-events-none opacity-5 text-gray-900 select-none font-serif text-8xl font-black">
          {dayNumberFormatted}
        </div>

        {/* Top Header: Day Number & Status Badge */}
        <div className="flex items-center justify-between gap-3 mb-3">
          {/* Day & Date Tag */}
          <div className="flex items-center gap-2">
            <span
              className={`font-serif text-2xl sm:text-3xl font-bold tracking-tight ${
                isAvailable
                  ? 'text-rose-600'
                  : isCompleted
                  ? 'text-rose-900/90'
                  : 'text-gray-400'
              }`}
            >
              {dayNumberFormatted}
            </span>
            <div className="h-4 w-px bg-rose-200" />
            <span className="text-xs uppercase tracking-wider font-semibold text-rose-700/80">
              {shortDate}
            </span>
          </div>

          {/* Status Badge */}
          {isAvailable && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500 text-white shadow-sm animate-pulse-subtle">
              <Unlock className="w-3.5 h-3.5" />
              <span>OPEN</span>
            </span>
          )}

          {isCompleted && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>COMPLETED</span>
            </span>
          )}

          {isLocked && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200/80">
              <Lock className="w-3 h-3 text-gray-400" />
              <span>LOCKED</span>
            </span>
          )}
        </div>

        {/* Title & Subtitle */}
        <div className="mb-4">
          <h4
            className={`font-serif text-lg sm:text-xl font-bold mb-1 line-clamp-1 ${
              isLocked ? 'text-gray-500 font-medium' : 'text-gray-900'
            }`}
          >
            {isLocked ? 'Not Yet, My Love ❤️' : dayData.title}
          </h4>
          <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">
            {isLocked ? 'This surprise is tucked away until its date.' : dayData.subtitle}
          </p>
        </div>

        {/* Card Footer / Action indicator */}
        <div className="pt-2 border-t border-rose-100/70 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-rose-400">
            <Heart
              className={`w-3.5 h-3.5 ${
                isAvailable || isCompleted ? 'fill-rose-400 text-rose-500' : 'text-gray-300'
              }`}
            />
            <span className="font-script text-base text-rose-600/90">
              {isAvailable ? "Today's Surprise" : isCompleted ? 'Watched With Love' : 'Locked'}
            </span>
          </div>

          <div
            className={`flex items-center gap-1 font-medium transition-transform group-hover:translate-x-1 ${
              isAvailable
                ? 'text-rose-600 font-semibold'
                : isCompleted
                ? 'text-gray-600'
                : 'text-gray-400'
            }`}
          >
            <span>{isLocked ? 'Unlock Date' : 'Watch Video'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
