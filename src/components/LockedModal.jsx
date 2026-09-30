import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Lock, Calendar, Sparkles, X } from 'lucide-react';
import { formatReadableDate } from '../utils/dateUtils';

export default function LockedModal({ isOpen, onClose, dayData }) {
  if (!isOpen || !dayData) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-rose-950/40 backdrop-blur-sm"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 text-center shadow-2xl border border-rose-200/80 z-10 overflow-hidden"
        >
          {/* Decorative ambient glow */}
          <div className="absolute -top-16 -right-16 w-32 h-32 bg-rose-200/50 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-pink-200/50 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-rose-50 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Animated Heart Icon */}
          <div className="relative mx-auto w-20 h-20 mb-5 flex items-center justify-center">
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center shadow-inner"
            >
              <Heart className="w-9 h-9 text-rose-500 fill-rose-400/30" />
            </motion.div>
            <div className="absolute top-1 right-2">
              <Lock className="w-4 h-4 text-rose-600 bg-white rounded-full p-0.5 shadow-sm" />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              className="absolute -top-1 -left-1 text-amber-400"
            >
              <Sparkles className="w-4 h-4" />
            </motion.div>
          </div>

          {/* Content */}
          <span className="text-xs uppercase tracking-wider font-semibold text-rose-500 block mb-1">
            Day {dayData.day < 10 ? `0${dayData.day}` : dayData.day} • {formatReadableDate(dayData.date, true)}
          </span>

          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Not yet, my love ❤️
          </h3>

          <p className="text-rose-900/80 font-medium text-sm sm:text-base mb-1">
            This little surprise is waiting for you.
          </p>

          <div className="my-4 py-2.5 px-4 bg-rose-50/80 border border-rose-200/60 rounded-2xl inline-flex items-center gap-2 text-rose-700 text-xs sm:text-sm">
            <Calendar className="w-4 h-4 text-rose-500" />
            <span>Come back on <strong className="font-semibold">{formatReadableDate(dayData.date)}</strong></span>
          </div>

          <p className="text-xs text-gray-500 mb-6 italic">
            "Patience makes the sweetest moments even more magical."
          </p>

          {/* Button */}
          <button
            onClick={onClose}
            type="button"
            className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-medium text-sm sm:text-base shadow-romantic hover:shadow-romantic-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>Okay, I'll wait</span>
            <Heart className="w-4 h-4 fill-white" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
