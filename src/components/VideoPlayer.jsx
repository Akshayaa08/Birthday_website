import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, AlertCircle, Heart, Sparkles, CheckCircle } from 'lucide-react';

export default function VideoPlayer({ videoSrc, onEnded, onPlaybackStarted, allowSimulation = true, allowSeeking = true, title = "Today's Surprise" }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setHasVideoError(false);
    };
    const handlePlay = () => {
      setIsPlaying(true);
    };
    const handlePlaying = () => {
      if (onPlaybackStarted) onPlaybackStarted();
    };
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      if (onEnded) onEnded();
    };
    const handleError = () => {
      setHasVideoError(true);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [onEnded, onPlaybackStarted]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch((err) => {
        console.warn('Playback error:', err);
      });
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!allowSeeking || !video || !duration) return;
    const newTime = (Number(e.target.value) / 100) * duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.warn(err));
    } else {
      document.exitFullscreen().catch((err) => console.warn(err));
    }
  };

  // Helper for formatting time (mm:ss)
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Simulated playback for demo when local video is not yet placed
  const handleSimulateWatch = () => {
    setIsSimulating(true);
    let p = 0;
    const timer = setInterval(() => {
      p += 5;
      setSimulatedProgress(p);
      if (p >= 100) {
        clearInterval(timer);
        setIsSimulating(false);
        if (onEnded) onEnded();
      }
    }, 250);
  };

  const retryVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    setHasVideoError(false);
    video.load();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-3xl mx-auto rounded-3xl overflow-hidden shadow-2xl bg-black/90 border-2 border-rose-300/50 aspect-video flex flex-col justify-end group"
    >
      {/* Real Video Element */}
      <video
        ref={videoRef}
        src={videoSrc}
        crossOrigin="use-credentials"
        playsInline
        preload="metadata"
        className={`w-full h-full object-contain ${hasVideoError ? 'hidden' : 'block'}`}
      />

      {/* Fallback View when the authenticated video stream cannot be loaded */}
      {hasVideoError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-rose-950/90 via-black to-pink-950/80">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-400/50 flex items-center justify-center mb-4 text-rose-400"
          >
            <Heart className="w-8 h-8 fill-rose-500 text-rose-400" />
          </motion.div>

          <h4 className="font-serif text-xl sm:text-2xl text-rose-100 font-bold mb-1">
            {title}
          </h4>

          <p className="text-xs sm:text-sm text-rose-200/80 max-w-md mb-4">
            We couldn't load this surprise right now. Please try again.
          </p>

          <button
            onClick={retryVideo}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold transition-colors"
          >
            Try Again
          </button>

          {allowSimulation && <button
            onClick={handleSimulateWatch}
            disabled={isSimulating}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs sm:text-sm font-semibold shadow-lg transition-transform active:scale-95"
          >
            {isSimulating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Simulating Video ({simulatedProgress}%)...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Simulate Watching Surprise</span>
              </>
            )}
          </button>}
        </div>
      )}

      {/* Center Big Play Button Overlay (when video paused and valid) */}
      {!hasVideoError && !isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-rose-500/80 hover:bg-rose-500 text-white flex items-center justify-center shadow-romantic-glow transition-transform hover:scale-110 active:scale-95"
          aria-label="Play video"
        >
          <Play className="w-9 h-9 fill-white translate-x-1" />
        </button>
      )}

      {/* Bottom Floating Control Bar */}
      {!hasVideoError && (
        <div className="relative z-20 w-full p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300">
          {/* Progress Bar */}
          <input
            type="range"
            min="0"
            max="100"
            value={duration ? (currentTime / duration) * 100 : 0}
            onChange={handleSeek}
            disabled={!allowSeeking}
            aria-label="Video progress"
            className={`w-full h-1.5 bg-white/30 rounded-lg appearance-none accent-rose-500 mb-3 ${allowSeeking ? 'cursor-pointer' : 'cursor-default'}`}
          />

          <div className="flex items-center justify-between text-white text-xs sm:text-sm">
            {/* Play/Pause & Time */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-1 hover:text-rose-400 transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
              </button>

              <span className="font-mono text-xs text-rose-200">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Mute & Fullscreen */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMute}
                className="p-1 hover:text-rose-400 transition-colors"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-1 hover:text-rose-400 transition-colors"
                aria-label="Toggle Fullscreen"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
