import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';
import { loveReasons } from '../data/loveReasons';

export default function LoveReasons() {
  return (
    <section className="relative w-full max-w-6xl mx-auto py-16 px-4 sm:px-6">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 text-rose-700 text-xs font-semibold uppercase tracking-wider mb-2 border border-rose-200 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-rose-500" />
          <span>19 Reasons For 19 Days</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3">
          19 Things I Love About You ❤️
        </h2>
        <p className="text-gray-600 text-sm sm:text-base max-w-lg mx-auto">
          Out of a million reasons why my heart beats for you, here are nineteen of my favorites.
        </p>
      </div>

      {/* Grid of 19 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loveReasons.map((reason, index) => (
          <motion.div
            key={reason.number}
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ delay: (index % 6) * 0.08, duration: 0.5 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="group relative rounded-3xl p-6 bg-white/90 border border-rose-200/90 hover:border-rose-400 shadow-romantic backdrop-blur-md transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            {/* Subtle background glow */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-rose-200/40 rounded-full blur-xl group-hover:bg-rose-300/40 transition-all pointer-events-none" />

            <div>
              {/* Card Header: Number and Heart */}
              <div className="flex items-center justify-between mb-4">
                <span className="font-serif text-2xl font-bold text-rose-600 group-hover:text-rose-700 transition-colors">
                  {reason.number}
                </span>
                <Heart className="w-4 h-4 text-rose-400/80 group-hover:text-rose-500 group-hover:fill-rose-500 transition-all" />
              </div>

              {/* Title */}
              <h3 className="font-serif text-lg font-bold text-gray-900 mb-2 group-hover:text-rose-800 transition-colors">
                {reason.title}
              </h3>

              {/* Text */}
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-light">
                {reason.text}
              </p>
            </div>

            {/* Bottom Accent */}
            <div className="pt-4 mt-4 border-t border-rose-100 flex items-center justify-between text-[11px] text-rose-600">
              <span className="font-script text-base text-rose-600 font-medium">With all my love</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
