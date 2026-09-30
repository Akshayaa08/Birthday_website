import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';
import { motion } from 'framer-motion';
import { config } from '../data/config';

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      // Audio file might not be placed in public/music/ yet
      setHasError(true);
      setIsPlaying(false);
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      setHasError(false);
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("Audio playback couldn't start yet:", err);
          // If file not found yet, show friendly feedback
          setHasError(true);
        });
    }
  };

  return (
    <>
      <audio ref={audioRef} src={config.music} loop preload="none" />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="fixed top-4 right-4 z-50"
      >
        <button
          onClick={toggleMusic}
          type="button"
          aria-label={isPlaying ? "Pause romantic music" : "Play our romantic song"}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 shadow-md backdrop-blur-md border ${
            isPlaying
              ? 'bg-rose-500/90 text-white border-rose-400 shadow-rose-300/50 hover:bg-rose-600'
              : 'bg-white/80 text-rose-800 border-rose-200/80 hover:bg-rose-50 hover:border-rose-300'
          }`}
        >
          {isPlaying ? (
            <>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <Volume2 className="w-4 h-4 animate-pulse" />
              <span>♫ Our song is playing</span>
            </>
          ) : (
            <>
              <Music className="w-4 h-4 text-rose-500" />
              <span>♪ Play our song</span>
            </>
          )}
        </button>

        {hasError && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-12 right-0 bg-white/95 text-rose-900 border border-rose-200 text-[11px] p-2 rounded-xl shadow-lg w-48 text-center"
          >
            Add your song to <code className="text-rose-600 font-mono">public/music/our-song.mp3</code> ❤️
          </motion.div>
        )}
      </motion.div>
    </>
  );
}
