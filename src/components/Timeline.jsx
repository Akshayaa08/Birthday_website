import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Sparkles, Cake, Lock, ArrowRight } from 'lucide-react';
import DayCard from './DayCard';
import { getDayStatus, isBirthdayAvailable, formatReadableDate } from '../utils/dateUtils';
import { config } from '../data/config';
import { useNavigate } from 'react-router-dom';

export default function Timeline({ daysList, onSelectDay }) {
  const navigate = useNavigate();
  const birthdayUnlocked = isBirthdayAvailable();

  return (
    <div className="relative w-full max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Central Line for Desktop, Left-aligned Line for Mobile */}
      <div className="absolute top-0 bottom-32 left-8 md:left-1/2 -ml-px w-0.5 bg-gradient-to-b from-rose-200 via-rose-300 to-rose-400" />

      {/* Render 18 Days */}
      <div className="space-y-8 md:space-y-16">
        {daysList.map((dayItem, index) => {
          const isLeft = index % 2 === 0;
          const status = getDayStatus(dayItem.date);
          const isAvailable = status === 'AVAILABLE';
          const isCompleted = status === 'COMPLETED';

          return (
            <div
              key={dayItem.day}
              className={`relative flex items-center md:justify-between ${
                isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
              } flex-row`}
            >
              {/* Timeline Center Node / Dot */}
              <div className="absolute left-8 md:left-1/2 -translate-x-1/2 flex items-center justify-center z-20">
                <motion.div
                  whileHover={{ scale: 1.25 }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-md ${
                    isAvailable
                      ? 'bg-rose-500 border-white text-white shadow-rose-400/50 animate-pulse'
                      : isCompleted
                      ? 'bg-rose-100 border-rose-300 text-rose-600'
                      : 'bg-white border-rose-200 text-rose-300'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isAvailable
                        ? 'fill-white text-white'
                        : isCompleted
                        ? 'fill-rose-500 text-rose-500'
                        : 'text-rose-300'
                    }`}
                  />
                </motion.div>
              </div>

              {/* Card Container: Half-width on Desktop, Full-width shifted right on Mobile */}
              <div
                className={`w-full pl-16 md:pl-0 ${
                  isLeft ? 'md:pr-12 md:text-right' : 'md:pl-12 md:text-left'
                } md:w-[46%]`}
              >
                <DayCard
                  dayData={dayItem}
                  status={status}
                  onClick={onSelectDay}
                  isLeft={isLeft}
                />
              </div>

              {/* Empty spacer for alternating balance on Desktop */}
              <div className="hidden md:block md:w-[46%]" />
            </div>
          );
        })}
      </div>

      {/* Grand Birthday Milestone Card (October 19 Finale) */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative mt-20 pt-10 text-center"
      >
        {/* Connector from timeline */}
        <div className="mx-auto w-1 h-12 bg-gradient-to-b from-rose-300 to-rose-500 mb-4" />

        <div className="relative max-w-xl mx-auto">
          {birthdayUnlocked && (
            <div className="absolute -inset-1.5 bg-gradient-to-r from-rose-500 via-amber-400 to-pink-500 rounded-3xl blur-lg opacity-80 animate-pulse" />
          )}

          <div
            onClick={() => {
              if (birthdayUnlocked) {
                navigate('/birthday');
              } else {
                onSelectDay(
                  {
                    day: 19,
                    date: config.birthday,
                    title: "The Grand Birthday Finale",
                    subtitle: "All 19 days culminate in this magical moment.",
                  },
                  'LOCKED'
                );
              }
            }}
            className={`relative rounded-3xl p-6 sm:p-8 cursor-pointer transition-all duration-300 overflow-hidden ${
              birthdayUnlocked
                ? 'bg-gradient-to-br from-rose-900 via-burgundy-deep to-rose-950 text-white shadow-2xl hover:scale-[1.02]'
                : 'bg-white/90 border-2 border-dashed border-rose-300 shadow-romantic hover:border-rose-400'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className={`w-5 h-5 ${birthdayUnlocked ? 'text-amber-300' : 'text-rose-400'}`} />
              <span className={`text-xs uppercase tracking-widest font-bold ${
                birthdayUnlocked ? 'text-amber-300' : 'text-rose-600'
              }`}>
                GRAND FINALE • OCTOBER 19, 2026
              </span>
              <Sparkles className={`w-5 h-5 ${birthdayUnlocked ? 'text-amber-300' : 'text-rose-400'}`} />
            </div>

            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-rose-500/20 border border-rose-300/40">
              <Cake className={`w-8 h-8 ${birthdayUnlocked ? 'text-amber-300' : 'text-rose-500'}`} />
            </div>

            <h3 className={`font-serif text-2xl sm:text-3xl font-bold mb-2 ${
              birthdayUnlocked ? 'text-rose-100' : 'text-gray-900'
            }`}>
              {birthdayUnlocked ? "IT'S FINALLY HERE! 🎉" : "The 19th Surprise: His Birthday ❤️"}
            </h3>

            <p className={`text-xs sm:text-sm max-w-md mx-auto mb-6 ${
              birthdayUnlocked ? 'text-rose-200' : 'text-gray-600'
            }`}>
              {birthdayUnlocked
                ? "Happy Birthday, my love! Click here to step into your dedicated celebration world."
                : "A completely different birthday universe awaits him on October 19th. Keepsake memories, 19 love letters, and all reaction videos."}
            </p>

            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all shadow-md ${
              birthdayUnlocked
                ? 'bg-gradient-to-r from-amber-400 to-rose-400 text-gray-900 hover:from-amber-300 hover:to-rose-300'
                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
            }">
              {birthdayUnlocked ? (
                <>
                  <span>Enter Birthday Experience</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-rose-500" />
                  <span>Locked Until October 19</span>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
