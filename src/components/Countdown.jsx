import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateTimeRemaining } from '../utils/dateUtils';
import { Sparkles, Heart } from 'lucide-react';
import { config } from '../data/config';

export default function Countdown({ targetDate = config.birthday, onComplete }) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeRemaining(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining(targetDate);
      setTimeLeft(remaining);
      if (remaining.isExpired && onComplete) {
        onComplete();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  const timeUnits = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  if (timeLeft.isExpired) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel px-8 py-6 rounded-3xl text-center shadow-romantic max-w-lg mx-auto border border-rose-200/90"
      >
        <div className="flex items-center justify-center gap-2 text-rose-500 mb-2">
          <Sparkles className="w-5 h-5 text-rose-400 animate-spin" />
          <span className="font-script text-2xl text-rose-600">The Moment Has Arrived</span>
          <Sparkles className="w-5 h-5 text-rose-400 animate-spin" />
        </div>
        <h3 className="font-serif text-2xl md:text-3xl text-gray-900 font-bold mb-2">
          Happy Birthday, {config.boyfriendName}! ❤️
        </h3>
        <p className="text-gray-600 text-sm md:text-base">
          Today is October 19th! Your grand birthday celebration is fully unlocked.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* 19 Days, 18 Surprises, 1 Birthday Headline */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-5"
      >
        <p className="font-serif text-base sm:text-lg md:text-xl font-semibold text-rose-900/90 tracking-wide">
          {config.countdownHighlight || "19 Days. 18 Little Surprises. 1 Very Special Birthday. ❤️"}
        </p>
        <h2 className="text-xs sm:text-sm font-bold tracking-widest uppercase text-rose-600/90 mt-1 flex items-center justify-center gap-2">
          <span className="w-6 h-px bg-rose-300"></span>
          <span>{config.countdownHeading || "HAPPY BIRTHDAY COUNTDOWN"}</span>
          <span className="w-6 h-px bg-rose-300"></span>
        </h2>
      </motion.div>

      {/* Countdown Card Grid */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4 md:gap-6">
        {timeUnits.map((unit, index) => (
          <motion.div
            key={unit.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
            className="group relative"
          >
            {/* Soft baby pink background glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-b from-rose-300/40 to-pink-200/40 rounded-2xl md:rounded-3xl blur-sm opacity-60 group-hover:opacity-90 transition duration-500" />

            {/* Main white card container for high contrast against baby pink */}
            <div className="relative glass-panel rounded-2xl md:rounded-3xl p-3 sm:p-5 md:p-6 text-center shadow-romantic transition-transform duration-300 hover:-translate-y-1">
              {/* Little decorative heart */}
              <div className="flex justify-center mb-1">
                <Heart className="w-3 h-3 md:w-3.5 md:h-3.5 text-rose-400 fill-rose-200 group-hover:scale-110 transition-transform" />
              </div>

              {/* Number with animated transition */}
              <div className="overflow-hidden h-10 sm:h-12 md:h-16 flex items-center justify-center">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={unit.value}
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -15, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900"
                  >
                    {String(unit.value).padStart(2, '0')}
                  </motion.span>
                </AnimatePresence>
              </div>

              {/* Label */}
              <span className="block text-[10px] sm:text-xs md:text-sm uppercase tracking-wider font-semibold text-rose-600/90 mt-1">
                {unit.label}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Target date indicator with Asia/Kolkata timezone */}
      <div className="text-center mt-4 space-y-1">
        <span className="text-xs md:text-sm font-script text-rose-600 text-lg block">
          {config.countdownSubtext || "Counting down every heartbeat until October 19th... ✨"}
        </span>
        <span className="text-[11px] text-rose-900/60 font-mono tracking-wider">
          Target: October 19, 2026 • Timezone: Asia/Kolkata
        </span>
      </div>
    </div>
  );
}
