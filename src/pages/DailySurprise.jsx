import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Video,
  ArrowLeft,
  Sparkles,
  Lock,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { days } from '../data/days';
import { config } from '../data/config';
import { getDayStatus, formatReadableDate } from '../utils/dateUtils';
import { API_BASE, apiFetch } from '../services/api';
import VideoPlayer from '../components/VideoPlayer';
import CameraRecorder from '../components/CameraRecorder';
import FloatingHearts from '../components/FloatingHearts';
import { markSessionIncomplete } from '../services/reactionService';
import { recordVideoCompleted, recordVideoSeen, recordVideoWatching } from '../services/activityService';
import SessionActions from '../components/SessionActions';
import { useAuth } from '../contexts/AuthContext';

export default function DailySurprise() {
  const { dayNumber } = useParams();
  const navigate = useNavigate();
  const { user, ownerTestDate } = useAuth();
  const isOwner = user.role === 'OWNER';

  const dayNum = parseInt(dayNumber, 10);
  const dayData = days.find((d) => d.day === dayNum);

  // Phases: 'consent' | 'watching' | 'completed'
  const [phase, setPhase] = useState('consent');
  const [recordReaction, setRecordReaction] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [recordingSessionId, setRecordingSessionId] = useState(null);
  const [recordingError, setRecordingError] = useState('');
  const [activityError, setActivityError] = useState('');
  const [videoAvailability, setVideoAvailability] = useState({
    loading: true,
    available: false,
    videoUrl: null,
    error: '',
  });

  // Unique session ID for continuous recording
  const sessionIdRef = useRef(
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  );

  const recorderRef = useRef(null);
  const videoEndedRef = useRef(false);
  const hasReportedVideoStartRef = useRef(false);
  const activityStartPromiseRef = useRef(Promise.resolve());
  const activityStartFailedRef = useRef(false);

  useEffect(() => {
    if (dayNum === 1) console.info('[Birthday] Day opened', { dayNumber: dayNum });
  }, [dayNum]);

  useEffect(() => {
    let active = true;
    if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 19) return undefined;

    if (!dayData || getDayStatus(dayData.date, ownerTestDate) === 'LOCKED') {
      setVideoAvailability({ loading: false, available: false, videoUrl: null, error: '' });
      return undefined;
    }

    setVideoAvailability({ loading: true, available: false, videoUrl: null, error: '' });
    apiFetch(`/api/videos/${dayNum}/details`)
      .then((result) => {
        if (!active) return;
        setVideoAvailability({
          loading: false,
          available: result.available === true && typeof result.videoUrl === 'string',
          videoUrl: typeof result.videoUrl === 'string' ? result.videoUrl : null,
          error: '',
        });
      })
      .catch((error) => {
        if (!active) return;
        setVideoAvailability({
          loading: false,
          available: false,
          videoUrl: null,
          error: error.message || 'Could not check this surprise.',
        });
      });

    return () => {
      active = false;
    };
  }, [dayNum, dayData, ownerTestDate]);

  // Handle page unload or refresh: mark session as incomplete so server keeps chunks safe
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (recordReaction && phase === 'watching' && !isFinalizing) {
        markSessionIncomplete(sessionIdRef.current);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [recordReaction, phase, isFinalizing]);

  useEffect(() => {
    if (dayNum !== 1 || phase !== 'watching' || !videoAvailability.available) return;
    if (!isOwner && !recordingSessionId) return;

    const videoSrc = isOwner
      ? `${API_BASE}${videoAvailability.videoUrl}`
      : `${API_BASE}/api/videos/1/stream?sessionId=${encodeURIComponent(recordingSessionId)}`;
    console.info('[Video] Video URL:', videoSrc);
  }, [dayNum, isOwner, phase, recordingSessionId, videoAvailability.available, videoAvailability.videoUrl]);

  // If invalid day
  if (!dayData) {
    return (
      <div className="min-h-screen romantic-bg flex items-center justify-center p-6 text-center">
        <div className="glass-panel p-8 rounded-3xl max-w-md shadow-romantic">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="font-serif text-2xl font-bold mb-2">Surprise Not Found</h2>
          <p className="text-gray-600 text-sm mb-6">
            We couldn't find Day {dayNumber} in your 19-day journey.
          </p>
          <button
            onClick={() => navigate('/journey')}
            className="px-6 py-2.5 rounded-full bg-rose-500 text-white font-medium text-sm"
          >
            Back to Journey
          </button>
        </div>
      </div>
    );
  }

  const status = getDayStatus(dayData.date, ownerTestDate);
  const videoSrc = videoAvailability.videoUrl
    ? isOwner
      ? `${API_BASE}${videoAvailability.videoUrl}`
      : recordingSessionId
        ? `${API_BASE}/api/videos/${dayData.day}/stream?sessionId=${encodeURIComponent(recordingSessionId)}`
        : null
    : null;

  // Enforce security / date locking: if today < surprise date, refuse access
  if (status === 'LOCKED') {
    return (
      <div className="min-h-screen romantic-bg flex items-center justify-center p-6 text-center">
        <FloatingHearts count={10} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-8 rounded-3xl max-w-md mx-auto shadow-2xl relative z-10 border border-rose-200"
        >
          <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4 text-rose-500">
            <Lock className="w-8 h-8" />
          </div>
          <span className="text-xs uppercase tracking-wider font-semibold text-rose-600 block mb-1">
            Day {dayData.day < 10 ? `0${dayData.day}` : dayData.day} • {formatReadableDate(dayData.date, true)}
          </span>
          <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2">
            Not yet, my love ❤️
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            This little surprise is waiting for you. Come back on{' '}
            <strong className="text-rose-600 font-semibold">{formatReadableDate(dayData.date)}</strong>.
          </p>
          <button
            onClick={() => navigate('/journey')}
            className="w-full py-3 px-6 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-medium text-sm shadow-romantic transition-all"
          >
            Back to Journey
          </button>
        </motion.div>
      </div>
    );
  }

  const handleStartExperience = () => {
    if (!videoAvailability.available || !videoAvailability.videoUrl) return;
    setRecordingError('');
    setActivityError('');
    videoEndedRef.current = false;
    hasReportedVideoStartRef.current = false;
    activityStartFailedRef.current = false;
    activityStartPromiseRef.current = Promise.resolve();
    sessionIdRef.current = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    setRecordingSessionId(null);
    setRecordReaction(!isOwner);
    setPhase('watching');
  };

  const handleVideoStarted = () => {
    if (isOwner || hasReportedVideoStartRef.current) return;
    hasReportedVideoStartRef.current = true;
    activityStartPromiseRef.current = recordVideoSeen(dayData.day)
      .then(() => recordVideoWatching(dayData.day))
      .catch((error) => {
        activityStartFailedRef.current = true;
        setActivityError('Could not save when this video started playing.');
        console.error('Could not save video seen event:', error);
      });
  };

  // Triggered when daily video ends
  const handleVideoEnded = async () => {
    if (videoEndedRef.current) return;
    videoEndedRef.current = true;
    if (!isOwner) {
      try {
        await activityStartPromiseRef.current;
        if (activityStartFailedRef.current) {
          throw new Error('The video start event was not saved.');
        }
        await recordVideoCompleted(dayData.day);
      } catch (error) {
        setActivityError('The video ended, but viewing activity could not be saved.');
        console.error('Could not save video completion event:', error);
      }
    }
    if (recordReaction && recorderRef.current) {
      setIsFinalizing(true);
      setUploadMessage('Saving your final reaction chunk with love...');
      await recorderRef.current.stopAndFinalize();
    } else {
      setPhase('completed');
    }
  };

  // Triggered when recorder completes finalization
  const handleRecordingFinalized = (finalReaction) => {
    setIsFinalizing(false);
    if (finalReaction) {
      setUploadMessage('Your reaction is safely preserved in our birthday keepsake ❤️');
      setPhase('completed');
    } else {
      setRecordingError('The reaction could not be saved. Please record again to continue.');
      setRecordReaction(false);
      setRecordingSessionId(null);
      setPhase('consent');
    }
  };

  return (
    <div className="relative min-h-screen romantic-bg overflow-x-hidden flex flex-col justify-between pb-16">
      <FloatingHearts count={14} />

      {/* Top Navigation */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/journey')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/85 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium hover:bg-rose-50 transition-colors shadow-sm backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Timeline</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-rose-800 bg-white/80 px-3.5 py-1.5 rounded-full border border-rose-200/80 shadow-sm">
          <Calendar className="w-3.5 h-3.5 text-rose-500" />
          <span>{formatReadableDate(dayData.date)}</span>
        </div>
        <SessionActions />
      </header>

      {/* Main Content Sections based on phase */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 w-full my-auto py-6">
        <AnimatePresence mode="wait">
          {/* STEP 1: Consent / Transparent Permission Choice */}
          {phase === 'consent' && (
            <motion.div
              key="consent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-xl mx-auto text-center glass-panel p-8 sm:p-10 rounded-3xl shadow-romantic-lg border border-rose-200"
            >
              <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4 text-rose-500 shadow-inner">
                <Heart className="w-8 h-8 fill-rose-400 text-rose-500 animate-pulse" />
              </div>

              <span className="text-xs uppercase tracking-widest font-bold text-rose-600 mb-1 block">
                DAY {dayData.day < 10 ? `0${dayData.day}` : dayData.day} • {formatReadableDate(dayData.date, true)}
              </span>

              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                {dayData.title}
              </h2>

              <p className="text-gray-600 text-sm sm:text-base italic mb-8">
                "{dayData.subtitle}"
              </p>
              {recordingError && <p role="alert" className="text-sm text-red-700 mb-4">{recordingError}</p>}

              {videoAvailability.loading ? (
                <p className="text-sm text-rose-700 mb-8">Preparing today's surprise...</p>
              ) : videoAvailability.error ? (
                <p role="alert" className="text-sm text-red-700 mb-8">
                  We couldn't check today's surprise. Please refresh the page and try again.
                </p>
              ) : !videoAvailability.available ? (
                <div className="bg-rose-50/90 rounded-2xl p-5 mb-8 border border-rose-200/80">
                  <h4 className="font-semibold text-rose-950 text-sm mb-1">Coming Soon ❤️</h4>
                  <p className="text-sm text-gray-700">This surprise is getting ready. Please come back when it is available.</p>
                </div>
              ) : (
                <>
                  {/* Romantic Camera Consent Prompt */}
                  <div className="bg-rose-50/90 rounded-2xl p-5 mb-8 text-left border border-rose-200/80">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-white text-rose-500 shadow-sm shrink-0 mt-0.5">
                        <Video className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-rose-950 text-sm mb-1">
                          {isOwner ? 'System preview' : 'Before your surprise begins ❤️'}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed mb-2">
                          {isOwner
                            ? 'Watch the daily video without camera or microphone access.'
                            : 'I need access to your camera and microphone so I can capture your reaction.'}
                        </p>
                        {!isOwner && (
                          <>
                            <p className="text-xs text-gray-700">Please enable:</p>
                            <p className="text-xs text-gray-700">📷 Camera</p>
                            <p className="text-xs text-gray-700">🎤 Microphone</p>
                            <p className="text-[11px] text-gray-500 mt-2">Your reaction is part of the surprise ❤️</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={handleStartExperience}
                      type="button"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-sm font-semibold shadow-romantic hover:shadow-romantic-lg transition-all duration-300 hover:scale-[1.02]"
                    >
                      <Video className="w-4 h-4" />
                      <span>{isOwner ? 'Watch Surprise' : recordingError ? 'Try Again' : 'Enable Camera & Microphone'}</span>
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* STEP 2: Watching Video (with independent CameraRecorder running in background) */}
          {phase === 'watching' && (
            <motion.div
              key="watching"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <span className="text-xs uppercase tracking-wider font-semibold text-rose-600 block mb-1">
                  Day {dayData.day < 10 ? `0${dayData.day}` : dayData.day}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                  {dayData.title}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600">{dayData.subtitle}</p>
              </div>

              {/* Independent Daily Video Player */}
              {(isOwner || recordingSessionId) && videoAvailability.available && videoSrc ? (
                <VideoPlayer
                  videoSrc={videoSrc}
                  dayNumber={dayData.day}
                  onPlaybackStarted={handleVideoStarted}
                  onEnded={handleVideoEnded}
                  allowSimulation={false}
                  allowSeeking={isOwner}
                  title={dayData.title}
                />
              ) : (
                <div className="aspect-video w-full rounded-3xl bg-white/80 border border-rose-200 flex items-center justify-center text-sm text-rose-700">
                  {recordingError ? 'Camera and microphone are required to continue.' : 'Starting your reaction recording...'}
                </div>
              )}

              {/* Independent Continuous Camera Recorder */}
              {recordReaction && (
                <CameraRecorder
                  ref={recorderRef}
                  isRecordingActive={true}
                  dayNumber={dayData.day}
                  date={dayData.date}
                  sessionId={sessionIdRef.current}
                  onRecordingReady={setRecordingSessionId}
                  onRecordingFinalized={handleRecordingFinalized}
                  onError={(msg) => {
                    setRecordingError(msg);
                    setRecordingSessionId(null);
                    setRecordReaction(false);
                    setPhase('consent');
                  }}
                />
              )}
              {recordingError && !isOwner && (
                <div className="text-center">
                  <p role="alert" className="text-sm text-red-700 mb-2">{recordingError}</p>
                  <button type="button" onClick={() => setPhase('consent')} className="text-sm font-semibold text-rose-700 underline">Try recording again</button>
                </div>
              )}

              {activityError && <p role="alert" className="text-center text-sm text-red-700">{activityError}</p>}
            </motion.div>
          )}

          {/* STEP 3: Completed Screen */}
          {phase === 'completed' && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto text-center glass-panel p-8 sm:p-10 rounded-3xl shadow-romantic-lg border border-rose-200"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-inner"
              >
                <CheckCircle2 className="w-10 h-10" />
              </motion.div>

              <span className="text-xs uppercase tracking-widest font-bold text-emerald-600 mb-1 block">
                {`DAY ${dayData.day} COMPLETED`}
              </span>

              <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2">
                I Hope You Loved It ❤️
              </h2>

              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                Thank you for sharing this moment with me, {config.boyfriendName}. Another little memory added to our collection.
              </p>

              {uploadMessage && (
                <div className="mb-6 py-2.5 px-4 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200/80 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-500" />
                  <span>{uploadMessage}</span>
                </div>
              )}
              {activityError && <p role="alert" className="mb-4 text-sm text-red-700">{activityError}</p>}

              <button
                onClick={() => navigate('/journey')}
                className="w-full py-3.5 px-6 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-medium text-sm sm:text-base shadow-romantic transition-all hover:scale-[1.02]"
              >
                Return to Journey Timeline
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-rose-900/60 font-light">
        19 Days of Us • Crafted with all my love ❤️
      </footer>
    </div>
  );
}
