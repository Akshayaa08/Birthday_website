import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Play, Film, X, AlertCircle, Sparkles } from 'lucide-react';
import { days } from '../data/days';
import { fetchAllReactions } from '../services/reactionService';
import { API_BASE } from '../services/api';
import { formatReadableDate } from '../utils/dateUtils';

export default function ReactionGallery() {
  const [reactionsMap, setReactionsMap] = useState({});
  const [activeVideo, setActiveVideo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadReactions() {
      setIsLoading(true);
      try {
        const list = await fetchAllReactions();
        const map = {};
        if (Array.isArray(list)) {
          list.forEach((r) => {
            map[Number(r.dayNumber)] = r;
          });
        }
        setReactionsMap(map);
      } catch (err) {
        console.warn('Error loading reactions gallery:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadReactions();
  }, []);

  return (
    <section className="relative w-full max-w-6xl mx-auto py-16 px-4 sm:px-6">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 text-rose-700 text-xs font-semibold uppercase tracking-wider mb-2 border border-rose-200 shadow-sm">
          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
          <span>Keepsake Reactions</span>
        </div>

        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2">
          And now... my favorite part ❤️
        </h2>

        <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto">
          A collection of all your genuine reactions throughout our 18 days.
        </p>
      </div>

      {/* Grid of 18 Days */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {days.map((dayItem) => {
          const reaction = reactionsMap[dayItem.day];
          const isCompleted = Boolean(
            reaction &&
            reaction.status === 'completed' &&
            reaction.sessionId
          );
          const isIncomplete = Boolean(
            reaction &&
            reaction.status === 'incomplete' &&
            !isCompleted
          );

          return (
            <motion.div
              key={dayItem.day}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (dayItem.day % 6) * 0.05, duration: 0.4 }}
              className="relative rounded-3xl p-5 bg-white/90 border border-rose-200/90 shadow-romantic backdrop-blur-md flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-xl font-bold text-rose-600">
                      Day {dayItem.day} ❤️
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-mono">
                    {formatReadableDate(dayItem.date, true)}
                  </span>
                </div>

                <p className="text-xs text-gray-800 font-medium mb-3 line-clamp-1">
                  {dayItem.title}
                </p>

                {/* Video Preview or Fallback Placeholder */}
                {isCompleted ? (
                  <div
                    onClick={() => setActiveVideo(reaction)}
                    className="group relative aspect-video w-full rounded-2xl overflow-hidden bg-black cursor-pointer border border-rose-300 shadow-inner flex items-center justify-center"
                  >
                    <video
                      src={`${API_BASE}/api/reactions/${encodeURIComponent(reaction.sessionId)}/video`}
                      crossOrigin="use-credentials"
                      className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
                      muted
                      preload="metadata"
                    />
                    <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-rose-500/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-white translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                ) : isIncomplete ? (
                  <div className="aspect-video w-full rounded-2xl bg-amber-50/80 border border-dashed border-amber-300 flex flex-col items-center justify-center p-4 text-center">
                    <AlertCircle className="w-6 h-6 text-amber-500 mb-1.5" />
                    <p className="text-[11px] text-amber-800 font-medium leading-snug">
                      Reaction recording incomplete
                    </p>
                    <span className="text-[10px] text-amber-600/80 mt-0.5">
                      Session interrupted or left early
                    </span>
                  </div>
                ) : (
                  <div className="aspect-video w-full rounded-2xl bg-rose-50/70 border border-dashed border-rose-200 flex flex-col items-center justify-center p-4 text-center">
                    <Film className="w-6 h-6 text-rose-400 mb-1.5" />
                    <p className="text-[11px] text-gray-500 leading-snug">
                      No reaction video was recorded for this day.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer status */}
              <div className="mt-4 pt-3 border-t border-rose-100 flex items-center justify-between text-[11px]">
                <span className="text-gray-500">
                  {isCompleted
                    ? 'Recorded with love'
                    : isIncomplete
                    ? 'Partially saved'
                    : 'Watched privately'}
                </span>
                {isCompleted && (
                  <button
                    onClick={() => setActiveVideo(reaction)}
                    className="text-rose-600 hover:text-rose-700 font-semibold inline-flex items-center gap-1"
                  >
                    <span>Play reaction</span>
                    <Play className="w-3 h-3 fill-rose-600" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Video Lightbox Player Modal */}
      <AnimatePresence>
        {activeVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveVideo(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-2xl w-full bg-gray-950 rounded-3xl overflow-hidden shadow-2xl border border-rose-500/50 z-10"
            >
              <div className="p-4 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <span className="font-serif text-white font-bold text-base">
                    Day {activeVideo.dayNumber} Reaction Video ❤️
                  </span>
                </div>
                <button
                  onClick={() => setActiveVideo(null)}
                  className="p-1 rounded-full text-gray-400 hover:text-white"
                  aria-label="Close reaction video"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="aspect-video w-full bg-black">
                <video
                  src={`${API_BASE}/api/reactions/${encodeURIComponent(activeVideo.sessionId)}/video`}
                  crossOrigin="use-credentials"
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="p-4 text-center text-xs text-rose-200/80">
                A keepsake memory from {activeVideo.date}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
