import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ZoomIn, X, Camera } from 'lucide-react';
import { memories } from '../data/memories';

export default function MemoryGallery() {
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  return (
    <section className="relative w-full max-w-6xl mx-auto py-12 px-4 sm:px-6">
      {/* Section Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 text-rose-700 text-xs font-semibold uppercase tracking-wider mb-2 border border-rose-200 shadow-sm">
          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
          <span>Keepsake Moments</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3">
          Our Little World ❤️
        </h2>
        <p className="text-gray-600 text-sm sm:text-base max-w-lg mx-auto">
          Every snapshot holds a quiet whisper of how much you mean to me.
        </p>
      </div>

      {/* Responsive Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {memories.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.08, duration: 0.5 }}
            whileHover={{ y: -6 }}
            onClick={() => setSelectedPhoto(item)}
            className="group relative cursor-pointer rounded-3xl overflow-hidden bg-white/90 border border-rose-200/90 shadow-romantic backdrop-blur-sm"
          >
            {/* Aspect container with image or aesthetic fallback */}
            <div className="aspect-[4/3] w-full overflow-hidden bg-rose-50 relative">
              <img
                src={item.image}
                alt={item.caption}
                onError={(e) => {
                  // Fallback if user hasn't added photo file yet
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />

              {/* Romantic Placeholder Fallback */}
              <div
                style={{ display: 'none' }}
                className="w-full h-full flex-col items-center justify-center p-6 text-center bg-rose-100/60"
              >
                <div className="w-12 h-12 rounded-full bg-rose-200/80 border border-rose-300 flex items-center justify-center text-rose-600 mb-2">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-xs text-rose-800 font-medium">Memory #{item.id}</span>
                <span className="text-[11px] text-rose-500 mt-1 font-mono">{item.image}</span>
              </div>

              {/* Hover overlay with zoom icon */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                <span className="text-xs font-script text-amber-300 text-lg">{item.date}</span>
                <p className="text-white text-xs sm:text-sm font-medium line-clamp-2">
                  {item.caption}
                </p>
                <div className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white backdrop-blur-md">
                  <ZoomIn className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Bottom Caption Bar */}
            <div className="p-4 bg-white/95">
              <p className="text-gray-800 text-xs sm:text-sm font-medium line-clamp-1">
                {item.caption}
              </p>
              <span className="text-[11px] text-rose-600 font-mono block mt-0.5">{item.date}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Fullscreen Photo Lightbox Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPhoto(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-3xl w-full bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-rose-500/40 z-10"
            >
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                aria-label="Close photo preview"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="max-h-[70vh] bg-black flex items-center justify-center overflow-hidden">
                <img
                  src={selectedPhoto.image}
                  alt={selectedPhoto.caption}
                  className="max-h-[70vh] w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              <div className="p-6 bg-gray-950 text-white">
                <span className="text-xs text-amber-300 font-script text-xl block mb-1">
                  {selectedPhoto.date}
                </span>
                <p className="text-sm sm:text-base text-rose-100 font-medium">
                  {selectedPhoto.caption}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
