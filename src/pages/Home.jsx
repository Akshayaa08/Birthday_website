import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Sparkles, Calendar, ChevronRight, Lock } from 'lucide-react';
import { config } from '../data/config';
import { isJourneyStarted, getTodayDateString } from '../utils/dateUtils';
import Countdown from '../components/Countdown';
import FloatingHearts from '../components/FloatingHearts';
import DevBanner from '../components/DevBanner';

export default function Home() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(() => getTodayDateString());
  const journeyBegun = isJourneyStarted();

  const handleDateChange = (newDate) => {
    setCurrentDate(newDate);
  };

  return (
    <div className="relative min-h-screen romantic-bg overflow-hidden flex flex-col justify-between">
      {/* Background Floating Hearts */}
      <FloatingHearts count={18} />

      {/* Ambient Lighting Spheres */}
      <div className="ambient-glow bg-rose-200/50 -top-32 -left-32" />
      <div className="ambient-glow bg-pink-100/60 top-1/2 -right-32" />
      <div className="ambient-glow bg-amber-100/40 bottom-0 left-1/3" />

      {/* Navigation / Header Bar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <div className="w-9 h-9 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-300/40">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500/20" />
          </div>
          <span className="font-serif tracking-wide text-rose-900 font-semibold text-lg md:text-xl">
            19 Days of Us
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden sm:flex items-center gap-1.5 text-xs text-rose-800/80 bg-rose-50/80 px-3.5 py-1.5 rounded-full border border-rose-200/60 backdrop-blur-sm"
        >
          <Calendar className="w-3.5 h-3.5 text-rose-500" />
          <span>October 1 – 19, 2026</span>
        </motion.div>
      </header>

      {/* Main Hero Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-12 max-w-4xl mx-auto text-center">
        {/* Sweet intro badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 border border-rose-200/70 shadow-sm mb-6 backdrop-blur-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-rose-500" />
          <span className="text-xs md:text-sm font-medium text-rose-800">
            A romantic birthday surprise for {config.boyfriendName}
          </span>
          <Sparkles className="w-3.5 h-3.5 text-rose-500" />
        </motion.div>

        {/* Romantic Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold text-gray-900 tracking-tight leading-tight mb-4"
        >
          {config.homeHeading || "Something special is waiting for you... ❤️"}
        </motion.h1>

        {/* Emotional Subtitle Quotes & Journey Story (Editable from config) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-2 mb-8 text-gray-700 max-w-xl mx-auto"
        >
          <p className="text-sm sm:text-base font-medium text-rose-900/90">
            {config.homeSubheading1 || "Starting October 1, a little surprise will be waiting for you every day."}
          </p>
          <div className="font-serif text-base sm:text-lg text-rose-800 font-semibold italic space-y-0.5">
            {config.homeJourneyBullets ? (
              config.homeJourneyBullets.map((bullet, idx) => (
                <p key={idx}>{bullet}</p>
              ))
            ) : (
              <>
                <p>18 little surprises.</p>
                <p>18 little moments.</p>
                <p>1 very special birthday.</p>
              </>
            )}
          </div>
          <p className="text-sm sm:text-base text-rose-950 font-bold flex items-center justify-center gap-1.5 pt-1">
            <span>{config.homeJourneyConclusion || "And it all leads to October 19. ❤️"}</span>
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500 inline" />
          </p>
        </motion.div>

        {/* Visual Journey Bar: October 1 ─────────────── October 19 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="w-full max-w-md mx-auto mb-8 bg-white/80 backdrop-blur-sm border border-rose-200/90 rounded-2xl p-4 shadow-sm"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-rose-900 mb-2">
            <div className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span className="font-serif tracking-wide">Our Little Journey ❤️</span>
            </div>
            <span className="text-[11px] text-rose-600 font-mono font-medium">October 1 – October 19</span>
          </div>

          {/* Progress Connector */}
          <div className="relative flex items-center justify-between px-2 pt-1 pb-1">
            <div className="absolute left-6 right-6 top-4 h-1 bg-gradient-to-r from-rose-400 via-pink-400 to-rose-500 rounded-full" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-5 h-5 rounded-full bg-rose-500 border-2 border-white shadow-sm flex items-center justify-center text-white text-[9px] font-bold">
                1
              </div>
              <span className="text-[11px] font-bold text-gray-800 mt-1">Oct 1</span>
              <span className="text-[10px] text-rose-700 uppercase tracking-wider font-semibold">Start</span>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-3.5 h-3.5 rounded-full bg-pink-300 border-2 border-white shadow-sm" />
              <span className="text-[10px] text-rose-600 font-medium mt-2">18 Surprises</span>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-5 h-5 rounded-full bg-rose-600 border-2 border-white shadow-sm ring-2 ring-rose-300 flex items-center justify-center text-white text-[9px] font-bold">
                🎂
              </div>
              <span className="text-[11px] font-bold text-gray-800 mt-1">Oct 19</span>
              <span className="text-[10px] text-rose-600 uppercase tracking-wider font-bold">Birthday ❤️</span>
            </div>
          </div>
        </motion.div>

        {/* Live Countdown to October 19 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="w-full mb-10 md:mb-12"
        >
          <Countdown targetDate={config.birthday} />
        </motion.div>

        {/* Call to Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <button
            onClick={() => navigate('/journey')}
            type="button"
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 text-base md:text-lg font-semibold text-white bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 rounded-full shadow-romantic-lg hover:shadow-romantic-glow transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-2">
              <span>I'm Ready</span>
              <Heart className="w-5 h-5 text-white fill-white group-hover:scale-125 transition-transform" />
            </span>
            <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
          </button>

          {!journeyBegun && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white/60 px-3.5 py-2 rounded-full border border-rose-100">
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>Surprises unlock one by one starting Oct 1</span>
            </div>
          )}
        </motion.div>
      </main>

      {/* Romantic Footer */}
      <footer className="relative z-10 w-full py-6 text-center text-xs text-rose-900/60 font-light border-t border-rose-100/60">
        <p>
          Crafted with all my love for {config.boyfriendName} • Every second counts ❤️
        </p>
      </footer>

      {/* Dev Mode Simulated Date Switcher */}
      <DevBanner onDateChange={handleDateChange} />
    </div>
  );
}
