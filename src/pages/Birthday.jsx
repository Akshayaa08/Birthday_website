import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Sparkles,
  Cake,
  Play,
  ArrowLeft,
  Lock,
  Gift,
  Star,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { config } from '../data/config';
import { isBirthdayAvailable, formatReadableDate } from '../utils/dateUtils';
import FloatingHearts from '../components/FloatingHearts';
import MemoryGallery from '../components/MemoryGallery';
import LoveReasons from '../components/LoveReasons';
import ReactionGallery from '../components/ReactionGallery';
import VideoPlayer from '../components/VideoPlayer';
import SessionActions from '../components/SessionActions';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE, apiFetch } from '../services/api';

export default function Birthday() {
  const navigate = useNavigate();
  const { user, ownerTestDate } = useAuth();
  const isUnlocked = isBirthdayAvailable(ownerTestDate);
  const [isPlayingGrandVideo, setIsPlayingGrandVideo] = useState(false);
  const [birthdayVideo, setBirthdayVideo] = useState({
    loading: true,
    available: false,
    videoUrl: null,
    error: '',
  });

  useEffect(() => {
    if (!isUnlocked) return undefined;
    let active = true;
    setBirthdayVideo({ loading: true, available: false, videoUrl: null, error: '' });
    apiFetch('/api/videos/19/details')
      .then((result) => {
        if (!active) return;
        setBirthdayVideo({
          loading: false,
          available: result.available === true && typeof result.videoUrl === 'string',
          videoUrl: typeof result.videoUrl === 'string' ? result.videoUrl : null,
          error: '',
        });
      })
      .catch((error) => {
        if (!active) return;
        setBirthdayVideo({
          loading: false,
          available: false,
          videoUrl: null,
          error: error.message || 'Could not check the birthday video.',
        });
      });
    return () => {
      active = false;
    };
  }, [isUnlocked]);

  // Trigger celebration confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f43f5e', '#ec4899', '#fbbf24', '#f472b6', '#ffffff'],
    });
  };

  // If locked (before October 19)
  if (!isUnlocked) {
    return (
      <div className="min-h-screen romantic-bg flex items-center justify-center p-6 text-center text-gray-900">
        <FloatingHearts count={10} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-8 sm:p-10 rounded-3xl max-w-md mx-auto shadow-2xl relative z-10 border border-rose-200"
        >
          <div className="w-16 h-16 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center mx-auto mb-4 text-rose-600">
            <Lock className="w-8 h-8" />
          </div>

          <span className="text-xs uppercase tracking-widest font-bold text-rose-600 mb-1 block">
            October 19, 2026 • Grand Finale
          </span>

          <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2">
            Not yet, my love ❤️
          </h2>

          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            The grand birthday celebration opens on his actual birthday,{' '}
            <strong className="text-rose-600 font-semibold">{formatReadableDate(config.birthday)}</strong>.
            Enjoy today's daily surprise first!
          </p>

          <button
            onClick={() => navigate('/journey')}
            className="w-full py-3 px-6 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium text-sm shadow-romantic transition-transform hover:scale-105"
          >
            Back to Journey Timeline
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen romantic-bg text-gray-900 overflow-x-hidden selection:bg-rose-500 selection:text-white">
      {/* Background Floating Hearts */}
      <FloatingHearts count={20} />

      {/* Ambient Lighting Spheres */}
      <div className="ambient-glow bg-rose-200/50 -top-40 -left-40" />
      <div className="ambient-glow bg-amber-100/50 top-1/3 -right-40" />
      <div className="ambient-glow bg-pink-200/50 bottom-1/4 left-1/4" />

      {/* Top Navigation */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/journey')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 hover:bg-rose-50 border border-rose-200/80 text-rose-800 text-xs sm:text-sm font-medium transition-colors shadow-sm backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Journey Timeline</span>
        </button>

        <div className="flex items-center gap-2">
          <SessionActions />
          <button
            onClick={triggerConfetti}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-amber-50 text-amber-700 border border-amber-300 text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Confetti 🎉</span>
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pt-8 pb-16 text-center">
        {/* Sweet Sub-Header Pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/80 border border-rose-200/90 text-rose-700 text-xs sm:text-sm font-semibold uppercase tracking-widest mb-6 backdrop-blur-sm shadow-sm"
        >
          <Cake className="w-4 h-4 text-rose-500 animate-bounce" />
          <span>IT'S FINALLY HERE ❤️</span>
          <Cake className="w-4 h-4 text-rose-500 animate-bounce" />
        </motion.div>

        {/* Big Romantic Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1 }}
          className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-tight text-gray-900 mb-4"
        >
          HAPPY BIRTHDAY, <br />
          <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 bg-clip-text text-transparent">
            {config.boyfriendName.toUpperCase()} ❤️
          </span>
        </motion.h1>

        {/* Emotional Subtitle Quotes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="max-w-2xl mx-auto mb-12 space-y-2 text-gray-700"
        >
          <p className="font-serif text-xl sm:text-2xl italic text-rose-900 font-semibold">
            "19 days led to this very moment."
          </p>
          <p className="text-sm sm:text-base text-gray-600 font-light">
            Every day was a little surprise... but today is all about YOU.
          </p>
        </motion.div>

        {/* SECTION: FINAL BIRTHDAY VIDEO */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.3 }}
          className="relative max-w-3xl mx-auto"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-rose-400 via-pink-300 to-amber-200 rounded-3xl blur-xl opacity-60 animate-pulse pointer-events-none" />

          <div className="relative rounded-3xl p-6 sm:p-8 bg-white/95 border border-rose-200/90 shadow-romantic-lg backdrop-blur-xl">
            <div className="flex items-center justify-center gap-2 text-rose-600 mb-2">
              <Gift className="w-5 h-5 text-rose-500" />
              <span className="text-xs uppercase tracking-widest font-bold">
                The Grand Finale Video
              </span>
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              I saved my biggest surprise for today.
            </h3>

            <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto mb-6">
              A special video letter filled with all the words my heart holds for you.
            </p>

            {/* Video Player or graceful availability state */}
            {!birthdayVideo.available || !birthdayVideo.videoUrl ? (
              <div className="aspect-video w-full rounded-2xl bg-gradient-to-br from-rose-900 to-black border border-rose-400/40 flex flex-col items-center justify-center p-6 text-center">
                <Gift className="w-10 h-10 text-rose-300 mb-3" />
                <span className="font-semibold text-base sm:text-lg text-white">
                  {birthdayVideo.loading ? 'Preparing your birthday surprise...' : birthdayVideo.error ? 'Your surprise is taking a little longer to prepare.' : 'Coming Soon ❤️'}
                </span>
                {!birthdayVideo.loading && !birthdayVideo.error && (
                  <span className="text-xs text-rose-200/80 mt-1">Your birthday video will appear here when it is ready.</span>
                )}
              </div>
            ) : !isPlayingGrandVideo ? (
              <div
                className="aspect-video w-full rounded-2xl bg-gradient-to-br from-rose-900 to-black border border-rose-400/40 flex flex-col items-center justify-center p-6 text-center group cursor-pointer hover:border-rose-400 transition-all shadow-inner relative overflow-hidden"
                onClick={() => {
                  setIsPlayingGrandVideo(true);
                  triggerConfetti();
                }}
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform mb-4">
                  <Play className="w-8 h-8 fill-white translate-x-1" />
                </div>
                <span className="font-semibold text-base sm:text-lg text-white group-hover:text-rose-200 transition-colors">
                  Play Your Birthday Surprise ❤️
                </span>
                <span className="text-xs text-rose-200/80 mt-1">
                  Click to play with sound
                </span>
              </div>
            ) : (
              <VideoPlayer
                videoSrc={`${API_BASE}${birthdayVideo.videoUrl}`}
                dayNumber={19}
                title="Happy Birthday My Love ❤️"
                onEnded={() => triggerConfetti()}
              />
            )}
          </div>
        </motion.div>
      </section>

      {/* DIVIDER */}
      <div className="w-24 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent mx-auto my-6" />

      {/* SECTION: PHOTO / MEMORY GALLERY */}
      <MemoryGallery />

      {/* DIVIDER */}
      <div className="w-24 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent mx-auto my-6" />

      {/* SECTION: 19 THINGS I LOVE ABOUT YOU */}
      <LoveReasons />

      {/* DIVIDER */}
      <div className="w-24 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent mx-auto my-6" />

      {/* SECTION: REACTION GALLERY */}
      {user.role === 'OWNER' && <ReactionGallery />}

      {/* FINAL EMOTIONAL LOVE LETTER */}
      <section className="relative z-10 max-w-2xl mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-panel p-8 sm:p-12 rounded-3xl border border-rose-200/90 shadow-romantic-lg relative overflow-hidden"
        >
          <div className="w-16 h-16 rounded-full bg-rose-100 mx-auto mb-6 flex items-center justify-center text-rose-500 border border-rose-200">
            <Heart className="w-8 h-8 fill-rose-500 text-rose-500 animate-pulse" />
          </div>

          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-rose-900 mb-4">
            Forever & Always, My Heart Is Yours
          </h3>

          <p className="text-sm sm:text-base text-gray-700 leading-relaxed font-light mb-6">
            "Thank you for being my anchor, my sweetest comfort, and my favorite adventure.
            No matter how many years pass or where life leads us, I will always celebrate the wonderful soul that you are.
            May this year bring you all the endless joy, warmth, and dreams your heart desires."
          </p>

          <span className="font-script text-3xl sm:text-4xl text-rose-600 block mb-6">
            {config.finalMessage}
          </span>

          <div className="pt-6 border-t border-rose-200 text-xs text-rose-800/70 font-mono">
            October 19, 2026 • Made With Endless Love
          </div>
        </motion.div>
      </section>

      {/* Romantic Footer */}
      <footer className="relative z-10 py-8 text-center text-xs text-rose-900/60 border-t border-rose-200/60 font-light">
        Crafted exclusively for {config.boyfriendName} • 19 Days of Us ❤️
      </footer>
    </div>
  );
}
