import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Heart, Calendar } from 'lucide-react';
import { days } from '../data/days';
import { config } from '../data/config';
import { getDayStatus, getTodayDateString } from '../utils/dateUtils';
import Timeline from '../components/Timeline';
import LockedModal from '../components/LockedModal';
import FloatingHearts from '../components/FloatingHearts';
import DevBanner from '../components/DevBanner';

export default function Journey() {
  const navigate = useNavigate();
  const [selectedLockedDay, setSelectedLockedDay] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSimulatedDate, setCurrentSimulatedDate] = useState(() => getTodayDateString());

  // Count how many days are unlocked or completed
  const unlockedCount = days.filter((d) => {
    const s = getDayStatus(d.date);
    return s === 'AVAILABLE' || s === 'COMPLETED';
  }).length;

  const handleSelectDay = (dayItem, status) => {
    if (status === 'LOCKED') {
      setSelectedLockedDay(dayItem);
      setIsModalOpen(true);
    } else {
      // Unlocked or completed: go to daily surprise page
      navigate(`/day/${dayItem.day}`);
    }
  };

  const handleDateChange = (newDate) => {
    setCurrentSimulatedDate(newDate);
  };

  return (
    <div className="relative min-h-screen romantic-bg overflow-x-hidden pb-20">
      {/* Floating background hearts */}
      <FloatingHearts count={16} />

      {/* Top Navigation */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-rose-200/80 text-rose-800 text-xs sm:text-sm font-medium hover:bg-rose-50 transition-colors shadow-sm backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Countdown</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="font-serif text-rose-900 font-semibold text-base sm:text-lg">
            19 Days of Us ❤️
          </span>
        </div>
      </header>

      {/* Journey Header Hero */}
      <div className="relative z-10 max-w-3xl mx-auto text-center px-4 pt-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-rose-200/70 text-rose-800 text-xs font-medium mb-4 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-rose-500" />
          <span>October 1 – October 18 Daily Surprises</span>
          <Sparkles className="w-3.5 h-3.5 text-rose-500" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-3"
        >
          Every Day, A Little Piece of My Heart
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto mb-6"
        >
          Each day unveils a private video made just for you, {config.boyfriendName}. Come back each morning to unlock that day's surprise.
        </motion.p>

        {/* Progress summary bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl glass-panel text-xs sm:text-sm text-gray-700 shadow-sm border border-rose-200/80"
        >
          <div className="flex items-center gap-1.5 text-rose-600 font-semibold">
            <Heart className="w-4 h-4 fill-rose-500" />
            <span>Progress:</span>
          </div>
          <span>
            <strong className="text-rose-700">{unlockedCount}</strong> of 18 surprises unlocked
          </span>
          <div className="w-20 bg-rose-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.round((unlockedCount / 18) * 100)}%` }}
            />
          </div>
        </motion.div>
      </div>

      {/* Alternating Zig-Zag Timeline */}
      <Timeline daysList={days} onSelectDay={handleSelectDay} />

      {/* Locked Modal Dialog */}
      <LockedModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dayData={selectedLockedDay}
      />

      {/* Developer Date Switcher for Testing */}
      <DevBanner onDateChange={handleDateChange} />
    </div>
  );
}
