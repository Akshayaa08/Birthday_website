import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, AlertCircle, Sparkles, Check, StopCircle, RefreshCw } from 'lucide-react';
import {
  createRecordingSession,
  uploadReactionChunk,
  finalizeReactionSession,
  markSessionIncomplete,
} from '../services/reactionService';

const CameraRecorder = forwardRef(function CameraRecorder(
  {
    isRecordingActive,
    dayNumber,
    date,
    sessionId: propSessionId,
    onSessionStarted,
    onRecordingFinalized,
    onError,
    onStopRequested,
  },
  ref
) {
  const videoPreviewRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunkIndexRef = useRef(0);
  const allChunksRef = useRef([]);
  const sessionIdRef = useRef(propSessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const isFinalizedRef = useRef(false);
  const activeUploadsCountRef = useRef(0);
  const uploadQueueRef = useRef([]);

  const [hasPermission, setHasPermission] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [savedSeconds, setSavedSeconds] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Your reaction is being saved while you watch ❤️');
  const [isNetworkRetrying, setIsNetworkRetrying] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // Expose stopAndFinalize to parent component via ref
  useImperativeHandle(ref, () => ({
    stopAndFinalize,
  }));

  // Track recording elapsed time
  useEffect(() => {
    if (!hasPermission || isFinishing) return;
    const interval = setInterval(() => {
      setSavedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [hasPermission, isFinishing]);

  // Handle uploading chunk safely with queue & retry
  const handleUploadChunk = async (blob, chunkNum) => {
    activeUploadsCountRef.current += 1;
    const res = await uploadReactionChunk({
      sessionId: sessionIdRef.current,
      dayNumber,
      chunkNumber: chunkNum,
      chunkBlob: blob,
    });
    activeUploadsCountRef.current -= 1;

    if (!res.success) {
      setIsNetworkRetrying(true);
      setStatusMessage('Connection interrupted — saving when connection returns ❤️');
    } else {
      setIsNetworkRetrying(false);
      setStatusMessage('Your reaction is being saved while you watch ❤️');
    }
  };

  // Safely stop MediaRecorder, upload final chunk, and finalize session
  const stopAndFinalize = async () => {
    if (isFinalizedRef.current) return;
    isFinalizedRef.current = true;
    setIsFinishing(true);
    setStatusMessage('Finalizing your keepsake reaction ❤️...');

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        // Request any buffered data before stopping to avoid losing the tail
        if (typeof recorder.requestData === 'function') {
          recorder.requestData();
        }
        recorder.stop();
      } catch (e) {
        console.warn('MediaRecorder stop warning:', e);
      }
    }

    // Give pending dataavailable and network chunk uploads a moment to settle
    await new Promise((r) => setTimeout(r, 600));

    // Wait until in-flight chunk uploads finish (up to 4s)
    let waitCount = 0;
    while (activeUploadsCountRef.current > 0 && waitCount < 8) {
      await new Promise((r) => setTimeout(r, 500));
      waitCount++;
    }

    // Stop all media tracks (camera & microphone turn off immediately)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Build local fallback blob if available
    let fallbackBlob = null;
    if (allChunksRef.current.length > 0) {
      fallbackBlob = new Blob(allChunksRef.current, { type: 'video/webm' });
    }

    try {
      const finalizeRes = await finalizeReactionSession({
        sessionId: sessionIdRef.current,
        dayNumber,
        date,
        localFallbackBlob: fallbackBlob,
      });

      if (onRecordingFinalized) {
        onRecordingFinalized(finalizeRes.data?.reaction);
      }
    } catch (err) {
      console.warn('Finalize error, using fallback:', err);
      if (onRecordingFinalized) {
        onRecordingFinalized(null);
      }
    }
  };

  // Initialize camera, start continuous timeslice recording
  useEffect(() => {
    let isCancelled = false;

    async function initCamera() {
      setIsInitializing(true);
      setErrorMessage(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const err = 'Camera access is not supported by your browser.';
        setErrorMessage(err);
        setIsInitializing(false);
        if (onError) onError(err);
        return;
      }

      if (typeof MediaRecorder === 'undefined') {
        const err = 'MediaRecorder is not supported by your browser.';
        setErrorMessage(err);
        setIsInitializing(false);
        if (onError) onError(err);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: true,
        });

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        setHasPermission(true);

        // Bind live stream to preview element
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }

        // Determine best supported mimeType
        const preferredTypes = [
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm',
          'video/mp4',
        ];
        const mimeType = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t)) || '';
        const recorderOptions = mimeType ? { mimeType } : undefined;

        const mediaRecorder = new MediaRecorder(stream, recorderOptions);
        mediaRecorderRef.current = mediaRecorder;
        allChunksRef.current = [];
        chunkIndexRef.current = 0;

        // Create recording session on backend
        await createRecordingSession({
          sessionId: sessionIdRef.current,
          dayNumber,
          date,
        });

        if (onSessionStarted) {
          onSessionStarted(sessionIdRef.current);
        }

        // Handle timeslice chunks generated approximately every 5 seconds
        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            allChunksRef.current.push(event.data);
            const currentChunkNum = chunkIndexRef.current;
            chunkIndexRef.current += 1;

            // Save chunk immediately to backend
            handleUploadChunk(event.data, currentChunkNum);
          }
        };

        // Start timesliced recording with 5000ms slices (generates a chunk every ~5 seconds)
        mediaRecorder.start(5000);
        setIsInitializing(false);
      } catch (err) {
        console.warn('Camera access denied or error:', err);
        setIsInitializing(false);
        const friendly =
          err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
            ? "Camera permission was not granted ❤️ You can still watch today's video."
            : 'Could not access camera/microphone.';
        setErrorMessage(friendly);
        if (onError) onError(friendly);
      }
    }

    if (isRecordingActive) {
      initCamera();
    }

    // Cleanup on unmount
    return () => {
      isCancelled = true;
      if (!isFinalizedRef.current && sessionIdRef.current) {
        // Mark session incomplete to keep chunks safe if user leaves page
        markSessionIncomplete(sessionIdRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isRecordingActive, dayNumber, date]);

  if (errorMessage) {
    return (
      <div className="bg-white/95 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-2xl flex items-center gap-2 max-w-sm mx-auto shadow-sm">
        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
        <span>{errorMessage}</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          className="relative w-48 sm:w-60 bg-gray-950 rounded-3xl overflow-hidden shadow-2xl border-2 border-rose-400"
        >
          {/* Live Mirror Camera Preview */}
          <div className="relative aspect-[4/3] bg-black">
            <video
              ref={videoPreviewRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }} // Mirror view for natural camera feedback
            />

            {/* Pulsing Recording Indicator */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/90 text-white text-[10px] font-bold tracking-wider uppercase shadow-md">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>RECORDING</span>
            </div>

            {/* Video icon */}
            <div className="absolute top-2.5 right-2.5 p-1 rounded-full bg-black/50 text-rose-300">
              <Video className="w-3.5 h-3.5" />
            </div>

            {/* Saved timer overlay */}
            <div className="absolute bottom-2 left-2.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-white text-[10px] font-mono flex items-center gap-1">
              <span className="text-emerald-400">●</span>
              <span>Saved: {savedSeconds}s</span>
            </div>
          </div>

          {/* Reassuring Status Banner */}
          <div className="p-3 bg-gradient-to-t from-gray-950 via-gray-900 to-gray-900 text-center border-t border-gray-800">
            <p className="text-[11px] font-medium text-rose-200 leading-snug mb-1.5">
              {statusMessage}
            </p>

            <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-800/80">
              <span className="text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Reaction saving</span>
              </span>

              {/* Stop Recording Manual Trigger */}
              <button
                type="button"
                onClick={() => {
                  if (onStopRequested) {
                    onStopRequested();
                  } else {
                    stopAndFinalize();
                  }
                }}
                disabled={isFinishing}
                className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 transition-colors"
                title="Finish recording and save reaction"
              >
                <StopCircle className="w-3.5 h-3.5" />
                <span>{isFinishing ? 'Saving...' : 'Stop'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

export default CameraRecorder;
